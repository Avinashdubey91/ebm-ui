import React, {
  useMemo,
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  createEntity,
  fetchEntityById,
  updateEntity,
} from "../../../../api/genericCrudApi";
import { useLocationDropdowns } from "../../../../hooks/useLocationDropdowns";
import type { SocietyDTO } from "../../../../types/SocietyDTO";

import TextInputField from "../../../../components/common/TextInputField";
import SelectField from "../../../../components/common/SelectField";
import SharedAddEditForm from "../../../shared/SharedAddEditForm";
import type { AddEditFormHandle } from "../../../shared/SharedAddEditForm";
import { showAddUpdateResult } from "../../../../utils/alerts/showAddUpdateConfirmation";
import { useCurrentMenu } from "../../../../hooks/useCurrentMenu";

export interface AddEditSocietyRef {
  submit: () => void;
  reset: () => void;
  saveAndNext: () => void;
}

interface Props {
  societyId?: number;
  onUnsavedChange?: (changed: boolean) => void;
}

const endpoints = {
  getById: "/society/Get-Society-By-Id",
  add: "/society/Add-New-Society",
  update: "/society/Update-Existing-Society",
};

const emptySociety: SocietyDTO = {
  societyId: 0,
  societyName: "",
  address: "",
  city: "",
  pinCode: "",
  countryId: undefined,
  stateId: undefined,
  districtId: undefined,
  contactNumber: "",
  email: "",
  contactPerson: "",
  registrationNumber: "",
  societyType: "",
  secretaryName: "",
  secretaryPhone: "",
  treasurerName: "",
  treasurerPhone: "",
  hasClubhouse: false,
  hasSwimmingPool: false,
  logoUrl: "",
};

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-3 p-3">
      <div className="fw-bold mb-3">{title}</div>
      {children}
    </div>
  );
}

function SwitchTile({
  name,
  label,
  checked,
  onChange,
  disabled,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}) {
  const id = `switch-${name}`;
  return (
    <div
      className="w-100 border rounded-3 px-3 d-flex align-items-center justify-content-between"
      style={{ minHeight: 58 }}
    >
      <label htmlFor={id} className="mb-0 fw-semibold">
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
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function keepDigitsOnly(value: string, maxLen: number) {
  return value.replace(/\D/g, "").slice(0, maxLen);
}

const AddEditSociety = forwardRef<AddEditFormHandle, Props>(
  ({ societyId, onUnsavedChange }, ref) => {
    const navigate = useNavigate();
    const { parentListPath } = useCurrentMenu();

    const [formData, setFormData] = useState<SocietyDTO>(emptySociety);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMode, setSubmitMode] = useState<"save" | "saveAndNext">(
      "save"
    );

    const formRef = useRef<HTMLFormElement>(null);
    const initialRef = useRef<SocietyDTO | null>(null);

    const numericSelectNames = useMemo(
      () => new Set<string>(["countryId", "stateId", "districtId"]),
      []
    );

    const { countries, states, districts } = useLocationDropdowns(
      formData.countryId,
      formData.stateId
    );

    const hasUnsavedChanges = useMemo(() => {
      if (!initialRef.current) return false;

      const trim = (val: string | undefined | null) => (val ?? "").trim();
      const keys = Object.keys(formData) as (keyof SocietyDTO)[];

      return keys.some((key) => {
        const currentVal = formData[key];
        const initialVal = initialRef.current![key];

        if (typeof currentVal === "string" && typeof initialVal === "string") {
          return trim(currentVal) !== trim(initialVal);
        }
        return currentVal !== initialVal;
      });
    }, [formData]);

    useEffect(() => {
      onUnsavedChange?.(hasUnsavedChanges);
    }, [hasUnsavedChanges, onUnsavedChange]);

    useEffect(() => {
      if (societyId) {
        fetchEntityById<SocietyDTO>(endpoints.getById, societyId).then(
          (data) => {
            setFormData(data);
            initialRef.current = { ...data };
          }
        );
      } else {
        setFormData(emptySociety);
        initialRef.current = { ...emptySociety };
      }
    }, [societyId]);

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      const el = e.currentTarget;
      const name = el.name;

      // checkbox (switch)
      if (el instanceof HTMLInputElement && el.type === "checkbox") {
        const checked = el.checked;
        setFormData((prev) => ({ ...prev, [name]: checked }));
        return;
      }

      // select numeric ids
      if (numericSelectNames.has(name)) {
        const raw = el.value;
        const parsed = raw === "" ? undefined : Number(raw);

        setFormData((prev) => {
          const next: SocietyDTO = { ...prev, [name]: parsed } as SocietyDTO;

          // cascading resets
          if (name === "countryId") {
            next.stateId = undefined;
            next.districtId = undefined;
          }
          if (name === "stateId") {
            next.districtId = undefined;
          }

          return next;
        });

        return;
      }

      // normal string input/select
      setFormData((prev) => ({ ...prev, [name]: el.value }));
    };

    const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
      if (e) e.preventDefault();

      if (formRef.current && !formRef.current.checkValidity()) {
        formRef.current.reportValidity();
        return;
      }

      setIsSubmitting(true);
      try {
        const userId = parseInt(localStorage.getItem("userId") || "0", 10);

        if (societyId) {
          await updateEntity(
            endpoints.update,
            societyId,
            formData,
            userId,
            false
          );
          await showAddUpdateResult(true, "update", "society");
        } else {
          await createEntity(endpoints.add, formData, userId, false);
          await showAddUpdateResult(true, "add", "society");
        }

        if (submitMode === "saveAndNext" && !societyId) {
          handleReset();
        } else {
          navigate(parentListPath);
        }
      } catch (err) {
        console.error(err);
        await showAddUpdateResult(false, "error", "society");
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleReset = () => {
      setFormData(initialRef.current ?? emptySociety);
    };

    useImperativeHandle(ref, () => ({
      submit: () => {
        setSubmitMode("save");
        formRef.current?.requestSubmit();
      },
      reset: handleReset,
      saveAndNext: () => {
        setSubmitMode("saveAndNext");
        formRef.current?.requestSubmit();
      },
    }));

    return (
      <SharedAddEditForm
        isSubmitting={isSubmitting}
        hasUnsavedChanges={hasUnsavedChanges}
        onSubmit={handleSubmit}
        onReset={handleReset}
        onSaveAndNext={() => {
          setSubmitMode("saveAndNext");
          formRef.current?.requestSubmit();
        }}
        isEditMode={!!societyId}
        formRef={formRef}
      >
        <div className="row g-4">
          {/* Left (main) */}
          <div className="col-lg-8">
            <div className="d-flex flex-column gap-4">
              <SectionCard title="Society Details">
                <div className="row g-3">
                  <div className="col-md-8">
                    <TextInputField
                      label="Society Name"
                      name="societyName"
                      value={formData.societyName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <TextInputField
                      label="Society Type"
                      name="societyType"
                      value={formData.societyType ?? ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-4">
                    <TextInputField
                      label="Registration Number"
                      name="registrationNumber"
                      value={formData.registrationNumber ?? ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-8">
                    <TextInputField
                      label="Address"
                      name="address"
                      value={formData.address ?? ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Location">
                <div className="row g-3">
                  <div className="col-md-4">
                    <TextInputField
                      label="City"
                      name="city"
                      value={formData.city ?? ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-4">
                    <TextInputField
                      name="pinCode"
                      label="PIN Code"
                      value={formData.pinCode ?? ""}
                      onChange={handleChange}
                      pattern="^\d{6}$"
                      maxLength={6}
                      title="Pin code must be 6 digits"
                      inputMode="numeric"
                      required
                      onInput={(e: React.FormEvent<HTMLInputElement>) => {
                        e.currentTarget.value = keepDigitsOnly(
                          e.currentTarget.value,
                          6
                        );
                      }}
                    />
                  </div>

                  <div className="col-md-4">
                    <SelectField
                      label="Country"
                      name="countryId"
                      value={formData.countryId ?? ""}
                      onChange={handleChange}
                      required
                      options={countries.map((c) => ({
                        label: c.countryName,
                        value: c.countryId,
                      }))}
                    />
                  </div>

                  <div className="col-md-6">
                    <SelectField
                      label="State"
                      name="stateId"
                      value={formData.stateId ?? ""}
                      onChange={handleChange}
                      required
                      disabled={!formData.countryId}
                      options={states.map((s) => ({
                        label: `${s.stateName} (${s.stateCode})`,
                        value: s.stateId,
                      }))}
                    />
                  </div>

                  <div className="col-md-6">
                    <SelectField
                      label="District"
                      name="districtId"
                      value={formData.districtId ?? ""}
                      onChange={handleChange}
                      required
                      disabled={!formData.stateId || districts.length === 0}
                      options={districts.map((d) => ({
                        label: d.districtName,
                        value: d.districtId,
                      }))}
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Contact">
                <div className="row g-3">
                  <div className="col-md-4">
                    <TextInputField
                      name="contactNumber"
                      label="Mobile"
                      value={formData.contactNumber ?? ""}
                      onChange={handleChange}
                      pattern="^\d{10}$"
                      maxLength={10}
                      title="Mobile number must be 10 digits"
                      inputMode="numeric"
                      required
                      onInput={(e: React.FormEvent<HTMLInputElement>) => {
                        e.currentTarget.value = keepDigitsOnly(
                          e.currentTarget.value,
                          10
                        );
                      }}
                    />
                  </div>

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
                      label="Contact Person"
                      name="contactPerson"
                      value={formData.contactPerson ?? ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>

          {/* Right (side) */}
          <div className="col-lg-4">
            <div className="d-flex flex-column gap-4">
              <SectionCard title="Office Bearers">
                <div className="row g-3">
                  <div className="col-12">
                    <TextInputField
                      label="Secretary Name"
                      name="secretaryName"
                      value={formData.secretaryName ?? ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12">
                    <TextInputField
                      name="secretaryPhone"
                      label="Secretary Mobile"
                      value={formData.secretaryPhone ?? ""}
                      onChange={handleChange}
                      pattern="^\d{10}$"
                      maxLength={10}
                      title="Mobile number must be 10 digits"
                      inputMode="numeric"
                      onInput={(e: React.FormEvent<HTMLInputElement>) => {
                        e.currentTarget.value = keepDigitsOnly(
                          e.currentTarget.value,
                          10
                        );
                      }}
                    />
                  </div>

                  <div className="col-12">
                    <TextInputField
                      label="Treasurer Name"
                      name="treasurerName"
                      value={formData.treasurerName ?? ""}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12">
                    <TextInputField
                      name="treasurerPhone"
                      label="Treasurer Mobile"
                      value={formData.treasurerPhone ?? ""}
                      onChange={handleChange}
                      pattern="^\d{10}$"
                      maxLength={10}
                      title="Mobile number must be 10 digits"
                      inputMode="numeric"
                      onInput={(e: React.FormEvent<HTMLInputElement>) => {
                        e.currentTarget.value = keepDigitsOnly(
                          e.currentTarget.value,
                          10
                        );
                      }}
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Amenities & Branding">
                <div className="d-flex flex-column gap-3">
                  <SwitchTile
                    name="hasClubhouse"
                    label="Has Clubhouse"
                    checked={!!formData.hasClubhouse}
                    onChange={handleChange}
                  />

                  <SwitchTile
                    name="hasSwimmingPool"
                    label="Has Swimming Pool"
                    checked={!!formData.hasSwimmingPool}
                    onChange={handleChange}
                  />

                  <TextInputField
                    label="Logo URL"
                    name="logoUrl"
                    value={formData.logoUrl ?? ""}
                    onChange={handleChange}
                  />
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      </SharedAddEditForm>
    );
  }
);

export default AddEditSociety;
