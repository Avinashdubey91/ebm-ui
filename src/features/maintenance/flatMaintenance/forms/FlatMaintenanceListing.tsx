// src/features/maintenance/flatMaintenance/forms/FlatMaintenanceListing.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { deleteEntity, fetchAllEntities } from "../../../../api/genericCrudApi";
import { useCurrentMenu } from "../../../../hooks/useCurrentMenu";

import type { FlatMaintenanceDTO } from "../../../../types/FlatMaintenanceDTO";
import type { MaintenanceGroupDTO } from "../../../../types/MaintenanceGroupDTO";
import type { ApartmentDTO } from "../../../../types/ApartmentDTO";

import { safeValue, formatDateDmy } from "../../../../utils/format";
import SharedListingTable from "../../../shared/SharedListingTable";
import {
  showDeleteConfirmation,
  showDeleteResult,
} from "../../../../utils/alerts/showDeleteConfirmation";

// Minimal shape (avoid depending on unknown FlatDTO file)
type FlatLite = {
  flatId: number;
  apartmentId?: number | null;
  flatNumber?: string | null;
  floorNumber?: number | null;
  isActive?: boolean | null;
};

const endpoints = {
  list: "/flatmaintenance/Get-All-FlatMaintenances",
  delete: "/flatmaintenance/Delete-FlatMaintenance",
  apartments: "/apartment/Get-All-Apartment",
  groups: "/maintenancegroup/Get-All-MaintenanceGroups",
  flats: "/flat/Get-All-Flats",
};

type GroupMeta = { label: string; effectiveFrom: string };

const FlatMaintenanceListing: React.FC = () => {
  const navigate = useNavigate();
  const { createRoutePath } = useCurrentMenu();

  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<keyof FlatMaintenanceDTO>(
    "flatMaintenanceId"
  );
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  const [maps, setMaps] = useState<FlatMaintenanceDTO[]>([]);
  const [apartments, setApartments] = useState<ApartmentDTO[]>([]);
  const [groups, setGroups] = useState<MaintenanceGroupDTO[]>([]);
  const [flats, setFlats] = useState<FlatLite[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [mapsRes, apartmentsRes, groupsRes, flatsRes] = await Promise.all([
          fetchAllEntities<FlatMaintenanceDTO>(endpoints.list),
          fetchAllEntities<ApartmentDTO>(endpoints.apartments),
          fetchAllEntities<MaintenanceGroupDTO>(endpoints.groups),
          fetchAllEntities<FlatLite>(endpoints.flats),
        ]);

        setMaps(mapsRes ?? []);
        setApartments(apartmentsRes ?? []);
        setGroups(groupsRes ?? []);
        setFlats(flatsRes ?? []);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const apartmentNameById = useMemo(() => {
    const m = new Map<number, string>();
    apartments.forEach((a) => {
      if (typeof a.apartmentId !== "number") return;
      m.set(a.apartmentId, a.apartmentName ?? `Apartment #${a.apartmentId}`);
    });
    return m;
  }, [apartments]);

  const flatMetaById = useMemo(() => {
    const m = new Map<number, { label: string; apartmentId?: number | null }>();
    flats.forEach((f) => {
      if (typeof f.flatId !== "number") return;
      const flatNo = f.flatNumber ?? `Flat #${f.flatId}`;
      const inactiveTag = f.isActive === false ? " (Inactive)" : "";
      const label = `${flatNo}${inactiveTag}`;
      m.set(f.flatId, { label, apartmentId: f.apartmentId ?? null });
    });
    return m;
  }, [flats]);

  // Patch Start: keep group label + group effectiveFrom separate
  const groupMetaById = useMemo(() => {
    const m = new Map<number, GroupMeta>();

    groups.forEach((g) => {
      if (typeof g.maintenanceGroupId !== "number") return;

      const aptName =
        apartmentNameById.get(g.apartmentId) ?? `Apartment #${g.apartmentId}`;

      const activeTag = g.isActive ? "" : " (Inactive)";
      m.set(g.maintenanceGroupId, {
        label: `${aptName} | Group ${g.maintenanceGroupId}${activeTag}`,
        effectiveFrom: formatDateDmy(g.effectiveFrom ?? null),

      });
    });

    return m;
  }, [groups, apartmentNameById]);
  // Patch End

  const sortedMaps = useMemo(() => {
    return [...maps].sort((a, b) => {
      const va = a[sortField] ?? "";
      const vb = b[sortField] ?? "";
      return sortAsc
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
  }, [maps, sortAsc, sortField]);

  const handleDelete = async (id?: number) => {
    if (!id) return;

    const confirmed = await showDeleteConfirmation("flat maintenance mapping");
    if (!confirmed) return;

    const deletedBy = parseInt(localStorage.getItem("userId") ?? "0", 10);
    if (!deletedBy) return;

    try {
      await deleteEntity(endpoints.delete, id, deletedBy);
      setMaps((prev) => prev.filter((x) => x.flatMaintenanceId !== id));
      setExpandedRowId((prev) => (prev === id ? null : prev));
      await showDeleteResult(true, "flat maintenance mapping");
    } catch {
      await showDeleteResult(false, "flat maintenance mapping");
    }
  };

  const resolveApartmentLabel = (m: FlatMaintenanceDTO): string => {
    const flatMeta = flatMetaById.get(m.flatId);
    const flatAptId = flatMeta?.apartmentId ?? null;

    if (typeof flatAptId === "number") {
      return apartmentNameById.get(flatAptId) ?? `Apartment #${flatAptId}`;
    }

    const group = groups.find((g) => g.maintenanceGroupId === m.maintenanceGroupId);
    if (group && typeof group.apartmentId === "number") {
      return (
        apartmentNameById.get(group.apartmentId) ?? `Apartment #${group.apartmentId}`
      );
    }

    return "-";
  };

  return (
    <SharedListingTable<FlatMaintenanceDTO>
      data={sortedMaps}
      loading={loading}
      columns={[
        {
          key: "flatId",
          label: "Apartment",
          width: "260px",
          renderCell: (m) => resolveApartmentLabel(m),
        },
        {
          key: "flatId",
          label: "Flat",
          width: "140px",
          renderCell: (m) => flatMetaById.get(m.flatId)?.label ?? safeValue(m.flatId),
        },
        {
          key: "maintenanceGroupId",
          label: "Group",
          width: "300px",
          renderCell: (m) =>
            groupMetaById.get(m.maintenanceGroupId)?.label ??
            safeValue(m.maintenanceGroupId),
        },
        // Patch Start: separate group Effective From column
        {
          key: "maintenanceGroupId",
          label: "Group Effective From",
          width: "170px",
          renderCell: (m) =>
            groupMetaById.get(m.maintenanceGroupId)?.effectiveFrom ?? "-",
        },
        // Patch End
        {
          key: "effectiveFrom",
          label: "Effective From",
          width: "160px",
          renderCell: (m) => formatDateDmy(m.effectiveFrom ?? null),
        },
        {
          key: "effectiveTo",
          label: "Effective To",
          width: "160px",
          renderCell: (m) => formatDateDmy(m.effectiveTo ?? null),
        },
      ]}
      sortField={sortField}
      sortAsc={sortAsc}
      onSort={(field) => {
        setSortField(field);
        setSortAsc((prev) => (field === sortField ? !prev : true));
      }}
      onEdit={(id?: number) => {
        if (!id || !createRoutePath) return;
        const editPath = createRoutePath.replace(/create$/i, `edit/${id}`);
        navigate(editPath);
      }}
      onDelete={handleDelete}
      expandedRowId={expandedRowId}
      onExpand={setExpandedRowId}
      getRowKey={(m) => m.flatMaintenanceId}
      renderExpandedRow={(m) => {
        const meta = groupMetaById.get(m.maintenanceGroupId);
        return (
          <>
            <strong>Map ID:</strong> {safeValue(m.flatMaintenanceId)} |{" "}
            <strong>Flat ID:</strong> {safeValue(m.flatId)} |{" "}
            <strong>Group ID:</strong> {safeValue(m.maintenanceGroupId)} |{" "}
            <strong>Group Effective From:</strong> {meta?.effectiveFrom ?? "-"} |{" "}
            <strong>Effective From:</strong> {formatDateDmy(m.effectiveFrom ?? null)} |{" "}
            <strong>Effective To:</strong> {formatDateDmy(m.effectiveFrom ?? null)}
          </>
        );
      }}
    />
  );
};

export default React.memo(FlatMaintenanceListing);