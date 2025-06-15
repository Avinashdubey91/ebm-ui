// features/users/forms/UserListing.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllUsers, deleteUser } from "../../../api/userApi";
import type { UserDTO } from "../../../types/UserDTO";
import { abbreviateRole } from "../../../utils/abbreviate";
import { formatDate, safeValue, toTitleCase } from "../../../utils/format";
import ListingTable from "../../shared/ListingTable";
import { showDeleteConfirmation, showDeleteResult } from "../../../utils/alerts/showDeleteConfirmation";

const UserListing: React.FC = () => {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof UserDTO>("userName");
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllUsers()
      .then((data) => {
        console.log("✅ Users Fetched:", data);
        setUsers(data);
      })
      .catch((err) => console.error("❌ Failed to fetch users", err))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (userId?: number) => {
    if (!userId) return;

    const loggedInUserId = parseInt(localStorage.getItem("userId") ?? "0", 10);
    if (userId === loggedInUserId) {
      await showDeleteResult(false, "You cannot delete your own User Account.");
      return;
    }

    const confirmed = await showDeleteConfirmation("user");
    if (!confirmed) return;

    try {
      await deleteUser(userId, loggedInUserId);
      setUsers((prev) => prev.filter((u) => u.userId !== userId));
      await showDeleteResult(true, "user");
    } catch (err) {
      console.error("❌ Failed to delete user", err);
      await showDeleteResult(false, "user");
    }
  };

  const sorted = [...users].sort((a, b) => {
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
        { key: "userName", label: "User Name", width: "120px" },
        { key: "firstName", label: "Name", width: "160px" },
        { key: "email", label: "Email", width: "200px" },
        { key: "mobile", label: "Mobile", width: "120px" },
        { key: "addressLine1", label: "Address", width: "160px" },
        { key: "pinCode", label: "Pin Code", width: "100px" },
        {
          key: "roleName",
          label: "Role",
          width: "100px",
          renderCell: (user) => (
            <span title={user.roleName}>{abbreviateRole(user.roleName)}</span>
          ),
        }
      ]}
      sortField={sortField}
      sortAsc={sortAsc}
      onSort={(field) => {
        setSortField(field);
        setSortAsc((prev) => (field === sortField ? !prev : true));
      }}
      onEdit={(id) => navigate(`/dashboard/users/create/${id}`)}
      onDelete={handleDelete}
      expandedRowId={expandedRowId}
      onExpand={setExpandedRowId}
      getRowKey={(user) => user.userId ?? Math.floor(Math.random() * 100000)}
      renderExpandedRow={(u) => (
        <>
          <strong>DOB:</strong> {formatDate(u.dob)} |{" "}
          <strong>Street:</strong> {safeValue(u.street)} |{" "}
          <strong>City:</strong> {safeValue(u.city)} |{" "}
          <strong>District:</strong> {u.districtName ? toTitleCase(u.districtName) : "-"} |{" "}
          <strong>State:</strong> {u.stateName ? toTitleCase(u.stateName) : "-"} |{" "}
          <strong>Country:</strong> {u.countryName ? toTitleCase(u.countryName) : "-"}
          <br />
          <strong>Remarks:</strong> {safeValue(u.remarks)}
        </>
      )}
    />
  );
};

export default UserListing;
