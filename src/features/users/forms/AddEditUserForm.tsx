import React, { useEffect, useState, useRef, useMemo } from "react";
import { fetchUserRoles } from "../../../api/userRoleApi";
import type { UserDTO } from "../../../types/UserDTO";
import type { UserRole } from "../../../types/UserRole";
import Swal from "sweetalert2";
import DateInput from "../../../components/common/DateInput";
import { useNavigate } from "react-router-dom";
import { useFormNavigationGuard } from "../../../hooks/useFormNavigationGuard";
import {
  checkUsernameAvailability,
  suggestUsernames,
} from "../../../api/userProfileService";
import {
  createEntity,
  fetchEntityById,
  updateEntity,
} from "../../../api/genericCrudApi";
import {
  fetchCountries,
  fetchDistrictsByStateId,
  fetchStatesByCountryId,
} from "../../../api/locationApi";
import type { CountryDTO } from "../../../types/CountryDTO";
import type { StateDTO } from "../../../types/StateDTO";
import type { DistrictDTO } from "../../../types/DistrictDTO";
import LoaderOverlay from "../../../components/common/LoaderOverlay";
import TextInputField from "../../../components/common/TextInputField";
import SelectField from "../../../components/common/SelectField";
import FileUploadField from "../../../components/common/FileUploadField";

interface CreateUserFormProps {
  userId?: number;
  onUnsavedChange?: (unsaved: boolean) => void;
}

const endpoints = {
  base: "/user",
  add: "/user/Add-New-User",
  update: "/user/Update-User",
  getById: "/user/Get-User-By-Id",
};

const CreateUserForm: React.FC<CreateUserFormProps> = ({
  userId,
  onUnsavedChange,
}) => {
  const [formData, setFormData] = useState<UserDTO>({
    userName: "",
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    addressLine1: "",
    street: "",
    city: "",
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
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(true);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasSuggestionSelected = useRef(false);
  const [countries, setCountries] = useState<CountryDTO[]>([]);
  const [states, setStates] = useState<StateDTO[]>([]);
  const [districts, setDistricts] = useState<DistrictDTO[]>([]);

  useEffect(() => {
    if (!userId) {
      initialFormRef.current = { ...formData };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    fetchUserRoles()
      .then((roles) => setRoles(roles))
      .catch((err) => console.error("❌ Failed to load roles", err));
  }, []);

  useEffect(() => {
    if (userId) {
      fetchEntityById<UserDTO>(endpoints.getById, userId)
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
            countryId: user.countryId,
            stateId: user.stateId,
            districtId: user.districtId,
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

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value ? parseInt(value, 10) : undefined,
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
    if (userId && initialFormRef.current) {
      // 🔄 In Edit Mode: Reset only optional fields, keep required fields intact
      setFormData((prev) => ({
        ...prev,
        // 🛑 Required fields restored from initialRef
        firstName: initialFormRef.current!.firstName,
        lastName: initialFormRef.current!.lastName,
        email: initialFormRef.current!.email,
        mobile: initialFormRef.current!.mobile,
        userName: initialFormRef.current!.userName,
        pinCode: initialFormRef.current!.pinCode,
        roleId: initialFormRef.current!.roleId,
        countryId: initialFormRef.current!.countryId,
        stateId: initialFormRef.current!.stateId,
        districtId: initialFormRef.current!.districtId,

        // ✅ Optional fields cleared
        remarks: "",
        addressLine1: "",
        street: "",
        city: "",
        gender: "",
        dob: "",
        profilePicture: "",
      }));

      setSelectedFile(null);
      setPreviewUrl("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      // 🆕 In Create Mode: Reset everything except username
      const empty: UserDTO = {
        userName: formData.userName,
        firstName: "",
        lastName: "",
        email: "",
        mobile: "",
        addressLine1: "",
        street: "",
        city: "",
        countryId: undefined,
        stateId: undefined,
        districtId: undefined,
        gender: "",
        dob: "",
        remarks: "",
        pinCode: "",
        roleId: undefined,
        profilePicture: "",
      };

      setFormData(empty);
      setSelectedFile(null);
      setPreviewUrl("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const buildFormData = (): FormData => {
    const form = new FormData();
    form.append("User.UserName", formData.userName);
    form.append("User.FirstName", formData.firstName);
    form.append("User.LastName", formData.lastName);
    if (formData.email) form.append("User.Email", formData.email);
    if (formData.mobile) form.append("User.Mobile", formData.mobile);
    if (formData.addressLine1)
      form.append("User.AddressLine1", formData.addressLine1);
    if (formData.street) form.append("User.Street", formData.street);
    if (formData.city) form.append("User.City", formData.city);
    if (formData.countryId !== undefined)
      form.append("User.CountryId", formData.countryId.toString());
    if (formData.stateId !== undefined)
      form.append("User.StateId", formData.stateId.toString());
    if (formData.districtId !== undefined)
      form.append("User.DistrictId", formData.districtId.toString());
    if (formData.gender) form.append("User.Gender", formData.gender);
    if (formData.dob) form.append("User.DOB", formData.dob);
    if (formData.remarks) form.append("User.Remarks", formData.remarks);
    if (formData.pinCode) form.append("User.PinCode", formData.pinCode);
    if (formData.roleId !== undefined)
      form.append("User.RoleId", formData.roleId.toString());
    form.append("User.IsActive", "true");

    if (selectedFile) {
      form.append("ProfilePicture", selectedFile); // ✅ actual file
      form.append("User.ProfilePicture", ""); // ✅ wipe the string version
    } else if (formData.profilePicture) {
      form.append("User.ProfilePicture", formData.profilePicture); // ✅ explicitly map to User.ProfilePicture
    }

    return form;
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement> | { preventDefault: () => void }
  ) => {
    e.preventDefault();

    const createdBy = parseInt(localStorage.getItem("userId") ?? "0"); // ✅ Use only for CreatedBy/ModifiedBy
    setIsSubmitting(true);

    try {
      const form = buildFormData();

      if (!userId) {
        // ✅ Creation Mode
        const isAvailable = await checkUsernameAvailability(formData.userName);
        if (!isAvailable) {
          await Swal.fire({
            icon: "warning",
            title: "Username already taken",
            text: "Please choose a different username from the suggestions.",
            confirmButtonColor: "#f27474",
          });
          setIsSubmitting(false);
          return;
        }

        await createEntity(endpoints.add, form, createdBy, true);
        await Swal.fire({
          icon: "success",
          title: "Success",
          text: "User created successfully!",
          confirmButtonColor: "#28a745",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        // ✅ Edit Mode
        const modifiedBy = Number(localStorage.getItem("userId") ?? "0");
        await updateEntity(endpoints.update, userId, form, modifiedBy, true);
        await Swal.fire({
          icon: "success",
          title: "Success",
          text: "User updated successfully!",
          confirmButtonColor: "#28a745",
          timer: 1500,
          showConfirmButton: true,
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
    if (userId) return; // 👈 don't auto-generate in edit mode

    if (wasSuggestionSelected.current) {
      wasSuggestionSelected.current = false;
      return; // ✅ do NOT overwrite selected username
    }

    const fn = formData.firstName.trim();
    const ln = formData.lastName.trim();

    if (!fn || !ln) {
      // Clear the username field if one of the names is missing
      setFormData((prev) => ({ ...prev, userName: "" }));
      setIsUsernameAvailable(true);
      return;
    }

    const baseUsername = `${fn[0]}${ln}`;
    setFormData((prev) => ({ ...prev, userName: baseUsername }));

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    setIsCheckingUsername(true); // ⏳ show spinner immediately

    debounceTimer.current = setTimeout(() => {
      checkUsernameAvailability(baseUsername)
        .then((available) => {
          setIsUsernameAvailable(available);
          if (!available) {
            suggestUsernames(fn, ln).then(setUsernameSuggestions);
          } else {
            setUsernameSuggestions([]);
          }
        })
        .catch(() => setUsernameSuggestions([]))
        .finally(() => setIsCheckingUsername(false));
    }, 800); // ⏱️ wait 800ms before checking

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [formData.firstName, formData.lastName, userId]);

  useEffect(() => {
    fetchCountries()
      .then(setCountries)
      .catch((err) => console.error("❌ Failed to fetch countries", err));
  }, []);

  useEffect(() => {
    if (formData.countryId) {
      fetchStatesByCountryId(formData.countryId).then(setStates);
    } else {
      setStates([]);
    }

    if (!userId) {
      setFormData((prev) => ({
        ...prev,
        stateId: undefined,
        districtId: undefined,
      }));
      setDistricts([]);
    }
  }, [formData.countryId, userId]);

  useEffect(() => {
    if (formData.stateId) {
      fetchDistrictsByStateId(formData.stateId).then(setDistricts);
    } else {
      setDistricts([]);
    }

    if (!userId) {
      setFormData((prev) => ({ ...prev, districtId: undefined }));
    }
  }, [formData.stateId, userId]);

  return (
    <>
      <div className="p-4 position-relative">
        {isSubmitting && (
          <LoaderOverlay
            text="Saving user..."
            spinnerClass="spinner-border text-primary"
          />
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
            <div className="col-md-4">
              <TextInputField
                id="userName"
                label="UserName"
                name="userName"
                className={`form-control pe-5 ${
                  !isCheckingUsername && !isUsernameAvailable
                    ? "is-invalid text-danger"
                    : !isCheckingUsername &&
                      isUsernameAvailable &&
                      formData.userName !== ""
                    ? "is-valid text-success"
                    : ""
                }`}
                value={formData.userName}
                onChange={handleChange}
                disabled
                title="Username is auto-generated and cannot be modified"
                required
              />
              {isCheckingUsername && (
                <span
                  className="position-absolute"
                  style={{
                    top: "50%",
                    right: "12px",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: "#6c757d",
                  }}
                >
                  <i
                    className="fa fa-spinner fa-spin"
                    style={{ color: "#0d6efd" }}
                  ></i>
                </span>
              )}
            </div>
            <div className="col-md-4">
              <TextInputField
                name="firstName"
                label="First Name"
                value={formData.firstName}
                onChange={handleChange}
                disabled={!!userId}
                required
              />
            </div>
            <div className="col-md-4">
              <TextInputField
                name="lastName"
                label="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                disabled={!!userId}
                required
              />
            </div>
            {/* ✅ Suggestions on a new row (full-width, below username row) */}
            {!isCheckingUsername && usernameSuggestions.length > 0 && (
              <div className="row">
                <div className="col-12 py-2">
                  <span className="fw-bold me-2" style={{ color: "#212529" }}>
                    Suggestions:
                  </span>
                  {usernameSuggestions.map((s, i) => (
                    <span
                      key={i}
                      className="badge me-2"
                      style={{
                        backgroundColor: "#05f56d",
                        color: "#003c21",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        wasSuggestionSelected.current = true; // 🛑 Prevent auto-override
                        setFormData((prev) => ({ ...prev, userName: s }));
                        setIsUsernameAvailable(true); // ✅ Apply green tick mark styling
                        setUsernameSuggestions([]); // ✅ Hide suggestions
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* === Contact Info === */}
            <div className="col-md-4">
              <TextInputField
                name="email"
                label="Email"
                type="email"
                value={formData.email ?? ""}
                onChange={handleChange}
                required
                onInvalid={(e) =>
                  e.currentTarget.setCustomValidity(
                    "Please enter valid Email Address"
                  )
                }
                onInput={(e) => e.currentTarget.setCustomValidity("")}
              />
            </div>

            <div className="col-md-4">
              <TextInputField
                name="mobile"
                label="Mobile"
                value={formData.mobile ?? ""}
                onChange={handleChange}
                pattern="^\d{10}$"
                maxLength={10}
                title="Mobile number must be 10 digits"
                inputMode="numeric"
                required
                onInput={(e: React.FormEvent<HTMLInputElement>) => {
                  const input = e.currentTarget;
                  input.value = input.value.replace(/[^0-9]/g, "").slice(0, 10);
                }}
              />
            </div>

            <div className="col-md-4">
              <TextInputField
                name="pinCode"
                label="Pin Code"
                value={formData.pinCode ?? ""}
                onChange={handleChange}
                pattern="^\d{6}$"
                maxLength={6}
                title="Pin code must be 6 digits"
                inputMode="numeric"
                required
                onInput={(e: React.FormEvent<HTMLInputElement>) => {
                  const input = e.currentTarget;
                  input.value = input.value.replace(/[^0-9]/g, "").slice(0, 6);
                }}
              />
            </div>

            {/* === Address Info === */}
            <div className="col-md-4">
              <TextInputField
                name="addressLine1"
                label="Address Line 1"
                value={formData.addressLine1 ?? ""}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-4">
              <TextInputField
                name="street"
                label="Street / Mohalla / Apartment"
                value={formData.street ?? ""}
                onChange={handleChange}
              />
            </div>

            {/* === Country === */}
            <div className="col-md-4">
              <SelectField
                label="Country"
                name="countryId"
                value={formData.countryId ?? ""}
                onChange={handleSelectChange}
                required
                options={(countries ?? []).map((country) => ({
                  label: country.countryName,
                  value: country.countryId,
                }))}
              />
            </div>

            {/* === State === */}
            <div className="col-md-4">
              <SelectField
                label="State"
                name="stateId"
                value={formData.stateId ?? ""}
                onChange={handleSelectChange}
                required
                disabled={!formData.countryId}
                options={states.map((state) => ({
                  label: `${state.stateName} (${state.stateCode})`,
                  value: state.stateId,
                }))}
              />
            </div>

            {/* === District === */}
            <div className="col-md-4">
              <SelectField
                label="District"
                name="districtId"
                value={formData.districtId ?? ""}
                onChange={handleSelectChange}
                required
                disabled={districts.length === 0}
                options={districts.map((district) => ({
                  label: district.districtName,
                  value: district.districtId,
                }))}
              />
            </div>

            {/* === City === */}
            <div className="col-md-4">
              <TextInputField
                name="city"
                label="City / District"
                value={formData.city ?? ""}
                onChange={handleChange}
              />
            </div>
            {/* === Other Info === */}
            <div className="col-md-4">
              <SelectField
                label="Gender"
                name="gender"
                value={formData.gender ?? ""}
                onChange={handleChange}
                options={[
                  { label: "Male", value: "Male" },
                  { label: "Female", value: "Female" },
                ]}
              />
            </div>

            <div className="col-md-4">
              <DateInput
                id="dob"
                label="Date of Birth"
                value={formData.dob ?? ""}
                onChange={(newDate) =>
                  setFormData((prev) => ({ ...prev, dob: newDate }))
                }
              />
            </div>

            <div className="col-md-4">
              <TextInputField
                name="remarks"
                label="Remarks"
                value={formData.remarks ?? ""}
                onChange={handleChange}
              />
            </div>

            {/* === Profile Picture & Buttons === */}
            <div className="col-md-4">
              <FileUploadField
                name="profilePictureFile"
                label="Profile Picture"
                fileInputRef={fileInputRef}
                onChange={handleFileChange}
              />
            </div>

            <div className="col-md-4">
              <SelectField
                label="User Role"
                name="roleId"
                value={
                  formData.roleId !== undefined ? String(formData.roleId) : ""
                }
                onChange={handleChange}
                required
                options={roles
                  .filter((role) => role.userRoleId !== undefined)
                  .map((role) => ({
                    label: role.roleName,
                    value: String(role.userRoleId),
                  }))}
              />
            </div>

            <div className="col-md-4 mb-2 d-flex align-items-end">
              <div className="d-flex flex-wrap w-100 gap-2">
                <button
                  type="submit"
                  className="btn btn-outline-success flex-fill"
                  disabled={isSubmitting}
                >
                  <i className="fa fa-save me-2"></i>
                  {userId ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger flex-fill"
                  onClick={resetForm}
                >
                  <i className="fa fa-undo me-2"></i>Reset Form
                </button>
                {!userId && (
                  <button
                    type="button"
                    className="btn btn-outline-primary flex-fill"
                    onClick={handleSaveAndNext}
                  >
                    <i className="fa fa-plus me-2"></i>Save & Next
                  </button>
                )}
              </div>
            </div>

            {/* === Preview Image === */}
            <div className="col-md-4">
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
