import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllEntities, deleteEntity } from "../../../api/genericCrudApi";
import type { UserDTO } from "../../../types/UserDTO";
import { abbreviateRole } from "../../../utils/abbreviate";
import { formatDate, safeValue, toTitleCase } from "../../../utils/format";
import SharedListingTable from "../../shared/SharedListingTable";
import { showDeleteConfirmation, showDeleteResult } from "../../../utils/alerts/showDeleteConfirmation";
import { renderImageThumbnail } from "../../../utils/renderImageThumbnail";
import { useCurrentMenu } from "../../../hooks/useCurrentMenu";

const endpoints = {
  getAll: '/user/Get-All-Users',
  delete: '/user/Delete-User',
};

const UserListing: React.FC = () => {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof UserDTO>("userName");
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const navigate = useNavigate();
  const { createRoutePath } = useCurrentMenu();

  useEffect(() => {
    fetchAllEntities<UserDTO>(endpoints.getAll)
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
      await showDeleteResult(
        false,
        "user",
        "You can't delete your own User Account.",
        "Action Prohibited!" // ✅ override the default title
      );
      return;
    }

    const confirmed = await showDeleteConfirmation("user");
    if (!confirmed) return;

    try {
      await deleteEntity(endpoints.delete, userId, loggedInUserId);
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
    <SharedListingTable
      data={sorted}
      loading={loading}
      columns={[
        { key: "userName", label: "User Name", width: "10px" },
        { key: "firstName", label: "Name", width: "100px", renderCell: (user) => `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()},
        { key: "email", label: "Email", width: "150px" },
        { key: "mobile", label: "Mobile", width: "100px" },
        { key: "addressLine1", label: "Address", width: "160px" },
        { key: "pinCode", label: "PIN", width: "100px" },
        {
          key: "roleName",
          label: "Role",
          width: "80px",
          renderCell: (user) => (
            <span title={user.roleName}>{abbreviateRole(user.roleName)}</span>
          ),
        },
        {
          key: "profilePicture",
          label: "Photo",
          width: "70px",
          renderCell: (user) => renderImageThumbnail(user.profilePicture),
        }
      ]}
      sortField={sortField}
      sortAsc={sortAsc}
      onSort={(field) => {
        setSortField(field);
        setSortAsc((prev) => (field === sortField ? !prev : true));
      }}
      onEdit={(id) => {
        // Get the base create route from useCurrentMenu
        const editPath = createRoutePath.replace(/create$/i, `edit/${id}`);
        navigate(editPath);
      }}
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
