// features/property/society/forms/SocietyListing.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllSocieties, deleteSociety } from "../../../../api/SocietyApi";
import type { SocietyDTO } from "../../../../types/SocietyDTO";
import { safeValue } from "../../../../utils/format";
import ListingTable from "../../../shared/ListingTable";
import { showDeleteConfirmation, showDeleteResult } from "../../../../utils/alerts/showDeleteConfirmation";

const SocietyListing: React.FC = () => {
  const [societies, setSocieties] = useState<SocietyDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof SocietyDTO>("societyName");
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
  fetchAllSocieties()
    .then((data) => {
      console.log("✅ Societies Fetched:", data);
      setSocieties(data);
    })
    .catch((err) => console.error("❌ Failed to fetch societies", err))
    .finally(() => setLoading(false));
}, []);

  const sorted = [...societies].sort((a, b) => {
    const valA = a[sortField] ?? "";
    const valB = b[sortField] ?? "";
    return sortAsc
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  return (
    <ListingTable
      data={sorted}
      loading={loading}
      columns={[
		    { key: "societyId", label: "Id", width: "30px"},
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
      onEdit={(id) => navigate(`/dashboard/property/create/${id}`)}
      onDelete={async (id) => {
        const deletedBy = parseInt(localStorage.getItem("userId") ?? "0", 10);
        if (!deletedBy || !id) return;

        const confirmed = await showDeleteConfirmation("society");
        if (!confirmed) return;

        try {
          await deleteSociety(id, deletedBy);
          setSocieties((prev) => prev.filter((s) => s.societyId !== id));
          await showDeleteResult(true, "society");
        } catch (err) {
          console.error("❌ Failed to delete society", err);
          await showDeleteResult(false, "society");
        }
      }}
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