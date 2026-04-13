import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { deleteEntity, fetchAllEntities } from "../../../../api/genericCrudApi";
import type { MaintenanceComponentDTO } from "../../../../types/MaintenanceComponentDTO";

import { safeValue } from "../../../../utils/format";
import SharedListingTable from "../../../shared/SharedListingTable";
import {
  showDeleteConfirmation,
  showDeleteResult,
} from "../../../../utils/alerts/showDeleteConfirmation";
import { useCurrentMenu } from "../../../../hooks/useCurrentMenu";
import { UseAuth } from "../../../../context/UseAuth";

const ENTITY_NAME = "Maintenance Component";

const endpoints = {
  getAll: "/maintenancecomponent/Get-All-MaintenanceComponents",
  delete: "/maintenancecomponent/Delete-MaintenanceComponent",
};

const ComponentListing: React.FC = () => {
  const navigate = useNavigate();
  const { createRoutePath } = useCurrentMenu();
  const { userId } = UseAuth();

  const [components, setComponents] = useState<MaintenanceComponentDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const [sortField, setSortField] = useState<keyof MaintenanceComponentDTO>(
    "maintenanceComponentId",
  );
  const [sortAsc, setSortAsc] = useState(true);

  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchAllEntities<MaintenanceComponentDTO>(
          endpoints.getAll,
        );
        setComponents(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("❌ Failed to load maintenance components:", err);
        setComponents([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const sortedComponents = useMemo(() => {
    return [...components].sort((a, b) => {
      const valA = a[sortField] ?? "";
      const valB = b[sortField] ?? "";

      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [components, sortField, sortAsc]);

  const handleDelete = async (id?: number) => {
    if (!id) return;

    const currentUserId = Number(userId);
    if (!userId || Number.isNaN(currentUserId) || currentUserId <= 0) return;

    const confirmed = await showDeleteConfirmation(ENTITY_NAME);
    if (!confirmed) return;

    try {
      await deleteEntity(endpoints.delete, id, currentUserId);

      setComponents((prev) =>
        prev.filter((c) => c.maintenanceComponentId !== id),
      );
      setExpandedRowId(null);

      await showDeleteResult(true, ENTITY_NAME);
    } catch (err) {
      console.error("❌ Failed to delete maintenance component", err);
      await showDeleteResult(false, ENTITY_NAME);
    }
  };

  return (
    <SharedListingTable<MaintenanceComponentDTO>
      data={sortedComponents}
      loading={loading}
      columns={[
        {
          key: "componentName",
          label: "Component Name",
          width: "220px",
          renderCell: (c) => safeValue(c.componentName),
        },
        {
          key: "description",
          label: "Description",
          width: "380px",
          renderCell: (c) => safeValue(c.description),
        },
        {
          key: "isDeprecated",
          label: "Deprecated",
          width: "120px",
          renderCell: (c) => (c.isDeprecated ? "Yes" : "No"),
        },
        {
          key: "isActive",
          label: "Active",
          width: "100px",
          renderCell: (c) => (c.isActive ? "Yes" : "No"),
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
      getRowKey={(c) =>
        c.maintenanceComponentId ?? Math.floor(Math.random() * 100000)
      }
      renderExpandedRow={(c) => (
        <>
          <strong>Component ID:</strong> {safeValue(c.maintenanceComponentId)} |{" "}
          <strong>Name:</strong> {safeValue(c.componentName)} |{" "}
          <strong>Deprecated:</strong> {c.isDeprecated ? "Yes" : "No"} |{" "}
          <strong>Status:</strong> {c.isActive ? "Active" : "Inactive"}
        </>
      )}
    />
  );
};

export default ComponentListing;
