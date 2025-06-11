import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllUsers, deleteUser } from "../../../api/userApi";
import type { UserDTO } from "../../../types/UserDTO";
import { FaEdit, FaTrash, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import Swal from "sweetalert2";
import { abbreviateRole } from "../../../utils/abbreviate";
import { toTitleCase, safeValue, formatDate } from "../../../utils/format";

const UserListTable: React.FC = () => {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof UserDTO>("userName");
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllUsers()
      .then((data) => setUsers(data))
      .catch((err) => console.error("❌ Failed to fetch users", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (field: keyof UserDTO) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getSortIcon = (field: keyof UserDTO) => {
    if (sortField !== field) return <FaSort className="text-muted" />;
    return sortAsc ? (
      <FaSortUp className="text-primary" />
    ) : (
      <FaSortDown className="text-primary" />
    );
  };

  const sortedUsers = [...users].sort((a, b) => {
    const valA = a[sortField] ?? "";
    const valB = b[sortField] ?? "";
    return sortAsc
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  const handleEdit = (userId?: number) => {
    if (userId) navigate(`/dashboard/users/create/${userId}`);
  };

  const handleDelete = async (userId?: number) => {
    if (!userId) return;

    const result = await Swal.fire({
      icon: "warning",
      title: "Are you sure?",
      text: "Do you really want to delete this user? This process cannot be undone.",
      showCancelButton: true,
      confirmButtonColor: "#e74c3c",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      const deletedBy = parseInt(localStorage.getItem("userId") ?? "0", 10);
      if (!deletedBy) {
        Swal.fire("Error", "Your userId is missing. Please login again.", "error");
        return;
      }

      try {
        await deleteUser(userId, deletedBy); // ✅ No more TS error
        setUsers((prev) => prev.filter((u) => u.userId !== userId));
        Swal.fire("Deleted!", "User has been deleted.", "success");
      } catch (err) {
        console.error("❌ Failed to delete user", err);
        Swal.fire("Error!", "Failed to delete user.", "error");
      }
    }
  };

  if (loading) return <p>Loading...</p>;
  if (users.length === 0) return <p>No users found.</p>;

  return (
    <div className="table-responsive p-2">
      <table className="table table-ebm-listing align-middle">
        <thead className="table-primary">
          <tr>
            {[
              { key: "userName", label: "User Name", width: "120px" },
              { key: "firstName", label: "Name", width: "160px" },
              { key: "email", label: "Email", width: "200px" },
              { key: "mobile", label: "Mobile", width: "120px" },
              { key: "addressLine1", label: "Address", width: "160px" },
              { key: "pinCode", label: "Pin Code", width: "100px" },
              { key: "profilePicture", label: "Photo", width: "100px" },
              { key: "roleName", label: "Role", width: "100px" },
            ].map(({ key, label, width }) => (
              <th
                key={key}
                onClick={() => handleSort(key as keyof UserDTO)}
                style={{ cursor: "pointer", whiteSpace: "nowrap", width }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <span>{label}</span>
                  <span className="ms-1">
                    {getSortIcon(key as keyof UserDTO)}
                  </span>
                </div>
              </th>
            ))}
            <th
              style={{
                textAlign: "center",
                width: "110px",
                whiteSpace: "nowrap",
              }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedUsers.map((u) => (
            <React.Fragment key={u.userId}>
              <tr
                onClick={() =>
                  setExpandedRowId((prev: number | null): number | null =>
                    prev === u.userId ? null : u.userId ?? null
                  )
                }
                style={{ cursor: "pointer" }}
              >
                <td>{u.userName}</td>
                <td>
                  {u.firstName} {u.lastName}
                </td>
                <td>{u.email || "-"}</td>
                <td>{u.mobile || "-"}</td>
                <td>{u.addressLine1 || "-"}</td>
                <td>{u.pinCode || "-"}</td>
                <td className="text-center">
                  {u.profilePicture &&
                  u.profilePicture.trim().toLowerCase() !== "string" ? (
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL?.replace(
                        "/api",
                        ""
                      )}/${u.profilePicture}`}
                      alt="Profile"
                      width={70}
                      height={70}
                      style={{
                        objectFit: "cover",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                      }}
                    />
                  ) : (
                    <strong><span style={{ color: "#e0552b" }}>#NA</span></strong>
                  )}
                </td>
                <td title={u.roleName}>{abbreviateRole(u.roleName)}</td>
                <td className="text-center">
                  <div className="d-flex justify-content-center gap-3 fs-2">
                    <button
                      className="btn btn-link p-0 text-primary"
                      title="Edit"
                      onClick={() => handleEdit(u.userId)}
                    >
                      <FaEdit size={22} />
                    </button>
                    <button
                      className="btn btn-link p-0 text-danger"
                      title="Delete"
                      onClick={() => handleDelete(u.userId)}
                    >
                      <FaTrash size={22} />
                    </button>
                  </div>
                </td>
              </tr>
              {expandedRowId === u.userId && (
                <tr>
                  <td colSpan={9} className="bg-light text-muted">
                    <strong>DOB:</strong> {formatDate(u.dob)} |{" "}
                    <strong>Street:</strong> {safeValue(u.street)} |{" "}
                    <strong>City:</strong> {safeValue(u.city)} |{" "}
                    <strong>District:</strong> {u.districtName ? toTitleCase(u.districtName) : "-"} |{" "}
                    <strong>State:</strong> {u.stateName ? toTitleCase(u.stateName) : "-"} |{" "}
                    <strong>Country:</strong> {u.countryName ? toTitleCase(u.countryName) : "-"}
                    <br />
                    <strong>Remarks:</strong> {safeValue(u.remarks)}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserListTable;
