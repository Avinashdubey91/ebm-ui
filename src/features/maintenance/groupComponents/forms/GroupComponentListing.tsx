import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { deleteEntity, fetchAllEntities } from "../../../../api/genericCrudApi";

import type { MaintenanceGroupComponentDTO } from "../../../../types/MaintenanceGroupComponentDTO";
import type { MaintenanceGroupDTO } from "../../../../types/MaintenanceGroupDTO";
import type { MaintenanceComponentDTO } from "../../../../types/MaintenanceComponentDTO";
import type { ApartmentDTO } from "../../../../types/ApartmentDTO";

import { safeValue } from "../../../../utils/format";
import SharedListingTable from "../../../shared/SharedListingTable";
import {
  showDeleteConfirmation,
  showDeleteResult,
} from "../../../../utils/alerts/showDeleteConfirmation";
import { useCurrentMenu } from "../../../../hooks/useCurrentMenu";

const ENTITY_NAME = "Group Component Map";

const endpoints = {
  getAllMaps: "/maintenancegroupcomponent/Get-All-MaintenanceGroup-Components",
  deleteMap: "/maintenancegroupcomponent/Delete-MaintenanceGroup-Component",

  getAllGroups: "/maintenancegroup/Get-All-MaintenanceGroups",
  getAllComponents: "/maintenancecomponent/Get-All-MaintenanceComponents",
  getAllApartments: "/apartment/Get-All-Apartment",
};

const toDmy = (value?: string | null): string => {
  if (!value) return "-";

  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const y = value.slice(0, 4);
    const m = value.slice(5, 7);
    const d = value.slice(8, 10);
    return `${d}-${m}-${y}`;
  }

  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";

  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const toMoney = (value?: number | null): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return value.toFixed(2);
};

const GroupComponentListing: React.FC = () => {
  const navigate = useNavigate();
  const { createRoutePath } = useCurrentMenu();

  const [loading, setLoading] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  const [sortField, setSortField] = useState<
    keyof MaintenanceGroupComponentDTO
  >("maintenanceGroupComponentId");
  const [sortAsc, setSortAsc] = useState(true);

  const [maps, setMaps] = useState<MaintenanceGroupComponentDTO[]>([]);
  const [groups, setGroups] = useState<MaintenanceGroupDTO[]>([]);
  const [components, setComponents] = useState<MaintenanceComponentDTO[]>([]);
  const [apartments, setApartments] = useState<ApartmentDTO[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [mapsRes, groupsRes, componentsRes, apartmentsRes] =
          await Promise.all([
            fetchAllEntities<MaintenanceGroupComponentDTO>(
              endpoints.getAllMaps
            ),
            fetchAllEntities<MaintenanceGroupDTO>(endpoints.getAllGroups),
            fetchAllEntities<MaintenanceComponentDTO>(
              endpoints.getAllComponents
            ),
            fetchAllEntities<ApartmentDTO>(endpoints.getAllApartments),
          ]);

        setMaps(Array.isArray(mapsRes) ? mapsRes : []);
        setGroups(Array.isArray(groupsRes) ? groupsRes : []);
        setComponents(Array.isArray(componentsRes) ? componentsRes : []);
        setApartments(Array.isArray(apartmentsRes) ? apartmentsRes : []);
      } catch (err) {
        console.error("❌ Failed to load group component mappings:", err);
        setMaps([]);
        setGroups([]);
        setComponents([]);
        setApartments([]);
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

  type GroupMeta = { label: string; effectiveFrom: string };

  const groupMetaById = useMemo(() => {
    const m = new Map<number, GroupMeta>();

    groups.forEach((g) => {
      if (typeof g.maintenanceGroupId !== "number") return;
      if (typeof g.apartmentId !== "number") return;

      const aptName =
        apartmentNameById.get(g.apartmentId) ?? `Apartment #${g.apartmentId}`;

      const effFrom = toDmy(g.effectiveFrom ?? null);
      const activeTag = g.isActive ? "" : " (Inactive)";

      m.set(g.maintenanceGroupId, {
        label: `${aptName} | Group ${g.maintenanceGroupId}${activeTag}`,
        effectiveFrom: effFrom,
      });
    });

    return m;
  }, [groups, apartmentNameById]);

  const componentLabelById = useMemo(() => {
    const m = new Map<number, string>();

    components.forEach((c) => {
      if (typeof c.maintenanceComponentId !== "number") return;

      const name = c.componentName ?? `Component #${c.maintenanceComponentId}`;
      const tags: string[] = [];
      if (!c.isActive) tags.push("Inactive");
      if (c.isDeprecated) tags.push("Deprecated");
      const suffix = tags.length ? ` (${tags.join(", ")})` : "";

      m.set(c.maintenanceComponentId, `${name}${suffix}`);
    });

    return m;
  }, [components]);

  const sortedMaps = useMemo(() => {
    return [...maps].sort((a, b) => {
      const va = a[sortField] ?? 0;
      const vb = b[sortField] ?? 0;

      return sortAsc
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
  }, [maps, sortAsc, sortField]);

  const handleDelete = async (id?: number) => {
    if (!id) return;

    const deletedBy = parseInt(localStorage.getItem("userId") ?? "0", 10);
    if (!deletedBy) return;

    const confirmed = await showDeleteConfirmation(ENTITY_NAME);
    if (!confirmed) return;

    try {
      await deleteEntity(endpoints.deleteMap, id, deletedBy);

      setMaps((prev) =>
        prev.filter((x) => x.maintenanceGroupComponentId !== id)
      );
      setExpandedRowId(null);

      await showDeleteResult(true, ENTITY_NAME);
    } catch (err) {
      console.error("❌ Failed to delete group component map:", err);
      await showDeleteResult(false, ENTITY_NAME);
    }
  };

  return (
    <SharedListingTable<MaintenanceGroupComponentDTO>
      data={sortedMaps}
      loading={loading}
      columns={[
        {
          key: "maintenanceGroupId",
          label: "Group",
          width: "250px",
          renderCell: (m) =>
            groupMetaById.get(m.maintenanceGroupId)?.label ??
            safeValue(m.maintenanceGroupId),
        },
        {
          key: "maintenanceGroupId",
          label: "Effective From",
          width: "160px",
          renderCell: (m) =>
            groupMetaById.get(m.maintenanceGroupId)?.effectiveFrom ?? "-",
        },
        {
          key: "maintenanceComponentId",
          label: "Component",
          width: "260px",
          renderCell: (m) =>
            componentLabelById.get(m.maintenanceComponentId) ??
            safeValue(m.maintenanceComponentId),
        },
        {
          key: "amount",
          label: "Amount",
          width: "120px",
          renderCell: (m) => toMoney(m.amount),
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
      getRowKey={(m) => m.maintenanceGroupComponentId}
      renderExpandedRow={(m) => {
        const meta = groupMetaById.get(m.maintenanceGroupId);
        return (
          <>
            <strong>Map ID:</strong> {safeValue(m.maintenanceGroupComponentId)}{" "}
            | <strong>Group:</strong>{" "}
            {meta?.label ?? safeValue(m.maintenanceGroupId)} |{" "}
            <strong>Effective From:</strong> {meta?.effectiveFrom ?? "-"} |{" "}
            <strong>Component ID:</strong> {safeValue(m.maintenanceComponentId)}{" "}
            | <strong>Amount:</strong> {toMoney(m.amount)}
          </>
        );
      }}
    />
  );
};

export default GroupComponentListing;
