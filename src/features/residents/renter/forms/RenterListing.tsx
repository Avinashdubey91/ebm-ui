// src/features/residents/renter/forms/RenterListing.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllEntities, deleteEntity } from "../../../../api/genericCrudApi";
import type { RenterDTO } from "../../../../types/RenterDTO";
import { safeValue } from "../../../../utils/format";
import SharedListingTable from "../../../shared/SharedListingTable";
import {
  showDeleteConfirmation,
  showDeleteResult,
} from "../../../../utils/alerts/showDeleteConfirmation";
import { useCurrentMenu } from "../../../../hooks/useCurrentMenu";

const endpoints = {
  getAll: "/renterprofile/Get-All-Renters",
  delete: "/renterprofile/Delete-Renter",
};

const ENTITY_NAME = "renter";

const RenterListing: React.FC = () => {
  const [renters, setRenters] = useState<RenterDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof RenterDTO>("renterId");
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  const navigate = useNavigate();
  const { createRoutePath } = useCurrentMenu();

  useEffect(() => {
    const fetchRenters = async () => {
      try {
        const data = await fetchAllEntities<RenterDTO>(endpoints.getAll);
        setRenters(data);
      } catch (err) {
        console.error("❌ Failed to fetch renters", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRenters();
  }, []);

  useEffect(() => {
    const toastMessage = sessionStorage.getItem("showToast");
    if (toastMessage) {
      showDeleteResult(true, ENTITY_NAME, toastMessage);
      sessionStorage.removeItem("showToast");
    }
  }, []);

  const sortedRenters = useMemo(() => {
    return [...renters].sort((a, b) => {
      const valA = a[sortField] ?? "";
      const valB = b[sortField] ?? "";
      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [renters, sortField, sortAsc]);

  const handleDeleteRenter = async (id?: number) => {
    if (!id) return;

    const deletedBy = parseInt(localStorage.getItem("userId") ?? "0", 10);
    if (!deletedBy) return;

    const confirmed = await showDeleteConfirmation(ENTITY_NAME);
    if (!confirmed) return;

    try {
      await deleteEntity(endpoints.delete, id, deletedBy);
      setRenters((prev) => prev.filter((r) => r.renterId !== id));
      await showDeleteResult(true, ENTITY_NAME);
    } catch (err) {
      console.error("❌ Failed to delete renter", err);
      await showDeleteResult(false, ENTITY_NAME);
    }
  };

  return (
    <SharedListingTable
      data={sortedRenters}
      loading={loading}
      columns={[
        { key: "renterId", label: "Id", width: "40px" },
        { key: "firstName", label: "First Name", width: "140px" },
        { key: "lastName", label: "Last Name", width: "140px" },
        { key: "mobile", label: "Mobile", width: "140px" },
        { key: "emailId", label: "Email", width: "200px" },
        { key: "address", label: "Address", width: "200px" },
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
      onDelete={handleDeleteRenter}
      expandedRowId={expandedRowId}
      onExpand={setExpandedRowId}
      getRowKey={(item) => item.renterId ?? Math.floor(Math.random() * 100000)}
      renderExpandedRow={(r) => (
        <>
          <strong>Living Since:</strong> {safeValue(r.livingSince)} |{" "}
          <strong>Lease Ends:</strong> {safeValue(r.leaseEndDate)} |{" "}
          <strong>Aadhar:</strong> {safeValue(r.aadharNumber)} |{" "}
          <strong>Police Verified:</strong> {r.isPoliceVerified ? "Yes" : "No"} |{" "}
          <strong>Emergency:</strong> {safeValue(r.emergencyContactName)} (
          {safeValue(r.emergencyContactNumber)})
        </>
      )}
    />
  );
};

export default RenterListing;
