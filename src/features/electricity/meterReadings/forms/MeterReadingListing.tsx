import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  deleteEntity,
  fetchAllEntities,
  fetchPagedResult,
} from "../../../../api/genericCrudApi";

import SharedListingTable from "../../../shared/SharedListingTable";
import { useCurrentMenu } from "../../../../hooks/useCurrentMenu";
import { safeValue, formatDateDmy } from "../../../../utils/format";
import {
  showDeleteConfirmation,
  showDeleteResult,
} from "../../../../utils/alerts/showDeleteConfirmation";

import type { MeterReadingDTO } from "../../../../types/MeterReadingDTO";
import type { ReadingTypeDTO } from "../../../../types/ReadingTypeDTO";

type MeterFlatOwnerLookup = {
  meterId: number;
  meterNumber?: string | null;
  flatId?: number | null;
  flatNumber?: string | null;
  ownerName?: string | null;
  isActive?: boolean;
};

type SortField = keyof MeterReadingDTO;

const ENTITY_NAME = "Meter Reading";

function buildIdLabelMap<T extends object, K extends keyof T>(
  items: T[],
  idKey: K,
  getLabel: (item: T) => string
): Record<number, string> {
  const map: Record<number, string> = {};
  for (const item of items) {
    const idVal = item[idKey];
    if (typeof idVal === "number") {
      const label = getLabel(item).trim();
      map[idVal] = label;
    }
  }
  return map;
}

const DEFAULT_PAGE_SIZE = 8;

const parseSortableDate = (v: unknown): number | null => {
  if (v == null) return null;

  if (v instanceof Date) {
    const t = v.getTime();
    return Number.isNaN(t) ? null : t;
  }

  const s = String(v).trim();
  if (!s) return null;

  // supports "YYYY-MM-DD..." and many ISO variants
  const iso = Date.parse(s);
  if (!Number.isNaN(iso)) return iso;

  // supports "dd-MM-yyyy"
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s);
  if (m) {
    const dd = Number(m[1]);
    const mm = Number(m[2]);
    const yy = Number(m[3]);
    if (
      Number.isFinite(dd) &&
      Number.isFinite(mm) &&
      Number.isFinite(yy) &&
      yy >= 1900 &&
      yy <= 2099 &&
      mm >= 1 &&
      mm <= 12 &&
      dd >= 1 &&
      dd <= 31
    ) {
      const t = Date.parse(`${yy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`);
      return Number.isNaN(t) ? null : t;
    }
  }

  return null;
};

const MeterReadingListing: React.FC = () => {
  const navigate = useNavigate();
  const { createRoutePath } = useCurrentMenu();

  const [rows, setRows] = useState<MeterReadingDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [meterLookups, setMeterLookups] = useState<MeterFlatOwnerLookup[]>([]);
  const [readingTypes, setReadingTypes] = useState<ReadingTypeDTO[]>([]);

  const [sortField, setSortField] = useState<SortField>("readingDate");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);

  const ENDPOINTS = useMemo(
    () => ({
      listPaged: "/meterreading/Get-All-MeterReadings-Paged",
      delete: "/meterreading/Delete-MeterReading",
      meterFlatOwnerLookup: "/meterreading/Get-Meter-FlatOwner-Lookup",
      readingTypes: "/meterreading/Get-All-ReadingTypes",
    }),
    []
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const query = `${ENDPOINTS.listPaged}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
        const res = await fetchPagedResult<MeterReadingDTO>(query);

        setRows(res.items);
        setTotalCount(res.totalCount);
        setTotalPages(res.totalPages);
      } catch (err) {
        console.error("Failed to load meter readings:", err);
        setRows([]);
        setTotalCount(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    };

    const loadLookups = async () => {
      try {
        const m = await fetchAllEntities<MeterFlatOwnerLookup>(
          ENDPOINTS.meterFlatOwnerLookup
        );
        setMeterLookups(Array.isArray(m) ? m : []);
      } catch {
        setMeterLookups([]);
      }

      try {
        const rt = await fetchAllEntities<ReadingTypeDTO>(
          ENDPOINTS.readingTypes
        );
        setReadingTypes(Array.isArray(rt) ? rt : []);
      } catch {
        setReadingTypes([]);
      }
    };

    void load();
    void loadLookups();
  }, [
    ENDPOINTS.listPaged,
    ENDPOINTS.meterFlatOwnerLookup,
    ENDPOINTS.readingTypes,
    pageNumber,
    pageSize,
  ]);

  const flatOwnerLabelByMeterId = useMemo(() => {
    return buildIdLabelMap(meterLookups, "meterId", (m) => {
      const flatNumber = String(m.flatNumber ?? "").trim();
      const ownerName = String(m.ownerName ?? "").trim();

      if (!flatNumber && !ownerName) return "N/A";
      if (!flatNumber) return ownerName || "N/A";
      if (!ownerName) return `${flatNumber} - N/A`;
      return `${flatNumber} - ${ownerName}`;
    });
  }, [meterLookups]);

  const readingTypeLabelById = useMemo(() => {
    return buildIdLabelMap(readingTypes, "readingTypeId", (t) =>
      String(t.typeName ?? "").trim()
    );
  }, [readingTypes]);

  const sortedRows = useMemo(() => {
    const copy = [...rows];

    const sortFieldName = String(sortField).toLowerCase();
    const isDateField = sortFieldName.includes("date");

    const compare = (va: unknown, vb: unknown): number => {
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;

      if (isDateField) {
        const ta = parseSortableDate(va);
        const tb = parseSortableDate(vb);
        if (ta != null && tb != null) return ta - tb;
      }

      if (typeof va === "number" && typeof vb === "number") return va - vb;

      return String(va).toLowerCase().localeCompare(String(vb).toLowerCase());
    };

    copy.sort((a, b) => {
      const va = a[sortField];
      const vb = b[sortField];
      return sortAsc ? compare(va, vb) : compare(vb, va);
    });

    return copy;
  }, [rows, sortAsc, sortField]);

  const handleEdit = (id?: number) => {
    if (!id || !createRoutePath) return;
    const editPath = createRoutePath.replace(/create$/i, `edit/${id}`);
    navigate(editPath);
  };

  const reloadCurrentPage = async () => {
    try {
      const query = `${ENDPOINTS.listPaged}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
      const res = await fetchPagedResult<MeterReadingDTO>(query);

      setRows(res.items);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;

    const deletedBy = parseInt(localStorage.getItem("userId") ?? "0", 10);
    if (!deletedBy) return;

    const confirmed = await showDeleteConfirmation();
    if (!confirmed) return;

    try {
      await deleteEntity(ENDPOINTS.delete, id, deletedBy);
      setExpandedRowId(null);
      await showDeleteResult(true, ENTITY_NAME);

      await reloadCurrentPage();
    } catch (err) {
      console.error("Failed to delete meter reading:", err);
      await showDeleteResult(false, ENTITY_NAME);
    }
  };

  return (
    <SharedListingTable<MeterReadingDTO>
      data={sortedRows}
      loading={loading}
      sortField={sortField}
      sortAsc={sortAsc}
      onSort={(field) => {
        setSortAsc((prev) => (field === sortField ? !prev : true));
        setSortField(field);
      }}
      onEdit={handleEdit}
      onDelete={handleDelete}
      expandedRowId={expandedRowId}
      onExpand={(id) => setExpandedRowId((prev) => (prev === id ? null : id))}
      getRowKey={(x) => x.meterReadingId ?? 0}
      pagination={{
        pageNumber,
        pageSize,
        totalCount,
        totalPages,
        onPageChange: (next) => {
          if (next > 0) setPageNumber(next);
        },
        onPageSizeChange: (nextSize) => {
          setPageSize(nextSize);
          setPageNumber(1);
        },
        pageSizeOptions: [8, 12, 20, 30, 50, 100],
      }}
      columns={[
        {
          key: "meterId",
          label: "Flat Owner",
          width: "220px",
          renderCell: (x) =>
            flatOwnerLabelByMeterId[x.meterId] ?? "N/A",
        },
        {
          key: "readingDate",
          label: "Reading Date",
          width: "110px",
          renderCell: (x) => formatDateDmy(x.readingDate),
        },
        {
          key: "readingValue",
          label: "Reading Value",
          width: "110px",
          renderCell: (x) => safeValue(x.readingValue),
        },
        {
          key: "readingTypeId",
          label: "Reading Type",
          width: "170px",
          renderCell: (x) =>
            x.readingTypeId
              ? readingTypeLabelById[x.readingTypeId] ??
                `Type #${x.readingTypeId}`
              : "-",
        },
        {
          key: "isEstimated",
          label: "Estimated",
          width: "80px",
          renderCell: (x) => (x.isEstimated ? "Yes" : "No"),
        },
        {
          key: "isActive",
          label: "Active",
          width: "70px",
          renderCell: (x) => (x.isActive ? "Yes" : "No"),
        },
      ]}
      renderExpandedRow={(x) => (
        <>
          <strong>Billing From:</strong> {formatDateDmy(x.billingFromDate)} |{" "}
          <strong>Billing To:</strong> {formatDateDmy(x.billingToDate)} |{" "}
          <strong>Modified Once:</strong>{" "}
          {x.isModifiedOnce == null ? "-" : x.isModifiedOnce ? "Yes" : "No"} |{" "}
          <strong>Notes:</strong> {safeValue(x.notes)}
        </>
      )}
    />
  );
};

export default MeterReadingListing;