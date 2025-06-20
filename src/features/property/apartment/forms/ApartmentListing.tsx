// features/property/apartment/forms/ApartmentListing.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllEntities, deleteEntity } from "../../../../api/genericCrudApi";
import type { ApartmentDTO } from "../../../../types/ApartmentDTO";
import { safeValue } from "../../../../utils/format";
import ListingTable from "../../../shared/ListingTable";
import {
  showDeleteConfirmation,
  showDeleteResult,
} from "../../../../utils/alerts/showDeleteConfirmation";
import { useCurrentMenu } from "../../../../hooks/useCurrentMenu";

const endpoints = {
  getAll: "/apartment/Get-All-Apartment",
  delete: "/apartment/Delete-Apartment",
};

const ENTITY_NAME = "apartment";

const ApartmentListing: React.FC = () => {
  const [apartments, setApartments] = useState<ApartmentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof ApartmentDTO>("apartmentId");
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  const navigate = useNavigate();
  const { createRoutePath } = useCurrentMenu();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchAllEntities<ApartmentDTO>(endpoints.getAll);
        setApartments(data);
      } catch (err) {
        console.error("❌ Failed to fetch apartments", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const toastMessage = sessionStorage.getItem("showToast");
    if (toastMessage) {
      showDeleteResult(true, ENTITY_NAME, toastMessage); // Only Toast
      sessionStorage.removeItem("showToast");
    }
  }, []);

  const sortedApartments = useMemo(() => {
    return [...apartments].sort((a, b) => {
      const valA = a[sortField] ?? "";
      const valB = b[sortField] ?? "";
      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [apartments, sortField, sortAsc]);

  const handleDelete = async (id?: number) => {
    if (!id) return;

    const deletedBy = parseInt(localStorage.getItem("userId") ?? "0", 10);
    if (!deletedBy) return;

    const confirmed = await showDeleteConfirmation(ENTITY_NAME);
    if (!confirmed) return;

    try {
      await deleteEntity(endpoints.delete, id, deletedBy);
      setApartments((prev) => prev.filter((a) => a.apartmentId !== id));
      await showDeleteResult(true, ENTITY_NAME);
    } catch (err) {
      console.error("❌ Failed to delete apartment", err);
      await showDeleteResult(false, ENTITY_NAME);
    }
  };

  return (
    <ListingTable
      data={sortedApartments}
      loading={loading}
      columns={[
        { key: "apartmentId", label: "ID", width: "60px" },
        { key: "apartmentName", label: "Name", width: "160px" },
        { key: "blockName", label: "Block", width: "120px" },
        { key: "buildingType", label: "Type", width: "120px" },
        { key: "totalFloors", label: "Floors", width: "80px" },
        { key: "totalFlats", label: "Flats", width: "80px" },
        { key: "hasLift", label: "Lift", width: "80px" },
        { key: "isOccupied", label: "Occupied", width: "100px" },
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
      onDelete={handleDelete}
      expandedRowId={expandedRowId}
      onExpand={setExpandedRowId}
      getRowKey={(item) => item.apartmentId ?? Math.floor(Math.random() * 100000)}
      renderExpandedRow={(a) => (
        <>
          <strong>Caretaker:</strong> {safeValue(a.caretakerName)} |{" "}
          <strong>Phone:</strong> {safeValue(a.caretakerPhone)} |{" "}
          <strong>Maintenance Lead:</strong> {safeValue(a.maintenanceLead)} |{" "}
          <strong>Emergency Contact:</strong> {safeValue(a.emergencyContact)} <br />
          <strong>Gate Facing:</strong> {safeValue(a.gateFacing)} |{" "}
          <strong>Lift:</strong> {a.hasLift ? "Yes" : "No"} |{" "}
          <strong>Generator:</strong> {a.hasGenerator ? "Yes" : "No"}
        </>
      )}
    />
  );
};

export default ApartmentListing;
