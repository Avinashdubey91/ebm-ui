import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllEntities, deleteEntity } from "../../../../api/genericCrudApi";
import type { FlatRenterDTO } from "../../../../types/FlatRenterDTO";
import { safeValue, formatDate } from "../../../../utils/format";
import SharedListingTable from "../../../shared/SharedListingTable";
import {
  showDeleteConfirmation,
  showDeleteResult,
} from "../../../../utils/alerts/showDeleteConfirmation";
import { showAddUpdateResult } from "../../../../utils/alerts/showAddUpdateConfirmation";
import { useCurrentMenu } from "../../../../hooks/useCurrentMenu";

const endpoints = {
  getAll: "/flatrenter/Get-All-Renters",
  delete: "/flatrenter/Delete-Renter",
};

const ENTITY_NAME = "flat renter";

const FlatRenterListing: React.FC = () => {
  const [renters, setRenters] = useState<FlatRenterDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof FlatRenterDTO>("flatRenterId");
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  const navigate = useNavigate();
  const { createRoutePath } = useCurrentMenu();

  useEffect(() => {
    const fetchRenters = async () => {
      try {
        const data = await fetchAllEntities<FlatRenterDTO>(endpoints.getAll);
        const formatted = data.map((r) => ({
          ...r,
          rentFrom: formatDate(r.rentFrom),
          rentTo: formatDate(r.rentTo),
        }));
        setRenters(formatted);
      } catch (err) {
        console.error("❌ Failed to fetch flat renters", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRenters();
  }, []);

  useEffect(() => {
    const toastMessage = sessionStorage.getItem("showToast");
    if (toastMessage) {
      showAddUpdateResult(true, ENTITY_NAME, toastMessage);
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
      setRenters((prev) => prev.filter((r) => r.flatRenterId !== id));
      await showDeleteResult(true, ENTITY_NAME);
    } catch (err) {
      console.error("❌ Failed to delete flat renter", err);
      await showDeleteResult(false, ENTITY_NAME);
    }
  };

  return (
    <SharedListingTable
      data={sortedRenters}
      loading={loading}
      columns={[
        { key: "flatNumber", label: "Flat Number", width: "100px" },
        { key: "firstName", label: "First Name", width: "140px" },
        { key: "lastName", label: "Last Name", width: "140px" },
        { key: "gender", label: "Gender", width: "80px" },
        { key: "mobile", label: "Mobile", width: "120px" },
        { key: "emailId", label: "Email", width: "180px" },
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
      getRowKey={(item) => item.flatRenterId ?? Math.floor(Math.random() * 100000)}
      renderExpandedRow={(r) => (
        <>
          <strong>Rented From:</strong> {formatDate(r.rentFrom)} |{" "}
          <strong>To:</strong> {formatDate(r.rentTo)} |{" "}
          <strong>Agreement #:</strong> {safeValue(r.agreementNumber)} |{" "}
          <strong>Notes:</strong> {safeValue(r.notes)}
        </>
      )}
    />
  );
};

export default FlatRenterListing;
