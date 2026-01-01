import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  createEntity,
  updateEntity,
  fetchEntityById,
} from "../../../../api/genericCrudApi";
import TextInputField from "../../../../components/common/TextInputField";
import SharedAddEditForm from "../../../shared/SharedAddEditForm";
import type { AddEditFormHandle } from "../../../shared/SharedAddEditForm";
import type { RenterDTO } from "../../../../types/RenterDTO";
import { showAddUpdateResult } from "../../../../utils/alerts/showAddUpdateConfirmation";
import { useCurrentMenu } from "../../../../hooks/useCurrentMenu";
import {
  fetchCountries,
  fetchStatesByCountryId,
  fetchDistrictsByStateId,
} from "../../../../api/locationApi";
import type { CountryDTO } from "../../../../types/CountryDTO";
import type { StateDTO } from "../../../../types/StateDTO";
import type { DistrictDTO } from "../../../../types/DistrictDTO";
import SelectField from "../../../../components/common/SelectField";

interface Props {
  renterId?: number;
  onUnsavedChange?: (changed: boolean) => void;
}

const endpoints = {
  getById: "/RenterProfile/Get-Renter-By-Id",
  add: "/RenterProfile/Create-New-Renter",
  update: "/RenterProfile/Update-Renter-By-Id",
};

// UI-only helper: strip non-digits (prevents typing characters)
const digitsOnly = (value: string) => value.replace(/\D/g, "");

type SectionCardProps = { title: string; children: React.ReactNode };
const SectionCard = ({ title, children }: SectionCardProps) => (
  <div className="border rounded-3 p-3">
    <div className="fw-bold mb-3">{title}</div>
    {children}
  </div>
);

const renterBooleanKeys = ["isPoliceVerified", "isActive"] as const;
type RenterBooleanKey = (typeof renterBooleanKeys)[number];
const isRenterBooleanKey = (name: string): name is RenterBooleanKey =>
  (renterBooleanKeys as readonly string[]).includes(name);

type SwitchTileProps = {
  name: RenterBooleanKey;
  label: string;
  checked: boolean;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
};

const SwitchTile = ({ name, label, checked, onChange }: SwitchTileProps) => {
  const id = `renter-switch-${name}`;
  return (
    <div className="border rounded-3 px-3 py-2 d-flex align-items-center justify-content-between h-100">
      <label className="mb-0 fw-semibold" htmlFor={id}>
        {label}
      </label>
      <div className="form-check form-switch m-0">
        <input
          id={id}
          className="form-check-input"
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
        />
      </div>
    </div>
  );
};

const emptyRenter: RenterDTO = {
  renterId: 0,
  firstName: "",
  lastName: "",
  gender: "",
  mobile: "",
  alternateMobile: "",
  emailId: "",
  address: "",
  city: "",
  pinCode: "",
  livingSince: "",
  leaseEndDate: "",
  agreementCopyUrl: "",
  profilePhotoUrl: "",
  aadharNumber: "",
  isPoliceVerified: false,
  emergencyContactName: "",
  emergencyContactNumber: "",
  isActive: true,
  notes: "",
  countryId: undefined,
  stateId: undefined,
  districtId: undefined,
};

const AddEditRenter = forwardRef<AddEditFormHandle, Props>(
  ({ renterId, onUnsavedChange }, ref) => {
    const [formData, setFormData] = useState<RenterDTO>(emptyRenter);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMode, setSubmitMode] = useState<"save" | "saveAndNext">("save");

    const { parentListPath } = useCurrentMenu();
    const navigate = useNavigate();

    const formRef = useRef<HTMLFormElement>(null);
    const initialRef = useRef<RenterDTO | null>(null);

    const [countries, setCountries] = useState<CountryDTO[]>([]);
    const [states, setStates] = useState<StateDTO[]>([]);
    const [districts, setDistricts] = useState<DistrictDTO[]>([]);

    useEffect(() => {
      if (renterId) {
        fetchEntityById<RenterDTO>(endpoints.getById, renterId).then((data) => {
          setFormData(data);
          initialRef.current = { ...data };
        });
      } else {
        setFormData(emptyRenter);
        initialRef.current = { ...emptyRenter };
      }
    }, [renterId]);

    const hasUnsavedChanges = useMemo(() => {
      if (!initialRef.current) return false;
      return Object.keys(formData).some(
        (key) =>
          formData[key as keyof RenterDTO] !==
          initialRef.current?.[key as keyof RenterDTO]
      );
    }, [formData]);

    useEffect(() => {
      onUnsavedChange?.(hasUnsavedChanges);
    }, [hasUnsavedChanges, onUnsavedChange]);

    const handleReset = useCallback(() => {
      setFormData(initialRef.current ?? emptyRenter);
    }, []);

    const requestSubmit = (mode: "save" | "saveAndNext") => {
      setSubmitMode(mode);
      formRef.current?.requestSubmit();
    };

    const setTextField = (name: string, value: string) => {
      switch (name) {
        case "firstName":
          setFormData((p) => ({ ...p, firstName: value }));
          return;
        case "lastName":
          setFormData((p) => ({ ...p, lastName: value }));
          return;
        case "mobile":
          setFormData((p) => ({ ...p, mobile: digitsOnly(value).slice(0, 15) }));
          return;
        case "alternateMobile":
          setFormData((p) => ({
            ...p,
            alternateMobile: digitsOnly(value).slice(0, 15),
          }));
          return;
        case "emailId":
          setFormData((p) => ({ ...p, emailId: value }));
          return;
        case "address":
          setFormData((p) => ({ ...p, address: value }));
          return;
        case "city":
          setFormData((p) => ({ ...p, city: value }));
          return;
        case "pinCode":
          setFormData((p) => ({ ...p, pinCode: digitsOnly(value).slice(0, 6) }));
          return;
        case "aadharNumber":
          setFormData((p) => ({
            ...p,
            aadharNumber: digitsOnly(value).slice(0, 12),
          }));
          return;
        case "emergencyContactName":
          setFormData((p) => ({ ...p, emergencyContactName: value }));
          return;
        case "emergencyContactNumber":
          setFormData((p) => ({
            ...p,
            emergencyContactNumber: digitsOnly(value).slice(0, 15),
          }));
          return;
        case "notes":
          setFormData((p) => ({ ...p, notes: value }));
          return;
        default:
          // Unknown field name: intentionally ignore to keep the form stable
          return;
      }
    };

    const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
      setTextField(e.target.name, e.target.value);
    };

    const handleSelectChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
      const { name, value } = e.target;

      if (name === "gender") {
        setFormData((p) => ({ ...p, gender: value }));
        return;
      }

      if (name === "countryId") {
        const parsed = value === "" ? undefined : Number(value);
        setFormData((p) => ({ ...p, countryId: parsed }));
        return;
      }

      if (name === "stateId") {
        const parsed = value === "" ? undefined : Number(value);
        setFormData((p) => ({ ...p, stateId: parsed }));
        return;
      }

      if (name === "districtId") {
        const parsed = value === "" ? undefined : Number(value);
        setFormData((p) => ({ ...p, districtId: parsed }));
      }
    };

    const handleBooleanToggle: React.ChangeEventHandler<HTMLInputElement> = (e) => {
      const { name, checked } = e.target;
      if (!isRenterBooleanKey(name)) return;

      setFormData((p) => ({
        ...p,
        [name]: checked,
      }));
    };

    const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
      if (e) e.preventDefault();

      if (formRef.current && !formRef.current.checkValidity()) {
        formRef.current.reportValidity();
        return;
      }

      setIsSubmitting(true);
      try {
        const userId = parseInt(localStorage.getItem("userId") ?? "0", 10);

        if (renterId) {
          await updateEntity(endpoints.update, renterId, formData, userId, false);
          await showAddUpdateResult(true, "update", "renter");
        } else {
          await createEntity(endpoints.add, formData, userId, false);
          await showAddUpdateResult(true, "add", "renter");
        }

        if (submitMode === "saveAndNext") handleReset();
        else navigate(parentListPath);
      } catch (err) {
        console.error(err);
        await showAddUpdateResult(false, "error", "renter");
      } finally {
        setIsSubmitting(false);
      }
    };

    useImperativeHandle(ref, () => ({
      submit: () => requestSubmit("save"),
      reset: () => handleReset(),
      saveAndNext: () => requestSubmit("saveAndNext"),
    }));

    useEffect(() => {
      fetchCountries()
        .then(setCountries)
        .catch((err) => console.error("❌ Failed to fetch countries", err));
    }, []);

    useEffect(() => {
      if (formData.countryId) {
        fetchStatesByCountryId(formData.countryId).then((fetchedStates) => {
          setStates(fetchedStates);

          // Only clear dependent fields when adding (keeps edit stable)
          if (!renterId) {
            setFormData((p) => ({
              ...p,
              stateId: undefined,
              districtId: undefined,
            }));
            setDistricts([]);
          }
        });
      } else {
        setStates([]);
        setDistricts([]);
      }
    }, [formData.countryId, renterId]);

    useEffect(() => {
      if (formData.stateId) {
        fetchDistrictsByStateId(formData.stateId).then((fetchedDistricts) => {
          setDistricts(fetchedDistricts);

          if (!renterId) {
            setFormData((p) => ({ ...p, districtId: undefined }));
          }
        });
      } else {
        setDistricts([]);
      }
    }, [formData.stateId, renterId]);

    return (
      <SharedAddEditForm
        isSubmitting={isSubmitting}
        hasUnsavedChanges={hasUnsavedChanges}
        onSubmit={handleSubmit}
        onReset={handleReset}
        onSaveAndNext={() => requestSubmit("saveAndNext")}
        isEditMode={!!renterId}
        formRef={formRef}
      >
        <div className="row g-4">
          {/* Status - full width, nicer than stacked checkboxes */}
          <div className="col-12">
            <SectionCard title="Status">
              <div className="row g-2">
                <div className="col-md-6">
                  <SwitchTile
                    name="isPoliceVerified"
                    label="Police Verified"
                    checked={Boolean(formData.isPoliceVerified)}
                    onChange={handleBooleanToggle}
                  />
                </div>
                <div className="col-md-6">
                  <SwitchTile
                    name="isActive"
                    label="Active"
                    checked={Boolean(formData.isActive)}
                    onChange={handleBooleanToggle}
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="col-12">
            <SectionCard title="Basic Information">
              <div className="row g-3">
                <div className="col-md-4">
                  <TextInputField
                    label="First Name"
                    name="firstName"
                    value={formData.firstName ?? ""}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <TextInputField
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName ?? ""}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <SelectField
                    label="Gender"
                    name="gender"
                    value={formData.gender ?? ""}
                    onChange={handleSelectChange}
                    options={[
                      { label: "Male", value: "Male" },
                      { label: "Female", value: "Female" },
                    ]}
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="col-12">
            <SectionCard title="Contact">
              <div className="row g-3">
                <div className="col-md-4">
                  <TextInputField
                    label="Mobile"
                    name="mobile"
                    value={formData.mobile ?? ""}
                    onChange={handleInputChange}
                    inputMode="numeric"
                    maxLength={15}
                  />
                </div>

                <div className="col-md-4">
                  <TextInputField
                    label="Alternate Mobile"
                    name="alternateMobile"
                    value={formData.alternateMobile ?? ""}
                    onChange={handleInputChange}
                    inputMode="numeric"
                    maxLength={15}
                  />
                </div>

                <div className="col-md-4">
                  <TextInputField
                    label="Email"
                    name="emailId"
                    type="email"
                    value={formData.emailId ?? ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="col-12">
            <SectionCard title="Address">
              <div className="row g-3">
                <div className="col-12">
                  <TextInputField
                    label="Address"
                    name="address"
                    value={formData.address ?? ""}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-md-6">
                  <TextInputField
                    label="City"
                    name="city"
                    value={formData.city ?? ""}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-md-6">
                  <TextInputField
                    label="PIN Code"
                    name="pinCode"
                    value={formData.pinCode ?? ""}
                    onChange={handleInputChange}
                    inputMode="numeric"
                    maxLength={6}
                  />
                </div>

                <div className="col-md-4">
                  <SelectField
                    label="Country"
                    name="countryId"
                    value={formData.countryId ?? ""}
                    onChange={handleSelectChange}
                    options={countries.map((c) => ({
                      label: c.countryName,
                      value: c.countryId,
                    }))}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <SelectField
                    label="State"
                    name="stateId"
                    value={formData.stateId ?? ""}
                    onChange={handleSelectChange}
                    options={states.map((s) => ({
                      label: `${s.stateName} (${s.stateCode})`,
                      value: s.stateId,
                    }))}
                    disabled={!formData.countryId}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <SelectField
                    label="District"
                    name="districtId"
                    value={formData.districtId ?? ""}
                    onChange={handleSelectChange}
                    options={districts.map((d) => ({
                      label: d.districtName,
                      value: d.districtId,
                    }))}
                    disabled={!formData.stateId}
                    required
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="col-12">
            <SectionCard title="Identification & Emergency">
              <div className="row g-3">
                <div className="col-md-4">
                  <TextInputField
                    label="Aadhar Number"
                    name="aadharNumber"
                    value={formData.aadharNumber ?? ""}
                    onChange={handleInputChange}
                    inputMode="numeric"
                    maxLength={12}
                  />
                </div>

                <div className="col-md-4">
                  <TextInputField
                    label="Emergency Contact Name"
                    name="emergencyContactName"
                    value={formData.emergencyContactName ?? ""}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-md-4">
                  <TextInputField
                    label="Emergency Contact Number"
                    name="emergencyContactNumber"
                    value={formData.emergencyContactNumber ?? ""}
                    onChange={handleInputChange}
                    inputMode="numeric"
                    maxLength={15}
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="col-12">
            <SectionCard title="Notes">
              <div className="row g-3">
                <div className="col-12">
                  <TextInputField
                    label="Notes"
                    name="notes"
                    value={formData.notes ?? ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </SharedAddEditForm>
    );
  }
);

export default AddEditRenter;