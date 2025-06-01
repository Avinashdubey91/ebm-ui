import React, { useEffect, useState, useRef } from "react";
import { createUser, fetchUserById, updateUser } from "../../../api/userApi";
import { fetchUserRoles } from "../../../api/userRoleApi";
import type { UserDTO } from "../../../types/UserDTO";
import type { UserRole } from "../../../types/UserRole";
import FormLabel from "../../../components/common/FormLabel";
import { useNavigate } from 'react-router-dom';
import Swal from "sweetalert2";

interface CreateUserFormProps {
  userId?: number;
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({ userId }) => {
  const navigate = useNavigate(); 
  const [formData, setFormData] = useState<UserDTO>({
    userName: "",
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    address: "",
    pinCode: "",
    roleId: undefined,
    profilePicture: "",
  });

  const [roles, setRoles] = useState<UserRole[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ ADDED

  useEffect(() => {
    fetchUserRoles()
      .then((roles) => setRoles(roles))
      .catch((err) => console.error("❌ Failed to load roles", err));
  }, []);

  useEffect(() => {
    // This is only for edit mode, no conflict with roles
    if (userId) {
      fetchUserById(userId)
        .then((user) => {
          setFormData({
            userId: user.userId,
            userName: user.userName,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            mobile: user.mobile,
            address: user.address,
            pinCode: user.pinCode,
            roleId: user.roleId,
            profilePicture: user.profilePicture,
          });

         if (user.profilePicture && user.profilePicture.trim().toLowerCase() !== "string") {
            setPreviewUrl(`${import.meta.env.VITE_API_BASE_URL?.replace("/api", "")}/${user.profilePicture}`);
          }
        })
        .catch((err) => {
          console.error("❌ Failed to fetch user by ID", err);
        });
    }
  }, [userId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "roleId" ? parseInt(value, 10) : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file)); // generate preview URL
    }
  };

  const resetForm = () => {
    setFormData({
      userName: "",
      firstName: "",
      lastName: "",
      email: "",
      mobile: "",
      address: "",
      pinCode: "",
      roleId: undefined,
      profilePicture: "",
    });
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // 👈 this clears the file input box
    }
    setPreviewUrl("");
  };

  const buildFormData = (): FormData => {
    const form = new FormData();

    form.append("Username", formData.userName);
    form.append("FirstName", formData.firstName);
    form.append("LastName", formData.lastName);
    if (formData.email) form.append("Email", formData.email);
    if (formData.mobile) form.append("Mobile", formData.mobile);
    if (formData.address) form.append("Address", formData.address);
    if (formData.pinCode) form.append("PinCode", formData.pinCode);
    if (formData.roleId !== undefined)
      form.append("RoleId", formData.roleId.toString());
    form.append("IsActive", "true"); // or use a state variable if you allow toggling
    if (selectedFile) form.append("profilePicture", selectedFile); // must match controller param

    return form;
  };

  const handleSubmit = async (
      e: React.FormEvent<HTMLFormElement> | { preventDefault: () => void }
    ) => {
      e.preventDefault();
      const username = localStorage.getItem("username") ?? "system";
      setIsSubmitting(true);

      try {
        const form = buildFormData();

        if (userId) {
          await updateUser(userId, form, username);
          await Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'User updated successfully!',
            confirmButtonColor: '#28a745',
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          await createUser(form, username);
          await Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'User created successfully!',
            confirmButtonColor: '#28a745',
            timer: 1500,
            showConfirmButton: false,
          });
        }

        setTimeout(() => {
          setIsSubmitting(false);
          navigate("/dashboard/users/list");
        }, 300);
      } catch (err) {
        console.error(err);
        setIsSubmitting(false);
        Swal.fire({
          icon: 'error',
          title: 'Oops!',
          text: userId ? 'Failed to update user.' : 'Failed to create user.',
          confirmButtonColor: '#dc3545',
        });
      }
    }; // ✅ FIXED this closing brace

  const handleSaveAndNext = () => {
    handleSubmit({ preventDefault: () => {} });
  };

  return (
    <>
      <div className="p-4 position-relative">
        {isSubmitting && (
          <div className="form-overlay">
            <div className="spinner-border big-red-spinner" role="status" />
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ pointerEvents: isSubmitting ? 'none' : 'auto', opacity: isSubmitting ? 0.6 : 1 }}>
          <div className="row align-items-end">
            <div className="col-md-6 mb-2">
              <FormLabel label="UserName" htmlFor="userName" required />
              <input
                id="userName"
                name="userName"
                className="form-control"
                value={formData.userName}
                onChange={handleChange}
                disabled={!!userId}
                required
              />
            </div>

            <div className="col-md-6 mb-2">
              <FormLabel label="First Name" htmlFor="firstName" required />
              <input
                id="firstName"
                name="firstName"
                className="form-control"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6 mb-2">
              <FormLabel label="Last Name" htmlFor="lastName" required />
              <input
                id="lastName"
                name="lastName"
                className="form-control"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6 mb-2">
              <FormLabel label="Email" htmlFor="email" required />
              <input
                id="email"
                name="email"
                type="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6 mb-2">
              <FormLabel label="Mobile" htmlFor="mobile" />
              <input
                id="mobile"
                name="mobile"
                className="form-control"
                value={formData.mobile}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6 mb-2">
              <FormLabel label="Address" htmlFor="address" />
              <input
                id="address"
                name="address"
                className="form-control"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6 mb-2">
              <FormLabel label="Pin Code" htmlFor="pinCode" />
              <input
                id="pinCode"
                name="pinCode"
                className="form-control"
                value={formData.pinCode}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6 mb-2">
              <FormLabel label="User Role" htmlFor="roleId" required />
              <select
                id="roleId"
                name="roleId"
                className="form-select"
                value={
                  formData.roleId !== undefined ? String(formData.roleId) : ""
                }
                onChange={handleChange}
                required
              >
                <option value="">-- Select Role --</option>
                {roles.map((role) =>
                  role.userRoleId !== undefined ? (
                    <option
                      key={role.userRoleId}
                      value={String(role.userRoleId)}
                    >
                      {role.roleName}
                    </option>
                  ) : null
                )}
              </select>
            </div>
            <div className="col-md-6 mb-2">
              <FormLabel label="Profile Picture" htmlFor="profilePictureFile" />
              <div className="d-flex align-items-center gap-3">
                <input
                  ref={fileInputRef}
                  id="profilePictureFile"
                  name="profilePictureFile"
                  type="file"
                  accept="image/*"
                  className="form-control"
                  onChange={handleFileChange}
                  style={{ flex: "1" }}
                />
              </div>
            </div>
            <div className="col-md-6 mb-2">
              <div className="d-flex flex-wrap w-100 gap-2">
                <button type="submit" className="btn btn-success flex-fill" disabled={isSubmitting}>
                  <i className="fa fa-save me-2"></i>Save
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger flex-fill"
                  onClick={resetForm}
                >
                  <i className="fa fa-undo me-2"></i>Reset Form
                </button>
                <button
                  type="button"
                  className="btn btn-primary flex-fill"
                  onClick={handleSaveAndNext}
                >
                  <i className="fa fa-plus me-2"></i>Save & Next
                </button>
              </div>
            </div>
            <div className="col-md-6 mb-2">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{
                    width: "70px",
                    height: "70px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                  }}
                />
              )}
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default CreateUserForm;
