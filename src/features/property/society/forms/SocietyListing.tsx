// features/property/society/forms/SocietyListing.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllEntities, deleteEntity } from "../../../../api/genericCrudApi";
import type { SocietyDTO } from "../../../../types/SocietyDTO";
import { safeValue } from "../../../../utils/format";
import ListingTable from "../../../shared/ListingTable";
import {
  showDeleteConfirmation,
  showDeleteResult,
} from "../../../../utils/alerts/showDeleteConfirmation";
import { useCurrentMenu } from "../../../../hooks/useCurrentMenu";

const endpoints = {
  getAll: "/society/Get-All-Societies",
  delete: "/society/Delete-Society",
};

const ENTITY_NAME = "society";

const SocietyListing: React.FC = () => {
  const [societies, setSocieties] = useState<SocietyDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof SocietyDTO>("societyId");
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  const navigate = useNavigate();
  const { createRoutePath } = useCurrentMenu();

  // 🔄 Fetch data
  useEffect(() => {
    const fetchSocieties = async () => {
      try {
        const data = await fetchAllEntities<SocietyDTO>(endpoints.getAll);
        setSocieties(data);
      } catch (err) {
        console.error("❌ Failed to fetch societies", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSocieties();
  }, []);

  // ✅ Toast after add/update
  useEffect(() => {
    const toastMessage = sessionStorage.getItem("showToast");
    if (toastMessage) {
      showDeleteResult(true, ENTITY_NAME, toastMessage); // Only Toast
      sessionStorage.removeItem("showToast");
    }
  }, []);

  // 🔁 Memoized sorted data
  const sortedSocieties = useMemo(() => {
    return [...societies].sort((a, b) => {
      const valA = a[sortField] ?? "";
      const valB = b[sortField] ?? "";
      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [societies, sortField, sortAsc]);

  // 🗑️ Handle delete
  const handleDeleteSociety = async (id?: number) => {
    if (!id) return;

    const deletedBy = parseInt(localStorage.getItem("userId") ?? "0", 10);
    if (!deletedBy || !id) return;

    const confirmed = await showDeleteConfirmation(ENTITY_NAME);
    if (!confirmed) return;

    try {
      await deleteEntity(endpoints.delete, id, deletedBy);
      setSocieties((prev) => prev.filter((s) => s.societyId !== id));
      await showDeleteResult(true, ENTITY_NAME);
    } catch (err) {
      console.error("❌ Failed to delete society", err);
      await showDeleteResult(false, ENTITY_NAME);
    }
  };

  return (
    <ListingTable
      data={sortedSocieties}
      loading={loading}
      columns={[
        { key: "societyId", label: "Id", width: "30px" },
        { key: "societyName", label: "Name", width: "160px" },
        { key: "city", label: "City", width: "140px" },
        { key: "address", label: "Address", width: "200px" },
        { key: "pinCode", label: "Pin Code", width: "100px" },
        { key: "societyType", label: "Type", width: "120px" },
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
      onDelete={handleDeleteSociety}
      expandedRowId={expandedRowId}
      onExpand={setExpandedRowId}
      getRowKey={(item) => item.societyId ?? Math.floor(Math.random() * 100000)}
      renderExpandedRow={(s) => (
        <>
          <strong>Secretary:</strong> {safeValue(s.secretaryName)} |{" "}
          <strong>Phone:</strong> {safeValue(s.secretaryPhone)} |{" "}
          <strong>Treasurer:</strong> {safeValue(s.treasurerName)} |{" "}
          <strong>Phone:</strong> {safeValue(s.treasurerPhone)} |{" "}
          <strong>Clubhouse:</strong> {s.hasClubhouse ? "Yes" : "No"} |{" "}
          <strong>Swimming Pool:</strong> {s.hasSwimmingPool ? "Yes" : "No"}
          <br />
          <strong>Registered:</strong> {safeValue(s.registrationNumber)} |{" "}
          <strong>Contact Person:</strong> {safeValue(s.contactPerson)} |{" "}
          <strong>Email:</strong> {safeValue(s.email)} |{" "}
          <strong>Contact No.:</strong> {safeValue(s.contactNumber)} |{" "}
        </>
      )}
    />
  );
};

export default SocietyListing;
