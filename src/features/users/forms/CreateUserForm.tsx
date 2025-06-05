import React, { useEffect, useState, useRef, useMemo } from "react";
import { createUser, fetchUserById, updateUser } from "../../../api/userApi";
import { fetchUserRoles } from "../../../api/userRoleApi";
import type { UserDTO } from "../../../types/UserDTO";
import type { UserRole } from "../../../types/UserRole";
import FormLabel from "../../../components/common/FormLabel";
import Swal from "sweetalert2";
import DateInput from "../../../components/common/DateInput";
import { useNavigate } from "react-router-dom";
import { useFormNavigationGuard } from "../../../hooks/useFormNavigationGuard";

interface CreateUserFormProps {
  userId?: number;
  onUnsavedChange?: (unsaved: boolean) => void; // ✅ new prop
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({ userId, onUnsavedChange }) => {
  const [formData, setFormData] = useState<UserDTO>({
    userName: "",
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    addressLine1: "",
    street: "",
    city: "",
    country: "",
    gender: "",
    dob: "",
    remarks: "",
    pinCode: "",
    roleId: undefined,
    profilePicture: "",
  });

  const navigate = useNavigate();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialFormRef = useRef<UserDTO | null>(null);

  useEffect(() => {
    if (!userId) {
      initialFormRef.current = { ...formData };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // ✅ add userId (you don't need formData here)

  useEffect(() => {
    fetchUserRoles()
      .then((roles) => setRoles(roles))
      .catch((err) => console.error("❌ Failed to load roles", err));
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUserById(userId)
        .then((user) => {
          const formattedUser: UserDTO = {
            userId: user.userId,
            userName: user.userName,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            mobile: user.mobile,
            addressLine1: user.addressLine1,
            street: user.street,
            city: user.city,
            country: user.country,
            gender: user.gender,
            dob: user.dob ? new Date(user.dob).toISOString().split("T")[0] : "",
            remarks: user.remarks,
            pinCode: user.pinCode,
            roleId: user.roleId,
            profilePicture: user.profilePicture,
          };

          setFormData(formattedUser);
          initialFormRef.current = { ...formattedUser };

          if (
            user.profilePicture &&
            user.profilePicture.trim().toLowerCase() !== "string"
          ) {
            setPreviewUrl(
              `${import.meta.env.VITE_API_BASE_URL?.replace("/api", "")}/${
                user.profilePicture
              }`
            );
          }
        })
        .catch((err) => {
          console.error("❌ Failed to fetch user by ID", err);
        });
    }
  }, [userId]);

  const hasUnsavedChanges = useMemo(() => {
    if (!initialFormRef.current) return false;

    const trim = (str: string | undefined | null) => (str ?? "").trim();

    const keys = Object.keys(formData) as (keyof UserDTO)[];
    return keys.some((key) => {
      const currentVal = formData[key];
      const initialVal = initialFormRef.current![key];

      if (typeof currentVal === "string" && typeof initialVal === "string") {
        return trim(currentVal) !== trim(initialVal);
      }

      return currentVal !== initialVal;
    });
  }, [formData]);

  useEffect(() => {
    onUnsavedChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onUnsavedChange]);

  useFormNavigationGuard(hasUnsavedChanges && !isSubmitting);

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
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    const empty: UserDTO = {
      userName: formData.userName,
      firstName: "",
      lastName: "",
      email: "",
      mobile: "",
      addressLine1: "",
      street: "",
      city: "",
      country: "",
      gender: "",
      dob: "",
      remarks: "",
      pinCode: "",
      roleId: undefined,
      profilePicture: "",
    };

    setFormData(empty);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setPreviewUrl("");
  };

  const buildFormData = (): FormData => {
    const form = new FormData();
    form.append("Username", formData.userName);
    form.append("FirstName", formData.firstName);
    form.append("LastName", formData.lastName);
    if (formData.email) form.append("Email", formData.email);
    if (formData.mobile) form.append("Mobile", formData.mobile);
    if (formData.addressLine1)
      form.append("AddressLine1", formData.addressLine1);
    if (formData.street) form.append("Street", formData.street);
    if (formData.city) form.append("City", formData.city);
    if (formData.country) form.append("Country", formData.country);
    if (formData.gender) form.append("Gender", formData.gender);
    if (formData.dob) form.append("DOB", formData.dob);
    if (formData.remarks) form.append("Remarks", formData.remarks);
    if (formData.pinCode) form.append("PinCode", formData.pinCode);
    if (formData.roleId !== undefined)
      form.append("RoleId", formData.roleId.toString());
    form.append("IsActive", "true");

    if (selectedFile) {
      form.append("ProfilePicture", selectedFile);
    } else if (formData.profilePicture) {
      form.append("ProfilePicture", formData.profilePicture);
    }
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
          icon: "success",
          title: "Success",
          text: "User updated successfully!",
          confirmButtonColor: "#28a745",
          timer: 1500,
          showConfirmButton: true,
        });
      } else {
        await createUser(form, username);
        await Swal.fire({
          icon: "success",
          title: "Success",
          text: "User created successfully!",
          confirmButtonColor: "#28a745",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      setTimeout(() => {
        setIsSubmitting(false);
        initialFormRef.current = { ...formData };
        navigate("/dashboard/users/list");
      }, 300);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      Swal.fire({
        icon: "error",
        title: "Oops!",
        text: userId ? "Failed to update user." : "Failed to create user.",
        confirmButtonColor: "#dc3545",
      });
    }
  };

  const handleSaveAndNext = () => {
    handleSubmit({ preventDefault: () => {} });
  };

  useEffect(() => {
    if (!userId) {
      const firstLetter = formData.firstName.trim().charAt(0);
      const lastNameParts = formData.lastName.trim().split(/\s+/);
      const lastWord = lastNameParts[lastNameParts.length - 1];

      if (firstLetter && lastWord) {
        const computedUserName = `${firstLetter}${lastWord}`.replace(/\s/g, "").trim();
        const capitalizedUserName = computedUserName.charAt(0).toUpperCase() + computedUserName.slice(1);
        setFormData((prev) => ({
          ...prev,
          userName: capitalizedUserName,
        }));
      }
    }
  }, [formData.firstName, formData.lastName, userId]);

  return (
    <>
      <div className="p-4 position-relative">
        {isSubmitting && (
          <div className="form-overlay">
            <div className="spinner-border big-red-spinner" role="status" />
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            pointerEvents: isSubmitting ? "none" : "auto",
            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          <div className="row align-items-end">
            {/* === Basic Info === */}
            <div className="col-md-4 mb-2">
              <FormLabel label="UserName" htmlFor="userName" required />
              <input
                id="userName"
                name="userName"
                className="form-control"
                value={formData.userName}
                onChange={handleChange}
                disabled
                title="Username is auto-generated and cannot be modified"
                required
              />
            </div>
            <div className="col-md-4 mb-2">
              <FormLabel label="First Name" htmlFor="firstName" required />
              <input
                id="firstName"
                name="firstName"
                className="form-control"
                value={formData.firstName}
                onChange={handleChange}
                disabled={!!userId}
                required
              />
            </div>
            <div className="col-md-4 mb-2">
              <FormLabel label="Last Name" htmlFor="lastName" required />
              <input
                id="lastName"
                name="lastName"
                className="form-control"
                value={formData.lastName}
                onChange={handleChange}
                disabled={!!userId}
                required
              />
            </div>

            {/* === Contact Info === */}
            <div className="col-md-4 mb-2">
              <FormLabel label="Email" htmlFor="email" required />
              <input
                id="email"
                name="email"
                type="email"
                className="form-control"
                value={formData.email ?? ""}
                onChange={handleChange}
                onInvalid={(e) =>
                  e.currentTarget.setCustomValidity(
                    "Please enter valid Email Address"
                  )
                }
                onInput={(e) => e.currentTarget.setCustomValidity("")}
                required
              />
            </div>
            <div className="col-md-4 mb-2">
              <FormLabel label="Mobile" htmlFor="mobile" />
              <input
                id="mobile"
                name="mobile"
                className="form-control"
                value={formData.mobile ?? ""}
                onChange={handleChange}
                pattern="^\d{10}$"
                maxLength={10}
                title="Mobile number must be 10 digits"
                inputMode="numeric"
                onInput={(e: React.FormEvent<HTMLInputElement>) => {
                  const input = e.currentTarget;
                  input.value = input.value.replace(/[^0-9]/g, "").slice(0, 10);
                }}
                required
              />
            </div>
            <div className="col-md-4 mb-2">
              <FormLabel label="Pin Code" htmlFor="pinCode" />
              <input
                id="pinCode"
                name="pinCode"
                className="form-control"
                value={formData.pinCode ?? ""}
                onChange={handleChange}
                pattern="^\d{6}$"
                maxLength={6}
                title="Pin code must be 6 digits"
                inputMode="numeric"
                onInput={(e: React.FormEvent<HTMLInputElement>) => {
                  const input = e.currentTarget;
                  input.value = input.value.replace(/[^0-9]/g, "").slice(0, 6);
                }}
                required
              />
            </div>

            {/* === Address Info === */}
            <div className="col-md-4 mb-2">
              <FormLabel label="Address Line 1" htmlFor="addressLine1" />
              <input
                id="addressLine1"
                name="addressLine1"
                className="form-control"
                value={formData.addressLine1 ?? ""}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-4 mb-2">
              <FormLabel
                label="Street / Mohalla / Apartment"
                htmlFor="street"
              />
              <input
                id="street"
                name="street"
                className="form-control"
                value={formData.street ?? ""}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-4 mb-2">
              <FormLabel label="City / District" htmlFor="city" />
              <input
                id="city"
                name="city"
                className="form-control"
                value={formData.city ?? ""}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-4 mb-2">
              <FormLabel label="Country" htmlFor="country" />
              <input
                id="country"
                name="country"
                className="form-control"
                value={formData.country ?? ""}
                onChange={handleChange}
              />
            </div>

            {/* === Other Info === */}
            <div className="col-md-4 mb-2">
              <FormLabel label="Gender" htmlFor="gender" />
              <select
                id="gender"
                name="gender"
                className="form-select"
                value={formData.gender ?? ""}
                onChange={handleChange}
              >
                <option value="">-- Select Gender --</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="col-md-4 mb-2">
              <DateInput
                id="dob"
                label="Date of Birth"
                value={formData.dob ?? ""}
                onChange={(newDate) =>
                  setFormData((prev) => ({ ...prev, dob: newDate }))
                }
              />
            </div>
            <div className="col-md-8 mb-2">
              <FormLabel label="Remarks" htmlFor="remarks" />
              <input
                id="remarks"
                name="remarks"
                className="form-control"
                value={formData.remarks ?? ""}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-4 mb-2">
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

            {/* === Profile Picture & Buttons === */}
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

            <div className="col-md-6 mb-2 d-flex align-items-end">
              <div className="d-flex flex-wrap w-100 gap-2">
                <button
                  type="submit"
                  className="btn btn-success flex-fill"
                  disabled={isSubmitting}
                >
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

            {/* === Preview Image === */}
            <div className="col-md-4 mb-2">
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
