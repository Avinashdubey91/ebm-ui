import React, { useEffect, useState } from "react";
import { createUser } from "../../../api/userApi";
import { fetchUserRoles } from "../../../api/userRoleApi";
import type { UserDTO } from "../../../types/UserDTO";
import type { UserRole } from "../../../types/UserRole";
import FormLabel from "../../../components/common/FormLabel";

const CreateUserForm: React.FC = () => {
  const [formData, setFormData] = useState<UserDTO>({
    username: "",
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

  useEffect(() => {
    fetchUserRoles()
      .then((roles) => setRoles(roles))
      .catch((err) => console.error("❌ Failed to load roles", err));
  }, []);

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
      setSelectedFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
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
  };

  const buildFormData = (): FormData => {
    const form = new FormData();

    form.append("Username", formData.username);
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
    const createdBy = localStorage.getItem("username") ?? "system";
    try {
      const form = buildFormData();
      await createUser(form, createdBy);
      alert("✅ User created successfully!");
      resetForm();
    } catch (err) {
      alert("❌ Failed to create user. Check console.");
      console.error(err);
    }
  };

  const handleSaveAndNext = () => {
    handleSubmit({ preventDefault: () => {} });
  };

  return (
    <>
      <div
        className="bg-light border-bottom py-3 px-4 mb-4"
        style={{ width: "100%" }}
      >
        <h4 className="m-0 text-primary d-flex align-items-center">
          Add New User
        </h4>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row align-items-end">
          <div className="col-md-6 mb-3">
            <FormLabel label="Username" htmlFor="username" required />
            <input
              id="username"
              name="username"
              className="form-control"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6 mb-3">
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

          <div className="col-md-6 mb-3">
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

          <div className="col-md-6 mb-3">
            <FormLabel label="Email" htmlFor="email" />
            <input
              id="email"
              name="email"
              type="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-6 mb-3">
            <FormLabel label="Mobile" htmlFor="mobile" />
            <input
              id="mobile"
              name="mobile"
              className="form-control"
              value={formData.mobile}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-6 mb-3">
            <FormLabel label="Address" htmlFor="address" />
            <input
              id="address"
              name="address"
              className="form-control"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-6 mb-3">
            <FormLabel label="Pin Code" htmlFor="pinCode" />
            <input
              id="pinCode"
              name="pinCode"
              className="form-control"
              value={formData.pinCode}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-6 mb-3">
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
                  <option key={role.userRoleId} value={String(role.userRoleId)}>
                    {role.roleName}
                  </option>
                ) : null
              )}
            </select>
          </div>

          <div className="col-md-6 mb-3">
            <FormLabel label="Profile Picture" htmlFor="profilePictureFile" />
            <input
              id="profilePictureFile"
              name="profilePictureFile"
              type="file"
              accept="image/*"
              className="form-control"
              onChange={handleFileChange}
            />
          </div>
          <div className="col-md-6 mb-3">
            <div className="d-flex flex-wrap w-100 gap-2">
              <button type="submit" className="btn btn-success flex-fill">
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
        </div>
      </form>
    </>
  );
};

export default CreateUserForm;