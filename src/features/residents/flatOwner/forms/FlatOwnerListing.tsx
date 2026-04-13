import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllEntities, deleteEntity } from "../../../../api/genericCrudApi";
import type { FlatOwnerDTO } from "../../../../types/FlatOwnerDTO";
import { safeValue, formatDate } from "../../../../utils/format";
import SharedListingTable from "../../../shared/SharedListingTable";
import {
  showDeleteConfirmation,
  showDeleteResult,
} from "../../../../utils/alerts/showDeleteConfirmation";
import {  showAddUpdateResult } from "../../../../utils/alerts/showAddUpdateConfirmation";
import { useCurrentMenu } from "../../../../hooks/useCurrentMenu";
import { UseAuth } from "../../../../context/UseAuth";

const endpoints = {
  getAll: "/flatowner/Get-All-Owners",
  delete: "/flatowner/Delete-Owner",
};


const ENTITY_NAME = "flat owner";

const FlatOwnerListing: React.FC = () => {
  const [owners, setOwners] = useState<FlatOwnerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof FlatOwnerDTO>("flatOwnerId");
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  const navigate = useNavigate();
  const { createRoutePath } = useCurrentMenu();
  const { userId } = UseAuth();

  useEffect(() => {
    const fetchOwners = async () => {
      try {
        const data = await fetchAllEntities<FlatOwnerDTO>(endpoints.getAll);
        const formatted = data.map((owner) => ({
          ...owner,
          ownershipFrom: formatDate(owner.ownershipFrom),
          ownershipTo: formatDate(owner.ownershipTo),
        }));

        setOwners(formatted);
      } catch (err) {
        console.error("❌ Failed to fetch flat owners", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOwners();
  }, []);

  useEffect(() => {
    const toastMessage = sessionStorage.getItem("showToast");
    if (toastMessage) {
      showAddUpdateResult(true, ENTITY_NAME, toastMessage);
      sessionStorage.removeItem("showToast"); // optional; the helper also clears keys
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

    const currentUserId = Number(userId);
    if (!userId || Number.isNaN(currentUserId) || currentUserId <= 0) return;

    const confirmed = await showDeleteConfirmation(ENTITY_NAME);
    if (!confirmed) return;

    try {
      await deleteEntity(endpoints.delete, id, currentUserId);
      setOwners((prev) => prev.filter((o) => o.flatOwnerId !== id));
      await showDeleteResult(true, ENTITY_NAME);
    } catch (err) {
      console.error("❌ Failed to delete flat owner", err);
      await showDeleteResult(false, ENTITY_NAME);
    }
  };

  return (
    <SharedListingTable
      data={sortedOwners}
      loading={loading}
      columns={[
        { key: "flatNumber", label: "Flat Number", width: "100px" },
        { key: "firstName", label: "First Name", width: "140px" },
        { key: "lastName", label: "Last Name", width: "140px" },
        { key: "gender", label: "Gender", width: "80px" },
        { key: "mobile", label: "Mobile", width: "120px" },
        { key: "emailId", label: "Email", width: "180px" },
        { key: "occupation", label: "Occupation", width: "140px" },
        { key: "pinCode", label: "PIN Code", width: "100px" },
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
      getRowKey={(item) => item.flatOwnerId ?? Math.floor(Math.random() * 100000)}
      renderExpandedRow={(r) => (
        <>
          <strong>Owned From:</strong> {formatDate(r.ownershipFrom)} |{" "}
          <strong>To:</strong> {formatDate(r.ownershipTo)} |{" "}
          <strong>Primary:</strong> {r.isPrimaryOwner ? "Yes" : "No"} |{" "}
          <strong>Proof:</strong> {safeValue(r.ownershipProof)} |{" "}
          <strong>Notes:</strong> {safeValue(r.notes)}
        </>
      )}
    />
  );
};

export default FlatOwnerListing;
