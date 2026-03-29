import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { fetchAllEntities, deleteEntity } from "../../../../api/genericCrudApi";
import type { MaintenanceGroupDTO } from "../../../../types/MaintenanceGroupDTO";
import type { ApartmentDTO } from "../../../../types/ApartmentDTO";

import {
  safeValue,
  formatDateDmy,
  formatPrefixedId,
  abbreviateWithLastWord,
} from "../../../../utils/format";
import SharedListingTable from "../../../shared/SharedListingTable";
import {
  showDeleteConfirmation,
  showDeleteResult,
} from "../../../../utils/alerts/showDeleteConfirmation";
import { useCurrentMenu } from "../../../../hooks/useCurrentMenu";

const ENTITY_NAME = "Maintenance Group";

const endpoints = {
  getAll: "/maintenancegroup/Get-All-MaintenanceGroups",
  delete: "/maintenancegroup/Delete-MaintenanceGroup",
  getAllApartments: "/apartment/Get-All-Apartment",
};

const toMoney = (value?: number | null): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return value.toFixed(2);
};

const GroupListing: React.FC = () => {
  const navigate = useNavigate();
  const { createRoutePath } = useCurrentMenu();

  const [groups, setGroups] = useState<MaintenanceGroupDTO[]>([]);
  const [apartments, setApartments] = useState<ApartmentDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const [sortField, setSortField] =
    useState<keyof MaintenanceGroupDTO>("maintenanceGroupId");
  const [sortAsc, setSortAsc] = useState(true);

  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [groupsRes, apartmentsRes] = await Promise.all([
          fetchAllEntities<MaintenanceGroupDTO>(endpoints.getAll),
          fetchAllEntities<ApartmentDTO>(endpoints.getAllApartments),
        ]);

        setGroups(Array.isArray(groupsRes) ? groupsRes : []);
        setApartments(Array.isArray(apartmentsRes) ? apartmentsRes : []);
      } catch (err) {
        console.error("❌ Failed to load maintenance groups:", err);
        setGroups([]);
        setApartments([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const apartmentNameById = useMemo(() => {
    const map = new Map<number, string>();
    apartments.forEach((a) => {
      if (typeof a.apartmentId === "number") {
        map.set(a.apartmentId, a.apartmentName ?? `#${a.apartmentId}`);
      }
    });
    return map;
  }, [apartments]);

  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => {
      const valA = a[sortField] ?? "";
      const valB = b[sortField] ?? "";

      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [groups, sortField, sortAsc]);

  const handleDeleteGroup = async (id?: number) => {
    if (!id) return;

    const deletedBy = parseInt(localStorage.getItem("userId") ?? "0", 10);
    if (!deletedBy) return;

    const confirmed = await showDeleteConfirmation(ENTITY_NAME);
    if (!confirmed) return;

    try {
      await deleteEntity(endpoints.delete, id, deletedBy);

      setGroups((prev) => prev.filter((g) => g.maintenanceGroupId !== id));
      setExpandedRowId(null);

      await showDeleteResult(true, ENTITY_NAME);
    } catch (err) {
      console.error("❌ Failed to delete maintenance group", err);
      await showDeleteResult(false, ENTITY_NAME);
    }
  };

  return (
    <SharedListingTable<MaintenanceGroupDTO>
      data={sortedGroups}
      loading={loading}
      columns={[
        {
          key: "maintenanceGroupId",
          label: "Group ID",
          width: "110px",
          renderCell: (g: MaintenanceGroupDTO) =>
            formatPrefixedId("MG", g.maintenanceGroupId),
        },
        {
          key: "apartmentId",
          label: "Apartment",
          width: "180px",
          renderCell: (g: MaintenanceGroupDTO) =>
            abbreviateWithLastWord(
              apartmentNameById.get(g.apartmentId) ?? safeValue(g.apartmentId),
            ),
        },
        {
          key: "effectiveFrom",
          label: "Effective From",
          width: "130px",
          renderCell: (g) => formatDateDmy(g.effectiveFrom),
        },
        {
          key: "effectiveTo",
          label: "Effective To",
          width: "130px",
          renderCell: (g) => formatDateDmy(g.effectiveTo ?? null),
        },
        {
          key: "totalCharge",
          label: "Total Charge",
          width: "120px",
          renderCell: (g: MaintenanceGroupDTO) => toMoney(g.totalCharge),
        },
        {
          key: "isActive",
          label: "Active",
          width: "90px",
          renderCell: (g: MaintenanceGroupDTO) => (g.isActive ? "Yes" : "No"),
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
      onDelete={handleDeleteGroup}
      expandedRowId={expandedRowId}
      onExpand={setExpandedRowId}
      getRowKey={(g) =>
        g.maintenanceGroupId ?? Math.floor(Math.random() * 100000)
      }
      renderExpandedRow={(g: MaintenanceGroupDTO) => (
        <>
          <strong>Group ID:</strong> {safeValue(g.maintenanceGroupId)} |{" "}
          <strong>Apartment ID:</strong> {safeValue(g.apartmentId)} |{" "}
          <strong>Effective From:</strong> {formatDateDmy(g.effectiveFrom)} |{" "}
          <strong>Effective To:</strong> {formatDateDmy(g.effectiveTo ?? null)}{" "}
          | <strong>Total Charge:</strong> {toMoney(g.totalCharge)} |{" "}
          <strong>Status:</strong> {g.isActive ? "Active" : "Inactive"}
        </>
      )}
    />
  );
};

export default GroupListing;
