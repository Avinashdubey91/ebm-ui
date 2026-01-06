import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { deleteEntity, fetchAllEntities } from "../../../../api/genericCrudApi";

import SharedListingTable from "../../../shared/SharedListingTable";
import { useCurrentMenu } from "../../../../hooks/useCurrentMenu";
import { safeValue, formatDateDmy } from "../../../../utils/format";
import {
  showDeleteConfirmation,
  showDeleteResult,
} from "../../../../utils/alerts/showDeleteConfirmation";

import type { UnitChargeDTO } from "../../../../types/UnitChargeDTO";
import type { CurrencyDTO } from "../../../../types/CurrencyDTO";
import type { RateTypeDTO } from "../../../../types/RateTypeDTO";

import { buildIdLabelMap } from "../../../../utils/formValueUtils";

const ENTITY_NAME = "Unit Charge";

const LOOKUP_ENDPOINTS = {
  currencies: "/unitcharge/Get-All-Currencies",
  rateTypes: "/unitcharge/Get-All-RateTypes",
} as const;

const MONTH_NAMES: readonly string[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const getYearFromYmd = (ymd?: string | null): number | null => {
  if (!ymd || ymd.length < 4) return null;
  const year = Number(ymd.slice(0, 4));
  if (!Number.isFinite(year) || year < 1900 || year > 2099) return null;
  return year;
};

const formatMonthLabel = (monthByte?: number | null, year?: number | null): string => {
  if (!monthByte || monthByte < 1 || monthByte > 12 || !year) return "-";
  return `${MONTH_NAMES[monthByte - 1]} - ${year}`;
};

const UnitChargeListing: React.FC = () => {
  const navigate = useNavigate();
  const { createRoutePath } = useCurrentMenu();

  const [loading, setLoading] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  const [sortField, setSortField] = useState<keyof UnitChargeDTO>("unitChargeId");
  const [sortAsc, setSortAsc] = useState(true);

  const [rows, setRows] = useState<UnitChargeDTO[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyDTO[]>([]);
  const [rateTypes, setRateTypes] = useState<RateTypeDTO[]>([]);

  const ENDPOINTS = useMemo(
    () => ({
      list: "/unitcharge/Get-All-UnitCharges",
      delete: "/unitcharge/Delete-UnitCharge",
    }),
    []
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const listRes = await fetchAllEntities<UnitChargeDTO>(ENDPOINTS.list);
        setRows(Array.isArray(listRes) ? listRes : []);

        // lookups from DB
        try {
          const cur = await fetchAllEntities<CurrencyDTO>(LOOKUP_ENDPOINTS.currencies);
          setCurrencies(Array.isArray(cur) ? cur : []);
        } catch {
          setCurrencies([]);
        }

        try {
          const rt = await fetchAllEntities<RateTypeDTO>(LOOKUP_ENDPOINTS.rateTypes);
          setRateTypes(Array.isArray(rt) ? rt : []);
        } catch {
          setRateTypes([]);
        }
      } catch (err) {
        console.error("❌ Failed to load unit charges:", err);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [ENDPOINTS.list]);

  const currencyLabelById = useMemo(() => {
    return buildIdLabelMap(currencies, "currencyId", (c) => {
      const code = String(c.currencyCode ?? "").trim();
      const sym = String(c.symbol ?? "").trim();
      return sym ? `${code} | ${sym}` : code;
    });
  }, [currencies]);

  const rateTypeLabelById = useMemo(() => {
    return buildIdLabelMap(rateTypes, "rateTypeId", (r) =>
      String(r.rateTypeName ?? "").trim()
    );
  }, [rateTypes]);

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const va = a[sortField];
      const vb = b[sortField];
      const sa = va === null || va === undefined ? "" : String(va);
      const sb = vb === null || vb === undefined ? "" : String(vb);
      return sortAsc ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
    return copy;
  }, [rows, sortAsc, sortField]);

  const handleEdit = (id?: number) => {
    if (!id || !createRoutePath) return;
    const editPath = createRoutePath.replace(/create$/i, `edit/${id}`);
    navigate(editPath);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;

    const deletedBy = parseInt(localStorage.getItem("userId") ?? "0", 10);
    if (!deletedBy) return;

    const confirmed = await showDeleteConfirmation(ENTITY_NAME);
    if (!confirmed) return;

    try {
      await deleteEntity(ENDPOINTS.delete, id, deletedBy);
      setRows((prev) => prev.filter((x) => x.unitChargeId !== id));
      setExpandedRowId(null);
      await showDeleteResult(true, ENTITY_NAME);
    } catch (err) {
      console.error("❌ Failed to delete unit charge:", err);
      await showDeleteResult(false, ENTITY_NAME);
    }
  };

  return (
    <SharedListingTable<UnitChargeDTO>
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
      getRowKey={(x) => x.unitChargeId}
      columns={[
        {
          key: "effectiveFrom",
          label: "Effective From",
          width: "150px",
          renderCell: (x) => formatDateDmy(x.effectiveFrom),
        },
        {
          key: "effectiveTo",
          label: "Effective To",
          width: "150px",
          renderCell: (x) => formatDateDmy((x as UnitChargeDTO).effectiveTo),
        },
        {
          key: "chargePerUnit",
          label: "Charge/Unit",
          width: "130px",
          renderCell: (x) => safeValue(x.chargePerUnit),
        },
        {
          key: "baseRate",
          label: "Base Rate",
          width: "120px",
          renderCell: (x) => safeValue(x.baseRate),
        },
        {
          key: "currencyId",
          label: "Currency",
          width: "160px",
          renderCell: (x) => currencyLabelById.get(x.currencyId) ?? "-",
        },
        {
          key: "rateTypeId",
          label: "Rate Type",
          width: "180px",
          renderCell: (x) => rateTypeLabelById.get(x.rateTypeId) ?? "-",
        },
        {
          key: "isActive",
          label: "Active",
          width: "90px",
          renderCell: (x) => (x.isActive ? "Yes" : "No"),
        },
      ]}
      renderExpandedRow={(x) => {
        const fromYear = getYearFromYmd(x.effectiveFrom);
        const toYear = getYearFromYmd((x as UnitChargeDTO).effectiveTo) ?? fromYear;

        const monthFromLabel = formatMonthLabel(x.applicableMonthFrom, fromYear);
        const monthToLabel = formatMonthLabel(x.applicableMonthTo, toYear);

        return (
          <>
            <strong>Threshold:</strong> {safeValue(x.threshold)} |{" "}
            <strong>Subsidized:</strong>{" "}
            {x.subsidizedFlag == null ? "-" : x.subsidizedFlag ? "Yes" : "No"} |{" "}
            <strong>Peak Multiplier:</strong> {safeValue(x.peakDemandMultiplier)} |{" "}
            <strong>Tiered Rate:</strong> {safeValue(x.tieredRate)} |{" "}
            <strong>Month Range:</strong>{" "}
            {monthFromLabel !== "-" && monthToLabel !== "-"
              ? `${monthFromLabel} to ${monthToLabel}`
              : "-"}{" "}
            | <strong>Time Range:</strong>{" "}
            {x.fromHour && x.toHour ? `${x.fromHour} - ${x.toHour}` : "-"}
          </>
        );
      }}
    />
  );
};

export default UnitChargeListing;