// src/features/users/forms/UserListTable.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllUsers } from "../../../api/userApi";
import type { UserDTO } from "../../../types/UserDTO";
import { FaEdit, FaTrash, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";

const UserListTable: React.FC = () => {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof UserDTO>("userName");
  const [sortAsc, setSortAsc] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllUsers()
      .then((data) => setUsers(data))
      .catch((err) => console.error("❌ Failed to fetch users", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (field: keyof UserDTO) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
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
    if (userId) {
      navigate(`/dashboard/users/create/${userId}`);
    }
  };

  const handleDelete = (userId?: number) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      alert(`🗑️ Delete User ID: ${userId}`);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (users.length === 0) return <p>No users found.</p>;

  return (
    <>
      <div className="table-responsive">
        <table className="table table-bordered table-ebm-listing align-middle">
          <thead className="table-primary">
            <tr>
              {[
                { key: "userName", label: "User Name", width: "120px" },
                { key: "firstName", label: "Name", width: "180px" },
                { key: "email", label: "Email", width: "220px" },
                { key: "mobile", label: "Mobile", width: "130px" },
                { key: "address", label: "Address", width: "200px" },
                { key: "pinCode", label: "Pin Code", width: "100px" },
                { key: "profilePicture", label: "Photo", width: "100px" },
                { key: "roleName", label: "Role", width: "100px" },
              ].map(({ key, label, width }) => (
                <th
                  key={key}
                  onClick={() => handleSort(key as keyof UserDTO)}
                  style={{
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    width,
                    verticalAlign: "middle",
                  }}
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
              <tr key={u.userId}>
                <td>{u.userName}</td>
                <td>
                  {u.firstName} {u.lastName}
                </td>
                <td>{u.email || "-"}</td>
                <td>{u.mobile || "-"}</td>
                <td>{u.address || "-"}</td>
                <td>{u.pinCode || "-"}</td>
                <td className="text-center align-middle">
                    {u.profilePicture && u.profilePicture.trim().toLowerCase() !== 'string' ? (
                        <img
                        src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/${u.profilePicture}`}
                        alt="Profile"
                        width={70}
                        height={70}
                        style={{
                            objectFit: "cover",
                            borderRadius: "6px",
                            border: "1px solid #ccc"
                        }}
                        onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.parentElement!.innerHTML = `<span class="fw-bold" style='color:#2028c7;'>No Photo</span>`;
                        }}
                        />
                    ) : (
                        <span style={{ color: "#888" }}>No Photo</span>
                    )}
                </td>
                <td>{u.roleName|| "-"}</td>
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
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default UserListTable;
