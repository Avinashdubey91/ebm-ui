import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useCallback,
  memo,
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
  formatAadhaarForDisplay,
  buildNumericInputProps,
  buildEmailProps,
  onBlurNormalizeEmail,
} from "../../../../utils/formFieldGuards";
import { UseAuth } from "../../../../context/UseAuth";

interface Props {
  ownerId?: number;
  onUnsavedChange?: (changed: boolean) => void;
}

const endpoints = {
  getById: "/OwnerProfile/Get-Owner-By-Id",
  add: "/OwnerProfile/Add-New-Owner",
  update: "/OwnerProfile/Update-Owner-By-Id",
} as const;

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

const numericSelectNames = new Set<keyof OwnerDTO>([
  "countryId",
  "stateId",
  "districtId",
]);

const ownerBooleanKeys = ["isFirstOwner", "isDeceased", "isActive"] as const;
type OwnerBooleanKey = (typeof ownerBooleanKeys)[number];

const genderOptions: Array<{ label: string; value: string | number }> = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
];

const statusTiles: Array<{ name: OwnerBooleanKey; label: string }> = [
  { name: "isFirstOwner", label: "First Owner" },
  { name: "isDeceased", label: "Deceased" },
  { name: "isActive", label: "Active" },
];

type SectionCardProps = {
  title: string;
  children: React.ReactNode;
};

const SectionCard = memo(function SectionCard({
  title,
  children,
}: SectionCardProps) {
  return (
    <div className="border rounded-3 p-3">
      <div className="fw-bold mb-3">{title}</div>
      {children}
    </div>
  );
});

type SwitchFieldProps = {
  name: OwnerBooleanKey;
  label: string;
  checked: boolean;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
};

const SwitchField = memo(function SwitchField({
  name,
  label,
  checked,
  onChange,
}: SwitchFieldProps) {
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
});

const isOwnerBooleanKey = (name: string): name is OwnerBooleanKey =>
  (ownerBooleanKeys as readonly string[]).includes(name);

const scrollToFirstInvalidField = (form: HTMLFormElement) => {
  const firstInvalid = form.querySelector(":invalid") as
    | HTMLInputElement
    | HTMLSelectElement
    | HTMLTextAreaElement
    | null;

  if (!firstInvalid) return;

  firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
  firstInvalid.focus();
};

const trimToNull = (value?: string | null): string | null => {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

const normalizeDigitField = (
  value?: string | null,
  { optional = false }: { optional?: boolean } = {},
): string | null => {
  const trimmed = value?.trim() ?? "";
  if (trimmed === "") return optional ? null : "";
  return trimmed.replace(/\D/g, "");
};

const AddEditOwner = forwardRef<AddEditFormHandle, Props>(
  ({ ownerId, onUnsavedChange }, ref) => {
    const navigate = useNavigate();
    const { parentListPath } = useCurrentMenu();
    const { userId } = UseAuth();

    const [formData, setFormData] = useState<OwnerDTO>(emptyOwner);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMode, setSubmitMode] = useState<"save" | "saveAndNext">(
      "save",
    );
    const [aadhaarFocused, setAadhaarFocused] = useState(false);

    const [countries, setCountries] = useState<CountryDTO[]>([]);
    const [states, setStates] = useState<StateDTO[]>([]);
    const [districts, setDistricts] = useState<DistrictDTO[]>([]);

    const formRef = useRef<HTMLFormElement>(null);
    const initialRef = useRef<OwnerDTO>(emptyOwner);

    const setFieldValue = useCallback(
      (key: keyof OwnerDTO, value: OwnerDTO[keyof OwnerDTO]) => {
        setFormData((prev) => {
          if (prev[key] === value) return prev;
          return { ...prev, [key]: value };
        });
      },
      [],
    );

    const initializeNewOwner = useCallback(() => {
      setFormData(emptyOwner);
      initialRef.current = { ...emptyOwner };
      setStates([]);
      setDistricts([]);
    }, []);

    useEffect(() => {
      let isActive = true;

      const run = async () => {
        try {
          if (ownerId) {
            const data = await fetchEntityById<OwnerDTO>(
              endpoints.getById,
              ownerId,
            );
            if (!isActive) return;
            setFormData(data);
            initialRef.current = { ...data };
            return;
          }

          if (!isActive) return;
          initializeNewOwner();
        } catch (error) {
          console.error("Failed to load owner data", error);
        }
      };

      void run();

      return () => {
        isActive = false;
      };
    }, [ownerId, initializeNewOwner]);

    const hasUnsavedChanges = useMemo(() => {
      const initial = initialRef.current;
      return (Object.keys(formData) as Array<keyof OwnerDTO>).some(
        (key) => formData[key] !== initial[key],
      );
    }, [formData]);

    const aadhaarDigits = useMemo(
      () => (formData.aadharNumber ?? "").replace(/\D/g, ""),
      [formData.aadharNumber],
    );

    const isAadhaarInvalid =
      aadhaarDigits.length > 0 && aadhaarDigits.length !== 12;

    useEffect(() => {
      onUnsavedChange?.(hasUnsavedChanges);
    }, [hasUnsavedChanges, onUnsavedChange]);

    const handleReset = useCallback(() => {
      setFormData({ ...initialRef.current });
    }, []);

    const requestSubmit = useCallback((mode: "save" | "saveAndNext") => {
      setSubmitMode(mode);
      formRef.current?.requestSubmit();
    }, []);

    const handleInputChange = useCallback<
      React.ChangeEventHandler<HTMLInputElement>
    >(
      (e) => {
        const { name, value } = e.target;

        if (
          name === "mobile" ||
          name === "alternateMobile" ||
          name === "emergencyContactNumber"
        ) {
          setFieldValue(name as keyof OwnerDTO, value.replace(/\D/g, ""));
          return;
        }

        if (name === "aadharNumber") {
          setFieldValue("aadharNumber", value.replace(/\D/g, "").slice(0, 12));
          return;
        }

        setFieldValue(name as keyof OwnerDTO, value);
      },
      [setFieldValue],
    );

    const handleSelectChange = useCallback<
      React.ChangeEventHandler<HTMLSelectElement>
    >(
      (e) => {
        const { name, value } = e.target;
        const key = name as keyof OwnerDTO;

        if (numericSelectNames.has(key)) {
          const parsed = value === "" ? undefined : Number(value);

          if (key === "countryId") {
            setFormData((prev) => ({
              ...prev,
              countryId: parsed,
              stateId: undefined,
              districtId: undefined,
            }));
            setStates([]);
            setDistricts([]);
            return;
          }

          if (key === "stateId") {
            setFormData((prev) => ({
              ...prev,
              stateId: parsed,
              districtId: undefined,
            }));
            setDistricts([]);
            return;
          }

          setFieldValue(key, parsed);
          return;
        }

        setFieldValue(key, value);
      },
      [setFieldValue],
    );

    const handleBooleanToggle = useCallback<
      React.ChangeEventHandler<HTMLInputElement>
    >(
      (e) => {
        const { name, checked } = e.target;
        if (!isOwnerBooleanKey(name)) return;
        setFieldValue(name, checked);
      },
      [setFieldValue],
    );

    const handleEmailBlur = useMemo(
      () =>
        onBlurNormalizeEmail((val) => {
          setFieldValue("emailId", val);
        }),
      [setFieldValue],
    );

    const handleAadhaarFocus = useCallback<
      React.FocusEventHandler<HTMLInputElement>
    >(
      (e) => {
        setAadhaarFocused(true);
        const rawDigits = (formData.aadharNumber ?? "").replace(/\D/g, "");
        e.currentTarget.value = rawDigits;
      },
      [formData.aadharNumber],
    );

    const handleAadhaarBlur = useCallback<
      React.FocusEventHandler<HTMLInputElement>
    >(
      (e) => {
        const rawDigits = e.currentTarget.value.replace(/\D/g, "").slice(0, 12);
        setFieldValue("aadharNumber", rawDigits);
        setAadhaarFocused(false);
      },
      [setFieldValue],
    );

    const countryOptions = useMemo(
      () =>
        countries.map((c) => ({
          label: c.countryName,
          value: c.countryId,
        })),
      [countries],
    );

    const stateOptions = useMemo(
      () =>
        states.map((s) => ({
          label: `${s.stateName} (${s.stateCode})`,
          value: s.stateId,
        })),
      [states],
    );

    const districtOptions = useMemo(
      () =>
        districts.map((d) => ({
          label: d.districtName,
          value: d.districtId,
        })),
      [districts],
    );

    useEffect(() => {
      let isActive = true;

      const run = async () => {
        try {
          const result = await fetchCountries();
          if (!isActive) return;
          setCountries(result);
        } catch (error) {
          console.error("Failed to load countries", error);
        }
      };

      void run();

      return () => {
        isActive = false;
      };
    }, []);

    useEffect(() => {
      let isActive = true;

      const run = async () => {
        if (!formData.countryId) {
          setStates([]);
          setDistricts([]);
          return;
        }

        try {
          const fetchedStates = await fetchStatesByCountryId(
            formData.countryId,
          );
          if (!isActive) return;
          setStates(fetchedStates);
        } catch (error) {
          if (!isActive) return;
          setStates([]);
          console.error("Failed to load states", error);
        }
      };

      void run();

      return () => {
        isActive = false;
      };
    }, [formData.countryId]);

    useEffect(() => {
      let isActive = true;

      const run = async () => {
        if (!formData.stateId) {
          setDistricts([]);
          return;
        }

        try {
          const fetchedDistricts = await fetchDistrictsByStateId(
            formData.stateId,
          );
          if (!isActive) return;
          setDistricts(fetchedDistricts);
        } catch (error) {
          if (!isActive) return;
          setDistricts([]);
          console.error("Failed to load districts", error);
        }
      };

      void run();

      return () => {
        isActive = false;
      };
    }, [formData.stateId]);

    const handleSubmit = useCallback(
      async (e?: React.FormEvent<HTMLFormElement>) => {
        if (e) e.preventDefault();

        const form = formRef.current;
        const aadhaarInput = form?.elements.namedItem(
          "aadharNumber",
        ) as HTMLInputElement | null;

        if (aadhaarInput) {
          aadhaarInput.setCustomValidity("");
        }

        if (aadhaarDigits.length > 0 && aadhaarDigits.length !== 12) {
          if (aadhaarInput) {
            aadhaarInput.setCustomValidity(
              "Aadhar number must be exactly 12 digits",
            );
            aadhaarInput.reportValidity();
            scrollToFirstInvalidField(form!);
          }
          return;
        }

        if (form && !form.checkValidity()) {
          form.reportValidity();
          scrollToFirstInvalidField(form);
          return;
        }

        setIsSubmitting(true);

        try {
          const currentUserId = Number(userId);

          if (!userId || Number.isNaN(currentUserId) || currentUserId <= 0) {
            throw new Error("Authenticated user id is missing.");
          }

          const payload: OwnerDTO = {
            ...formData,
            ownerId: ownerId ?? formData.ownerId,
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            gender: trimToNull(formData.gender) ?? "",
            mobile: normalizeDigitField(formData.mobile) ?? "",
            alternateMobile:
              normalizeDigitField(formData.alternateMobile, {
                optional: true,
              }) ?? "",
            emailId: trimToNull(formData.emailId) ?? "",
            address: trimToNull(formData.address) ?? "",
            city: trimToNull(formData.city) ?? "",
            pinCode:
              normalizeDigitField(formData.pinCode, {
                optional: true,
              }) ?? "",
            occupation: trimToNull(formData.occupation) ?? "",
            aadharNumber:
              normalizeDigitField(formData.aadharNumber, {
                optional: true,
              }) ?? "",
            ownershipType: trimToNull(formData.ownershipType) ?? "",
            profilePhotoUrl: trimToNull(formData.profilePhotoUrl) ?? "",
            idProofUrl: trimToNull(formData.idProofUrl) ?? "",
            emergencyContactName:
              trimToNull(formData.emergencyContactName) ?? "",
            emergencyContactNumber:
              normalizeDigitField(formData.emergencyContactNumber, {
                optional: false,
              }) ?? "",
            notes: trimToNull(formData.notes) ?? "",
          };

          if (!payload.alternateMobile) {
            payload.alternateMobile =
              null as unknown as OwnerDTO["alternateMobile"];
          }

          if (!payload.emailId) {
            payload.emailId = null as unknown as OwnerDTO["emailId"];
          }

          if (!payload.address) {
            payload.address = null as unknown as OwnerDTO["address"];
          }

          if (!payload.city) {
            payload.city = null as unknown as OwnerDTO["city"];
          }

          if (!payload.pinCode) {
            payload.pinCode = null as unknown as OwnerDTO["pinCode"];
          }

          if (!payload.occupation) {
            payload.occupation = null as unknown as OwnerDTO["occupation"];
          }

          if (!payload.aadharNumber) {
            payload.aadharNumber = null as unknown as OwnerDTO["aadharNumber"];
          }

          if (!payload.ownershipType) {
            payload.ownershipType =
              null as unknown as OwnerDTO["ownershipType"];
          }

          if (!payload.profilePhotoUrl) {
            payload.profilePhotoUrl =
              null as unknown as OwnerDTO["profilePhotoUrl"];
          }

          if (!payload.idProofUrl) {
            payload.idProofUrl = null as unknown as OwnerDTO["idProofUrl"];
          }

          if (!payload.emergencyContactName) {
            payload.emergencyContactName =
              null as unknown as OwnerDTO["emergencyContactName"];
          }

          if (!payload.notes) {
            payload.notes = null as unknown as OwnerDTO["notes"];
          }

          if (ownerId) {
            await updateEntity(
              endpoints.update,
              ownerId,
              payload,
              currentUserId
            );
            await showAddUpdateResult(true, "update", "owner");
          } else {
            await createEntity(endpoints.add, payload, currentUserId);
            await showAddUpdateResult(true, "add", "owner");
          }

          if (submitMode === "saveAndNext") {
            handleReset();
          } else {
            navigate(parentListPath);
          }
        } catch (err) {
          console.error(err);
          await showAddUpdateResult(false, "error", "owner");
        } finally {
          setIsSubmitting(false);
        }
      },
      [
        aadhaarDigits,
        formData,
        handleReset,
        navigate,
        ownerId,
        parentListPath,
        userId,
        submitMode,
      ],
    );

    useImperativeHandle(
      ref,
      () => ({
        submit: () => requestSubmit("save"),
        reset: () => handleReset(),
        saveAndNext: () => requestSubmit("saveAndNext"),
      }),
      [handleReset, requestSubmit],
    );

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
                    options={genderOptions}
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
                      pattern: "^$|^\\d{10}$",
                      title: "Alternate mobile must be exactly 10 digits",
                      required: false,
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
                    onBlur={handleEmailBlur}
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
                    options={countryOptions}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <SelectField
                    label="State"
                    name="stateId"
                    value={formData.stateId ?? ""}
                    onChange={handleSelectChange}
                    options={stateOptions}
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
                    options={districtOptions}
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
                      aadhaarFocused,
                    )}
                    onChange={handleInputChange}
                    pattern={
                      aadhaarFocused
                        ? "^$|^\\d{12}$"
                        : "^$|^\\d{4}-\\d{4}-\\d{4}$"
                    }
                    title="Aadhar number must be exactly 12 digits"
                    className={`form-control${isAadhaarInvalid ? " is-invalid" : ""}`}
                    inputMode="numeric"
                    maxLength={aadhaarFocused ? 12 : 14}
                    onFocus={handleAadhaarFocus}
                    onBlur={handleAadhaarBlur}
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
  },
);

AddEditOwner.displayName = "AddEditOwner";

export default AddEditOwner;
