/*  features/property/apartment/forms/AddEditApartment.tsx  */

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
  fetchAllEntities,
} from "../../../../api/genericCrudApi";

import type { ApartmentDTO } from "../../../../types/ApartmentDTO";
import type { SocietyDTO } from "../../../../types/SocietyDTO";

import TextInputField from "../../../../components/common/TextInputField";
import SelectField from "../../../../components/common/SelectField";
import SharedAddEditForm from "../../../shared/SharedAddEditForm";
import type { AddEditFormHandle } from "../../../shared/SharedAddEditForm";
import { showAddUpdateResult } from "../../../../utils/alerts/showAddUpdateConfirmation";
import { useCurrentMenu } from "../../../../hooks/useCurrentMenu";

export interface AddEditApartmentRef {
  submit: () => void;
  reset: () => void;
  saveAndNext: () => void;
}

interface Props {
  apartmentId?: number;
  onUnsavedChange?: (changed: boolean) => void;
}

/* ---------- API endpoints ----------- */
const endpoints = {
  getById: "/apartment/Get-Apartment-By-Id",
  add: "/apartment/Add-New-Apartment",
  update: "/apartment/Update-Existing-Apartment",

  getAllSocieties: "/society/Get-All-Societies",
};

/* ---------- empty model ----------- */
const emptyApartment: ApartmentDTO = {
  apartmentId: 0,
  societyId: 0,
  apartmentName: "",
  blockName: "",
  constructionYear: undefined,
  buildingType: "",
  totalFloors: undefined,
  totalFlats: undefined,
  hasLift: false,
  hasGenerator: false,
  gateFacing: "",
  caretakerName: "",
  caretakerPhone: "",
  maintenanceLead: "",
  emergencyContact: "",
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

  // Match your input/select control height
  const controlMinHeight = 38;

  return (
    <div className="d-flex flex-column w-100">
      <label htmlFor={id} className="form-label fw-semibold mb-2">
        {label}
      </label>

      <div
        className="border rounded-3 px-3 d-flex align-items-center justify-content-between w-100"
        style={{ minHeight: controlMinHeight }}
      >
        <span className="text-muted">{checked ? "Yes" : "No"}</span>

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
    </div>
  );
}

function keepDigitsOnly(value: string, maxLen?: number) {
  const digits = value.replace(/\D/g, "");
  return typeof maxLen === "number" ? digits.slice(0, maxLen) : digits;
}

const AddEditApartment = forwardRef<AddEditFormHandle, Props>(
  ({ apartmentId, onUnsavedChange }, ref) => {
    const [formData, setFormData] = useState<ApartmentDTO>(emptyApartment);
    const [societies, setSocieties] = useState<SocietyDTO[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMode, setSubmitMode] = useState<"save" | "saveAndNext">(
      "save"
    );

    const navigate = useNavigate();
    const { parentListPath } = useCurrentMenu();

    const formRef = useRef<HTMLFormElement>(null);
    const initialRef = useRef<ApartmentDTO | null>(null);

    const numericOptionalFields = useMemo(
      () => new Set<string>(["constructionYear", "totalFloors", "totalFlats"]),
      []
    );

    /* ---------- fetch societies for dropdown ---------- */
    useEffect(() => {
      fetchAllEntities<SocietyDTO>(endpoints.getAllSocieties)
        .then(setSocieties)
        .catch((err) => console.error("Failed to fetch societies:", err));
    }, []);

    /* ---------- fetch single apartment (edit mode) ---------- */
    useEffect(() => {
      if (apartmentId) {
        fetchEntityById<ApartmentDTO>(endpoints.getById, apartmentId).then(
          (data) => {
            setFormData(data);
            initialRef.current = { ...data };
          }
        );
      } else {
        setFormData(emptyApartment);
        initialRef.current = { ...emptyApartment };
      }
    }, [apartmentId]);

    /* ---------- unsaved-changes detection ---------- */
    const hasUnsavedChanges = useMemo(() => {
      if (!initialRef.current) return false;

      const keys = Object.keys(formData) as (keyof ApartmentDTO)[];
      return keys.some((k) => formData[k] !== initialRef.current![k]);
    }, [formData]);

    useEffect(() => {
      onUnsavedChange?.(hasUnsavedChanges);
    }, [hasUnsavedChanges, onUnsavedChange]);

    const applyFormState = (next: ApartmentDTO) => {
      setFormData(next);
      initialRef.current = { ...next };
    };

    /* ---------- field change handler ---------- */
    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      const el = e.currentTarget;
      const name = el.name;

      if (el instanceof HTMLInputElement && el.type === "checkbox") {
        setFormData((p) => ({ ...p, [name]: el.checked }));
        return;
      }

      const raw = el.value;

      if (name === "societyId") {
        setFormData((p) => ({ ...p, societyId: raw === "" ? 0 : Number(raw) }));
        return;
      }

      if (numericOptionalFields.has(name)) {
        setFormData((p) => ({
          ...p,
          [name]: raw === "" ? undefined : Number(raw),
        }));
        return;
      }

      setFormData((p) => ({ ...p, [name]: raw }));
    };

    const handleReset = () =>
      applyFormState(initialRef.current ?? emptyApartment);

    const requestSubmit = (mode: "save" | "saveAndNext") => {
      setSubmitMode(mode);
      formRef.current?.requestSubmit();
    };

    /* ---------- submit (single validated flow) ---------- */
    const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
      if (e) e.preventDefault();

      if (formRef.current && !formRef.current.checkValidity()) {
        formRef.current.reportValidity();
        return;
      }

      setIsSubmitting(true);
      try {
        const userId = parseInt(localStorage.getItem("userId") || "0", 10);

        if (apartmentId) {
          await updateEntity(
            endpoints.update,
            apartmentId,
            formData,
            userId,
            false
          );
          await showAddUpdateResult(true, "update", "apartment");
          navigate(parentListPath);
          return;
        }

        await createEntity(endpoints.add, formData, userId, false);
        await showAddUpdateResult(true, "add", "apartment");

        if (submitMode === "saveAndNext") {
          // For faster bulk entry keep Society selected, clear rest
          applyFormState({ ...emptyApartment, societyId: formData.societyId });
        } else {
          navigate(parentListPath);
        }
      } catch (err) {
        console.error(err);
        await showAddUpdateResult(false, "error", "apartment");
      } finally {
        setIsSubmitting(false);
      }
    };

    useImperativeHandle(ref, () => ({
      submit: () => requestSubmit("save"),
      reset: handleReset,
      saveAndNext: () => requestSubmit("saveAndNext"),
    }));

    const societyOptions = societies
      .filter(
        (s): s is SocietyDTO & { societyId: number } =>
          typeof s.societyId === "number"
      )
      .map((s) => ({
        label: s.societyName,
        value: s.societyId,
      }));

    return (
      <SharedAddEditForm
        isSubmitting={isSubmitting}
        hasUnsavedChanges={hasUnsavedChanges}
        onSubmit={handleSubmit}
        onReset={handleReset}
        onSaveAndNext={() => requestSubmit("saveAndNext")}
        isEditMode={!!apartmentId}
        formRef={formRef}
      >
        <div className="row g-4">
          {/* Full width sections */}
          <div className="col-12">
            <SectionCard title="Property Selection">
              <div className="row g-3">
                <div className="col-md-6 col-lg-4">
                  <SelectField
                    label="Society"
                    name="societyId"
                    value={formData.societyId ? formData.societyId : ""}
                    onChange={handleChange}
                    required
                    options={societyOptions}
                  />
                </div>

                <div className="col-md-6 col-lg-4">
                  <TextInputField
                    label="Apartment Name"
                    name="apartmentName"
                    value={formData.apartmentName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-md-6 col-lg-4">
                  <TextInputField
                    label="Block"
                    name="blockName"
                    value={formData.blockName ?? ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="col-12">
            <SectionCard title="Building Details">
              <div className="row g-3">
                <div className="col-md-4">
                  <TextInputField
                    label="Construction Year"
                    name="constructionYear"
                    value={formData.constructionYear?.toString() ?? ""}
                    onChange={handleChange}
                    inputMode="numeric"
                    maxLength={4}
                    pattern="^[0-9]{4}$"
                    title="Year must be 4 digits"
                    onInput={(e: React.FormEvent<HTMLInputElement>) => {
                      e.currentTarget.value = keepDigitsOnly(
                        e.currentTarget.value,
                        4
                      );
                    }}
                  />
                </div>

                <div className="col-md-4">
                  <TextInputField
                    label="Building Type"
                    name="buildingType"
                    value={formData.buildingType ?? ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-4">
                  <TextInputField
                    label="Gate Facing"
                    name="gateFacing"
                    value={formData.gateFacing ?? ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-3">
                  <TextInputField
                    label="Total Floors"
                    name="totalFloors"
                    value={formData.totalFloors ?? ""}
                    onChange={handleChange}
                    inputMode="numeric"
                    onInput={(e: React.FormEvent<HTMLInputElement>) => {
                      e.currentTarget.value = keepDigitsOnly(
                        e.currentTarget.value
                      );
                    }}
                  />
                </div>

                <div className="col-md-3">
                  <TextInputField
                    label="Total Flats"
                    name="totalFlats"
                    value={formData.totalFlats ?? ""}
                    onChange={handleChange}
                    inputMode="numeric"
                    onInput={(e: React.FormEvent<HTMLInputElement>) => {
                      e.currentTarget.value = keepDigitsOnly(
                        e.currentTarget.value
                      );
                    }}
                  />
                </div>

                <div className="col-md-3">
                  <SwitchTile
                    name="hasLift"
                    label="Lift Available"
                    checked={!!formData.hasLift}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-3">
                  <SwitchTile
                    name="hasGenerator"
                    label="Generator Available"
                    checked={!!formData.hasGenerator}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="col-12">
            <SectionCard title="Caretaker & Contacts">
              <div className="row g-3">
                <div className="col-md-4">
                  <TextInputField
                    label="Caretaker Name"
                    name="caretakerName"
                    value={formData.caretakerName ?? ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-4">
                  <TextInputField
                    label="Caretaker Phone"
                    name="caretakerPhone"
                    value={formData.caretakerPhone ?? ""}
                    onChange={handleChange}
                    maxLength={10}
                    inputMode="numeric"
                    pattern="^[0-9]{10}$"
                    title="Mobile number must be exactly 10 digits"
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
                    label="Emergency Contact"
                    name="emergencyContact"
                    value={formData.emergencyContact ?? ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <TextInputField
                    label="Maintenance Lead"
                    name="maintenanceLead"
                    value={formData.maintenanceLead ?? ""}
                    onChange={handleChange}
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

export default AddEditApartment;
