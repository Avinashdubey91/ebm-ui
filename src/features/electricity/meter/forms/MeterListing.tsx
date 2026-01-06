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

type MeterDTO = {
  meterId: number;
  utilityType: string | number;
  meterScope: string | number;
  flatId?: number | null;
  apartmentId: number;
  meterNumber: string;

  installationDate?: string | null;
  lastVerifiedDate?: string | null;

  isActive: boolean;
  isSmartMeter: boolean;

  manufacturer?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  readingUnit?: string | null;
  locationDescription?: string | null;

  installationBy?: string | null;
  verifiedBy?: string | null;
  verificationStatus?: string | number | null;
  verificationRemarks?: string | null;

  deactivationReason?: string | null;
  phaseType?: string | number | null;
};

type ApartmentDTO = { apartmentId: number; apartmentName?: string | null };
type FlatDTO = {
  flatId: number;
  flatNo?: string | null;
  flatNumber?: string | null;
  flatName?: string | null;
  flatDisplayName?: string | null;
};

const ENTITY_NAME = "Meter";

const endpoints = {
  list: "/meter/Get-All-Meters",
  delete: "/meter/Delete-Meter",

  apartments: "/apartment/Get-All-Apartment",
  flats: "/flat/Get-All-Flats",
};

const toLabel = (v: string | number | null | undefined): string => {
  if (v === null || v === undefined) return "-";
  return typeof v === "string" ? v : String(v);
};

const utilityLabel = (v: string | number | null | undefined): string => {
  if (v === null || v === undefined) return "-";
  if (typeof v === "string") return v;

  const byNum: Record<number, string> = {
    0: "Electricity",
    1: "Water",
    2: "Gas",
    3: "Heat",
  };

  return byNum[v] ?? String(v);
};

const scopeLabel = (v: string | number | null | undefined): string => {
  if (v === null || v === undefined) return "-";
  if (typeof v === "string") return v;

  const byNum: Record<number, string> = {
    0: "Apartment",
    1: "Personal",
    2: "Society",
    3: "Block",
    4: "Commercial",
    5: "Common Area",
    6: "Temporary",
  };

  return byNum[v] ?? String(v);
};

const toFlatLabel = (f: FlatDTO): string => {
  const label =
    f.flatNo ?? f.flatNumber ?? f.flatName ?? f.flatDisplayName ?? null;

  return label && label.trim().length > 0 ? label : `Flat #${f.flatId}`;
};

const prettyPhase = (v: string | number | null | undefined): string => {
  if (v === null || v === undefined) return "-";
  if (typeof v === "number") return String(v);
  if (v === "SinglePhase") return "Single-Phase";
  if (v === "TwoPhase") return "Two-Phase";
  if (v === "ThreePhase") return "Three-Phase";
  return v;
};

const MeterListing: React.FC = () => {
  const navigate = useNavigate();
  const { createRoutePath } = useCurrentMenu();

  const [loading, setLoading] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  const [sortField, setSortField] = useState<keyof MeterDTO>("meterId");
  const [sortAsc, setSortAsc] = useState(true);

  const [meters, setMeters] = useState<MeterDTO[]>([]);
  const [apartments, setApartments] = useState<ApartmentDTO[]>([]);
  const [flats, setFlats] = useState<FlatDTO[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [metersRes, aptRes, flatsRes] = await Promise.all([
          fetchAllEntities<MeterDTO>(endpoints.list),
          fetchAllEntities<ApartmentDTO>(endpoints.apartments),
          fetchAllEntities<FlatDTO>(endpoints.flats),
        ]);

        setMeters(Array.isArray(metersRes) ? metersRes : []);
        setApartments(Array.isArray(aptRes) ? aptRes : []);
        setFlats(Array.isArray(flatsRes) ? flatsRes : []);
      } catch (err) {
        console.error("❌ Failed to load meters:", err);
        setMeters([]);
        setApartments([]);
        setFlats([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const apartmentNameById = useMemo(() => {
    const m = new Map<number, string>();
    apartments.forEach((a) => {
      if (a.apartmentId !== undefined && a.apartmentId !== null) {
        m.set(a.apartmentId, a.apartmentName ?? `Apartment #${a.apartmentId}`);
      }
    });
    return m;
  }, [apartments]);

  const flatLabelById = useMemo(() => {
    const m = new Map<number, string>();
    flats.forEach((f) => m.set(f.flatId, toFlatLabel(f)));
    return m;
  }, [flats]);

  const sortedMeters = useMemo(() => {
    const copy = [...meters];
    copy.sort((a, b) => {
      const va = a[sortField];
      const vb = b[sortField];

      const sa = va === null || va === undefined ? "" : String(va);
      const sb = vb === null || vb === undefined ? "" : String(vb);

      return sortAsc ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
    return copy;
  }, [meters, sortAsc, sortField]);

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
      await deleteEntity(endpoints.delete, id, deletedBy);
      setMeters((prev) => prev.filter((x) => x.meterId !== id));
      setExpandedRowId(null);
      await showDeleteResult(true, ENTITY_NAME);
    } catch (err) {
      console.error("❌ Failed to delete meter:", err);
      await showDeleteResult(false, ENTITY_NAME);
    }
  };

  return (
    <SharedListingTable<MeterDTO>
      data={sortedMeters}
      loading={loading}
      sortField={sortField}
      sortAsc={sortAsc}
      onSort={(field) => {
        setSortField(field);
        setSortAsc((prev) => (field === sortField ? !prev : true));
      }}
      onEdit={handleEdit}
      onDelete={handleDelete}
      expandedRowId={expandedRowId}
      onExpand={setExpandedRowId}
      getRowKey={(m) => m.meterId}
      columns={[
        { key: "meterNumber", label: "Meter No.", width: "180px" },
        {
          key: "apartmentId",
          label: "Apartment",
          width: "280px",
          renderCell: (m) =>
            apartmentNameById.get(m.apartmentId) ?? safeValue(m.apartmentId),
        },
        {
          key: "flatId",
          label: "Flat",
          width: "160px",
          renderCell: (m) =>
            m.flatId ? flatLabelById.get(m.flatId) ?? safeValue(m.flatId) : "N/A",
        },
        {
          key: "utilityType",
          label: "Utility",
          width: "140px",
          renderCell: (m) => utilityLabel(m.utilityType),
        },
        {
          key: "meterScope",
          label: "Scope",
          width: "150px",
          renderCell: (m) => scopeLabel(m.meterScope),
        },
        {
          key: "isSmartMeter",
          label: "Smart",
          width: "90px",
          renderCell: (m) => (m.isSmartMeter ? "Yes" : "No"),
        },
        {
          key: "isActive",
          label: "Active",
          width: "90px",
          renderCell: (m) => (m.isActive ? "Yes" : "No"),
        },
      ]}
      renderExpandedRow={(m) => (
        <>
          <strong>Meter ID:</strong> {safeValue(m.meterId)} |{" "}
          <strong>Installation Date:</strong>{" "}
          {formatDateDmy(m.installationDate)} | <strong>Last Verified:</strong>{" "}
          {formatDateDmy(m.lastVerifiedDate)} | <strong>Phase:</strong>{" "}
          {prettyPhase(m.phaseType)} | <strong>Verification Status:</strong>{" "}
          {toLabel(m.verificationStatus)} | <strong>Manufacturer:</strong>{" "}
          {safeValue(m.manufacturer)} | <strong>Model:</strong>{" "}
          {safeValue(m.model)} | <strong>Serial:</strong>{" "}
          {safeValue(m.serialNumber)} | <strong>Reading Unit:</strong>{" "}
          {safeValue(m.readingUnit)} | <strong>Location:</strong>{" "}
          {safeValue(m.locationDescription)}
          {!m.isActive && (
            <>
              {" "}
              | <strong>Deactivation Reason:</strong>{" "}
              {safeValue(m.deactivationReason)}
            </>
          )}
        </>
      )}
    />
  );
};

export default MeterListing;
