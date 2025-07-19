// features/property/flat/pages/FlatListing.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllEntities, deleteEntity } from "../../../../api/genericCrudApi";
import type { FlatDTO } from "../../../../types/FlatDTO";
import { safeValue } from "../../../../utils/format";
import SharedListingTable from "../../../shared/SharedListingTable";
import {
  showDeleteConfirmation,
  showDeleteResult,
} from "../../../../utils/alerts/showDeleteConfirmation";
import { useCurrentMenu } from "../../../../hooks/useCurrentMenu";

const endpoints = {
  getAll: "/flat/Get-All-Flats",
  delete: "/flat/Delete-Flat",
};

const ENTITY_NAME = "flat";

const FlatListing: React.FC = () => {
  const [flats, setFlats] = useState<FlatDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof FlatDTO>("flatNumber");
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  const navigate = useNavigate();
  const { createRoutePath } = useCurrentMenu();

  useEffect(() => {
    const fetchFlats = async () => {
      try {
        const data = await fetchAllEntities<FlatDTO>(endpoints.getAll);
        setFlats(data);
      } catch (err) {
        console.error("❌ Failed to fetch flats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFlats();
  }, []);

  useEffect(() => {
    const toastMessage = sessionStorage.getItem("showToast");
    if (toastMessage) {
      showDeleteResult(true, ENTITY_NAME, toastMessage);
      sessionStorage.removeItem("showToast");
    }
  }, []);

  const sortedFlats = useMemo(() => {
    return [...flats].sort((a, b) => {
      const valA = a[sortField] ?? "";
      const valB = b[sortField] ?? "";
      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [flats, sortField, sortAsc]);

  const handleDeleteFlat = async (id?: number) => {
    if (!id) return;

    const deletedBy = parseInt(localStorage.getItem("userId") ?? "0", 10);
    if (!deletedBy || !id) return;

    const confirmed = await showDeleteConfirmation(ENTITY_NAME);
    if (!confirmed) return;

    try {
      await deleteEntity(endpoints.delete, id, deletedBy);
      setFlats((prev) => prev.filter((f) => f.flatId !== id));
      await showDeleteResult(true, ENTITY_NAME);
    } catch (err) {
      console.error("❌ Failed to delete flat", err);
      await showDeleteResult(false, ENTITY_NAME);
    }
  };

  return (
    <SharedListingTable
      data={sortedFlats}
      loading={loading}
      columns={[
        { key: "flatNumber", label: "Flat No", width: "80px" },
        { key: "floorNumber", label: "Floor", width: "70px" },
        { key: "flatType", label: "Type", width: "100px" },
        { key: "superBuiltUpArea", label: "Area (sq.ft)", width: "100px" },
        { key: "carParkingSlots", label: "Parking", width: "80px" },
        {
          key: "isRented",
          label: "Rented",
          width: "80px",
          renderCell: (f) => (f.isRented ? "Yes" : "No"),
        },
        {
          key: "isFurnished",
          label: "Furnished",
          width: "100px",
          renderCell: (f) => (f.isFurnished ? "Yes" : "No"),
        },
        {
          key: "hasGasPipeline",
          label: "Gas",
          width: "70px",
          renderCell: (f) => (f.hasGasPipeline ? "Yes" : "No"),
        },
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
      onDelete={handleDeleteFlat}
      expandedRowId={expandedRowId}
      onExpand={setExpandedRowId}
      getRowKey={(f) => f.flatId ?? Math.floor(Math.random() * 100000)}
      renderExpandedRow={(f) => (
        <>
          <strong>Direction:</strong> {safeValue(f.facingDirection)} |{" "}
          <strong>Email:</strong> {safeValue(f.registeredEmail)} |{" "}
          <strong>Mobile:</strong> {safeValue(f.registeredMobile)} |{" "}
          <strong>Water:</strong> {f.hasWaterConnection ? "Yes" : "No"} |{" "}
          <strong>Balcony:</strong> {f.hasBalcony ? "Yes" : "No"} |{" "}
          <strong>Solar:</strong> {f.hasSolarPanel ? "Yes" : "No"} |{" "}
          <strong>Internet:</strong> {f.hasInternetConnection ? "Yes" : "No"}
          <br />
          <strong>Utility Notes:</strong> {safeValue(f.utilityNotes)}
        </>
      )}
    />
  );
};

export default FlatListing;
