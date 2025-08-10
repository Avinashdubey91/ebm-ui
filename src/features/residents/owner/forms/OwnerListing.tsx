import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllEntities, deleteEntity } from "../../../../api/genericCrudApi";
import type { OwnerDTO } from "../../../../types/OwnerDTO";
import { safeValue } from "../../../../utils/format";
import SharedListingTable from "../../../shared/SharedListingTable";
import {
  showDeleteConfirmation,
  showDeleteResult,
} from "../../../../utils/alerts/showDeleteConfirmation";
import { useCurrentMenu } from "../../../../hooks/useCurrentMenu";

const endpoints = {
  getAll: "/ownerprofile/Get-All-Owners",
  delete: "/ownerprofile/Delete-Owner",
};

const ENTITY_NAME = "owner";

const OwnerListing: React.FC = () => {
  const [owners, setOwners] = useState<OwnerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof OwnerDTO>("ownerId");
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  const navigate = useNavigate();
  const { createRoutePath } = useCurrentMenu();

  useEffect(() => {
    const fetchOwners = async () => {
      try {
        const data = await fetchAllEntities<OwnerDTO>(endpoints.getAll);
        setOwners(data);
      } catch (err) {
        console.error("❌ Failed to fetch owners", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOwners();
  }, []);

  useEffect(() => {
    const toastMessage = sessionStorage.getItem("showToast");
    if (toastMessage) {
      showDeleteResult(true, ENTITY_NAME, toastMessage);
      sessionStorage.removeItem("showToast");
    }
  }, []);

  const sortedOwners = useMemo(() => {
    return [...owners].sort((a, b) => {
      const valA = a[sortField] ?? "";
      const valB = b[sortField] ?? "";
      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [owners, sortField, sortAsc]);

  const handleDeleteOwner = async (id?: number) => {
    if (!id) return;

    const deletedBy = parseInt(localStorage.getItem("userId") ?? "0", 10);
    if (!deletedBy) return;

    const confirmed = await showDeleteConfirmation(ENTITY_NAME);
    if (!confirmed) return;

    try {
      await deleteEntity(endpoints.delete, id, deletedBy);
      setOwners((prev) => prev.filter((o) => o.ownerId !== id));
      await showDeleteResult(true, ENTITY_NAME);
    } catch (err) {
      console.error("❌ Failed to delete owner", err);
      await showDeleteResult(false, ENTITY_NAME);
    }
  };

  return (
    <SharedListingTable
      data={sortedOwners}
      loading={loading}
      columns={[
        { key: "ownerId", label: "Id", width: "40px" },
        { key: "firstName", label: "First Name", width: "140px" },
        { key: "lastName", label: "Last Name", width: "140px" },
        { key: "mobile", label: "Mobile", width: "140px" },
        { key: "emailId", label: "Email", width: "200px" },
        { key: "city", label: "City", width: "120px" },
      ]}
      sortField={sortField}
      sortAsc={sortAsc}
      onSort={(field) => {
        setSortField(field);
        setSortAsc((prev) => (field === sortField ? !prev : true));
      }}
      onEdit={(id) => {
        const editPath = createRoutePath.replace(/create$/i, `edit/${id}`);
        navigate(editPath);
      }}
      onDelete={handleDeleteOwner}
      expandedRowId={expandedRowId}
      onExpand={setExpandedRowId}
      getRowKey={(item) => item.ownerId ?? Math.floor(Math.random() * 100000)}
      renderExpandedRow={(o) => (
        <>
          <strong>Occupation:</strong> {safeValue(o.occupation)} |{" "}
          <strong>Address:</strong> {safeValue(o.address)} |{" "}
          <strong>Aadhar:</strong> {safeValue(o.aadharNumber)} |{" "}
          <strong>Ownership:</strong> {safeValue(o.ownershipType)} |{" "}
          <strong>Emergency Contact:</strong> {safeValue(o.emergencyContactName)} ({safeValue(o.emergencyContactNumber)})
        </>
      )}
    />
  );
};

export default OwnerListing;
