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
import type { OwnerDTO } from "../../../../types/OwnerDTO";
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
import {
  buildAadhaarProps,
  formatAadhaarForDisplay,
  buildNumericInputProps,
  buildEmailProps,
  onBlurNormalizeEmail,
} from "../../../../utils/formFieldGuards";

interface Props {
  ownerId?: number;
  onUnsavedChange?: (changed: boolean) => void;
}

const endpoints = {
  getById: "/OwnerProfile/Get-Owner-By-Id",
  add: "/OwnerProfile/Add-New-Owner",
  update: "/OwnerProfile/Update-Owner-By-Id",
};

const emptyOwner: OwnerDTO = {
  ownerId: 0,
  firstName: "",
  lastName: "",
  gender: "",
  mobile: "",
  alternateMobile: "",
  emailId: "",
  address: "",
  city: "",
  pinCode: "",
  occupation: "",
  aadharNumber: "",
  ownershipType: "",
  profilePhotoUrl: "",
  idProofUrl: "",
  emergencyContactName: "",
  emergencyContactNumber: "",
  isDeceased: false,
  isActive: true,
  isFirstOwner: true,
  notes: "",
  countryId: undefined,
  stateId: undefined,
  districtId: undefined,
};

type SectionCardProps = {
  title: string;
  children: React.ReactNode;
};

const SectionCard = ({ title, children }: SectionCardProps) => (
  <div className="border rounded-3 p-3">
    <div className="fw-bold mb-3">{title}</div>
    {children}
  </div>
);

const ownerBooleanKeys = ["isFirstOwner", "isDeceased", "isActive"] as const;
type OwnerBooleanKey = (typeof ownerBooleanKeys)[number];

const isOwnerBooleanKey = (name: string): name is OwnerBooleanKey =>
  (ownerBooleanKeys as readonly string[]).includes(name);

type SwitchFieldProps = {
  name: OwnerBooleanKey;
  label: string;
  checked: boolean;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
};

const SwitchField = ({ name, label, checked, onChange }: SwitchFieldProps) => {
  const id = `owner-switch-${name}`;
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

const AddEditOwner = forwardRef<AddEditFormHandle, Props>(
  ({ ownerId, onUnsavedChange }, ref) => {
    const [formData, setFormData] = useState<OwnerDTO>(emptyOwner);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMode, setSubmitMode] = useState<"save" | "saveAndNext">(
      "save"
    );

    const { parentListPath } = useCurrentMenu();
    const [aadhaarFocused, setAadhaarFocused] = useState(false);
    const navigate = useNavigate();
    const formRef = useRef<HTMLFormElement>(null);
    const initialRef = useRef<OwnerDTO | null>(null);

    const [countries, setCountries] = useState<CountryDTO[]>([]);
    const [states, setStates] = useState<StateDTO[]>([]);
    const [districts, setDistricts] = useState<DistrictDTO[]>([]);

    useEffect(() => {
      if (ownerId) {
        fetchEntityById<OwnerDTO>(endpoints.getById, ownerId).then((data) => {
          setFormData(data);
          initialRef.current = { ...data };
        });
      } else {
        setFormData(emptyOwner);
        initialRef.current = { ...emptyOwner };
      }
    }, [ownerId]);

    const hasUnsavedChanges = useMemo(() => {
      if (!initialRef.current) return false;
      return Object.keys(formData).some(
        (key) =>
          formData[key as keyof OwnerDTO] !==
          initialRef.current?.[key as keyof OwnerDTO]
      );
    }, [formData]);

    useEffect(() => {
      onUnsavedChange?.(hasUnsavedChanges);
    }, [hasUnsavedChanges, onUnsavedChange]);

    const handleReset = useCallback(() => {
      setFormData(initialRef.current ?? emptyOwner);
    }, []);

    const requestSubmit = (mode: "save" | "saveAndNext") => {
      setSubmitMode(mode);
      formRef.current?.requestSubmit();
    };

    const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = (
      e
    ) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange: React.ChangeEventHandler<HTMLSelectElement> = (
      e
    ) => {
      const { name, value } = e.target;

      const numericSelects = new Set(["countryId", "stateId", "districtId"]);
      if (numericSelects.has(name)) {
        const parsed = value === "" ? undefined : Number(value);
        setFormData((prev) => ({ ...prev, [name]: parsed }));
        return;
      }

      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleBooleanToggle: React.ChangeEventHandler<HTMLInputElement> = (
      e
    ) => {
      const { name, checked } = e.target;
      if (!isOwnerBooleanKey(name)) return;
      setFormData((prev) => ({ ...prev, [name]: checked }));
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

        if (ownerId) {
          await updateEntity(
            endpoints.update,
            ownerId,
            formData,
            userId,
            false
          );
          await showAddUpdateResult(true, "update", "owner");
        } else {
          await createEntity(endpoints.add, formData, userId, false);
          await showAddUpdateResult(true, "add", "owner");
        }

        if (submitMode === "saveAndNext") handleReset();
        else navigate(parentListPath);
      } catch (err) {
        console.error(err);
        await showAddUpdateResult(false, "error", "owner");
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
      fetchCountries().then(setCountries).catch(console.error);
    }, []);

    useEffect(() => {
      if (formData.countryId) {
        fetchStatesByCountryId(formData.countryId).then((fetchedStates) => {
          setStates(fetchedStates);

          if (!ownerId) {
            setFormData((prev) => ({
              ...prev,
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
    }, [formData.countryId, ownerId]);

    useEffect(() => {
      if (formData.stateId) {
        fetchDistrictsByStateId(formData.stateId).then((fetchedDistricts) => {
          setDistricts(fetchedDistricts);

          if (!ownerId) {
            setFormData((prev) => ({
              ...prev,
              districtId: undefined,
            }));
          }
        });
      } else {
        setDistricts([]);
      }
    }, [formData.stateId, ownerId]);

    const statusTiles: Array<{ name: OwnerBooleanKey; label: string }> = [
      { name: "isFirstOwner", label: "First Owner" },
      { name: "isDeceased", label: "Deceased" },
      { name: "isActive", label: "Active" },
    ];

    return (
      <SharedAddEditForm
        isSubmitting={isSubmitting}
        hasUnsavedChanges={hasUnsavedChanges}
        onSubmit={handleSubmit}
        onReset={handleReset}
        onSaveAndNext={() => requestSubmit("saveAndNext")}
        isEditMode={!!ownerId}
        formRef={formRef}
      >
        <div className="row g-4">
          {/* Full-width sections first (cleaner + avoids cramped layout) */}
          <div className="col-12">
            <SectionCard title="Basic Information">
              <div className="row g-3">
                <div className="col-md-4">
                  <TextInputField
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <TextInputField
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
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
                    {...buildNumericInputProps({
                      maxDigits: 10,
                      pattern: "^\\d{10}$",
                      title: "Mobile number must be exactly 10 digits",
                      required: true,
                    })}
                  />
                </div>

                <div className="col-md-4">
                  <TextInputField
                    label="Alternate Mobile"
                    name="alternateMobile"
                    value={formData.alternateMobile ?? ""}
                    onChange={handleInputChange}
                    {...buildNumericInputProps({
                      maxDigits: 10,
                      pattern: "^\\d{10}$",
                      title: "Alternate mobile must be exactly 10 digits",
                    })}
                  />
                </div>

                <div className="col-md-4">
                  <TextInputField
                    label="Email ID"
                    name="emailId"
                    value={formData.emailId ?? ""}
                    onChange={handleInputChange}
                    {...buildEmailProps()}
                    onBlur={onBlurNormalizeEmail((val) =>
                      setFormData((p) => ({ ...p, emailId: val }))
                    )}
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
                    {...buildNumericInputProps({
                      maxDigits: 6,
                      pattern: "^\\d{6}$",
                      title: "PIN code must be exactly 6 digits",
                    })}
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
            <SectionCard title="Identification & Ownership">
              <div className="row g-3">
                <div className="col-md-4">
                  <TextInputField
                    label="Aadhar Number"
                    name="aadharNumber"
                    value={formatAadhaarForDisplay(
                      formData.aadharNumber ?? "",
                      aadhaarFocused
                    )}
                    onChange={handleInputChange}
                    {...buildAadhaarProps()}
                    onFocus={(e) => {
                      setAadhaarFocused(true);
                      e.currentTarget.value = e.currentTarget.value.replace(
                        /-/g,
                        ""
                      );
                    }}
                    onBlur={() => setAadhaarFocused(false)}
                  />
                </div>

                <div className="col-md-4">
                  <TextInputField
                    label="Occupation"
                    name="occupation"
                    value={formData.occupation ?? ""}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-md-4">
                  <TextInputField
                    label="Ownership Type"
                    name="ownershipType"
                    value={formData.ownershipType ?? ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="col-12">
            <SectionCard title="Emergency Contact">
              <div className="row g-3">
                <div className="col-md-6">
                  <TextInputField
                    label="Emergency Contact Name"
                    name="emergencyContactName"
                    value={formData.emergencyContactName ?? ""}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-md-6">
                  <TextInputField
                    label="Emergency Contact Number"
                    name="emergencyContactNumber"
                    value={formData.emergencyContactNumber ?? ""}
                    onChange={handleInputChange}
                    {...buildNumericInputProps({
                      maxDigits: 10,
                      pattern: "^\\d{10}$",
                      title: "Contact number must be exactly 10 digits",
                      required: true,
                    })}
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="col-12">
            <SectionCard title="Status">
              <div className="row g-2">
                {statusTiles.map(({ name, label }) => (
                  <div key={name} className="col-md-4">
                    <SwitchField
                      name={name}
                      label={label}
                      checked={Boolean(formData[name])}
                      onChange={handleBooleanToggle}
                    />
                  </div>
                ))}
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

export default AddEditOwner;
