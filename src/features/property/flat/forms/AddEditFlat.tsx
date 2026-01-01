// features/property/flat/forms/AddEditFlat.tsx

import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchEntityById,
  createEntity,
  updateEntity,
  fetchAllEntities,
} from "../../../../api/genericCrudApi";
import { showAddUpdateResult } from "../../../../utils/alerts/showAddUpdateConfirmation";

import type { FlatDTO } from "../../../../types/FlatDTO";
import type { ApartmentDTO } from "../../../../types/ApartmentDTO";

import TextInputField from "../../../../components/common/TextInputField";
import SelectField from "../../../../components/common/SelectField";
import SharedAddEditForm from "../../../shared/SharedAddEditForm";
import type { AddEditFormHandle } from "../../../shared/SharedAddEditForm";
import { useCurrentMenu } from "../../../../hooks/useCurrentMenu";

interface Props {
  flatId?: number;
  onUnsavedChange?: (changed: boolean) => void;
}

const endpoints = {
  getById: "/flat/Get-Flat-By-Id",
  add: "/flat/Add-New-Flat",
  update: "/flat/Update-Flat-By-Id",
  getAllApartments: "/apartment/Get-All-Apartment",
};

const emptyFlat: FlatDTO = {
  flatId: 0,
  apartmentId: 0,
  flatNumber: "",
  isRented: false,
  floorNumber: undefined,
  facingDirection: "",
  flatType: "",
  superBuiltUpArea: undefined,
  carParkingSlots: 0,
  isActive: true,
  hasGasPipeline: false,
  hasWaterConnection: true,
  hasBalcony: false,
  isFurnished: false,
  hasSolarPanel: false,
  hasInternetConnection: false,
  registeredEmail: "",
  registeredMobile: "",
  utilityNotes: "",
};

// Numeric enforcement helpers (inputMode is only a keyboard hint; these enforce the rule)
const normalizeIntegerText = (raw: string) => raw.replace(/[^\d]/g, "");

const normalizeDecimalText = (raw: string) => {
  let v = raw.replace(/[^0-9.]/g, "");
  const firstDot = v.indexOf(".");
  if (firstDot !== -1) {
    v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, "");
  }
  if (v.startsWith(".")) v = `0${v}`;
  return v;
};

const parseOptionalInt = (text: string): number | undefined => {
  const cleaned = normalizeIntegerText(text);
  return cleaned === "" ? undefined : Number(cleaned);
};

const parseIntOrZero = (text: string): number => {
  const cleaned = normalizeIntegerText(text);
  return cleaned === "" ? 0 : Number(cleaned);
};

const parseOptionalDecimal = (text: string): number | undefined => {
  const cleaned = normalizeDecimalText(text);
  if (cleaned === "") return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
};

// Keep boolean keys strongly typed (prevents any/as-any)
const flatBooleanKeys = [
  "isActive",
  "isRented",
  "hasWaterConnection",
  "hasGasPipeline",
  "hasBalcony",
  "isFurnished",
  "hasInternetConnection",
  "hasSolarPanel",
] as const;

type FlatBooleanKey = (typeof flatBooleanKeys)[number];

const isFlatBooleanKey = (name: string): name is FlatBooleanKey =>
  (flatBooleanKeys as readonly string[]).includes(name);

type SwitchFieldProps = {
  name: FlatBooleanKey;
  label: string;
  checked: boolean;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
};

const SwitchField = ({ name, label, checked, onChange }: SwitchFieldProps) => {
  const id = `flat-switch-${name}`;
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

const AddEditFlat = forwardRef<AddEditFormHandle, Props>(
  ({ flatId, onUnsavedChange }, ref) => {
    const [formData, setFormData] = useState<FlatDTO>(emptyFlat);
    const [apartments, setApartments] = useState<ApartmentDTO[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMode, setSubmitMode] = useState<"save" | "saveAndNext">(
      "save"
    );

    // Keep text state so user can type "12." then "12.5" naturally
    const [superBuiltUpAreaText, setSuperBuiltUpAreaText] =
      useState<string>("");

    const navigate = useNavigate();
    const formRef = useRef<HTMLFormElement>(null);
    const initialRef = useRef<FlatDTO | null>(null);
    const { parentListPath } = useCurrentMenu();

    const applyFormState = useCallback((data: FlatDTO) => {
      setFormData(data);
      setSuperBuiltUpAreaText(
        data.superBuiltUpArea === undefined || data.superBuiltUpArea === null
          ? ""
          : String(data.superBuiltUpArea)
      );
    }, []);

    useEffect(() => {
      fetchAllEntities<ApartmentDTO>(endpoints.getAllApartments)
        .then(setApartments)
        .catch(console.error);
    }, []);

    useEffect(() => {
      if (flatId) {
        fetchEntityById<FlatDTO>(endpoints.getById, flatId).then((data) => {
          applyFormState(data);
          initialRef.current = { ...data };
        });
      } else {
        applyFormState(emptyFlat);
        initialRef.current = { ...emptyFlat };
      }
    }, [flatId, applyFormState]);

    const hasUnsavedChanges = useMemo(() => {
      if (!initialRef.current) return false;
      return Object.keys(formData).some(
        (key) =>
          formData[key as keyof FlatDTO] !==
          initialRef.current![key as keyof FlatDTO]
      );
    }, [formData]);

    useEffect(() => {
      onUnsavedChange?.(hasUnsavedChanges);
    }, [hasUnsavedChanges, onUnsavedChange]);

    const handleReset = () => {
      applyFormState(initialRef.current ?? emptyFlat);
    };

    // Text inputs only
    const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
      const { name, value } = e.target;

      switch (name) {
        case "flatNumber":
        case "flatType":
        case "facingDirection":
        case "registeredEmail":
        case "utilityNotes":
          setFormData((prev) => ({ ...prev, [name]: value }));
          return;

        case "floorNumber":
          setFormData((prev) => ({
            ...prev,
            floorNumber: parseOptionalInt(value),
          }));
          return;

        case "carParkingSlots":
          setFormData((prev) => ({
            ...prev,
            carParkingSlots: parseIntOrZero(value),
          }));
          return;

        case "superBuiltUpArea": {
          const cleaned = normalizeDecimalText(value);
          setSuperBuiltUpAreaText(cleaned);
          setFormData((prev) => ({
            ...prev,
            superBuiltUpArea: parseOptionalDecimal(cleaned),
          }));
          return;
        }

        case "registeredMobile": {
          const cleaned = normalizeIntegerText(value);
          setFormData((prev) => ({ ...prev, registeredMobile: cleaned }));
          return;
        }

        default:
          setFormData((prev) => ({ ...prev, [name]: value }));
      }
    };

    // Select only
    const handleSelectChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
      const { name, value } = e.target;

      if (name === "apartmentId") {
        const id = Number(value) || 0;
        setFormData((prev) => ({ ...prev, apartmentId: id }));
        return;
      }

      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Switch toggles only
    const handleBooleanToggle: React.ChangeEventHandler<HTMLInputElement> = (e) => {
      const { name, checked } = e.target;
      if (!isFlatBooleanKey(name)) return;

      setFormData((prev) => ({ ...prev, [name]: checked }));
    };

    const requestSubmit = (mode: "save" | "saveAndNext") => {
      setSubmitMode(mode);
      formRef.current?.requestSubmit();
    };

    const handleSubmit = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      if (formRef.current && !formRef.current.checkValidity()) {
        formRef.current.reportValidity();
        return;
      }

      setIsSubmitting(true);
      const userId = parseInt(localStorage.getItem("userId") || "0", 10);

      try {
        if (flatId) {
          await updateEntity(endpoints.update, flatId, formData, userId, false);
          await showAddUpdateResult(true, "update", "flat");
          navigate(parentListPath);
          return;
        }

        await createEntity(endpoints.add, formData, userId, false);
        await showAddUpdateResult(true, "add", "flat");

        if (submitMode === "saveAndNext") {
          applyFormState(emptyFlat);
          initialRef.current = { ...emptyFlat };
        } else {
          navigate(parentListPath);
        }
      } catch (err) {
        console.error(err);
        await showAddUpdateResult(false, "error", "flat");
      } finally {
        setIsSubmitting(false);
      }
    };

    useImperativeHandle(ref, () => ({
      submit: () => requestSubmit("save"),
      reset: () => handleReset(),
      saveAndNext: () => requestSubmit("saveAndNext"),
    }));

    const apartmentOptions = Array.isArray(apartments)
      ? apartments
          .filter((a) => a.apartmentId !== undefined)
          .map((a) => ({
            label: a.apartmentName,
            value: a.apartmentId!,
          }))
      : [];

    const amenitySwitches: Array<{ name: FlatBooleanKey; label: string }> = [
      { name: "isActive", label: "Active" },
      { name: "isRented", label: "Rented" },
      { name: "hasWaterConnection", label: "Water" },
      { name: "hasGasPipeline", label: "Gas Pipeline" },
      { name: "hasBalcony", label: "Balcony" },
      { name: "isFurnished", label: "Furnished" },
      { name: "hasInternetConnection", label: "Internet" },
      { name: "hasSolarPanel", label: "Solar Panel" },
    ];

    return (
      <SharedAddEditForm
        isSubmitting={isSubmitting}
        hasUnsavedChanges={hasUnsavedChanges}
        onSubmit={handleSubmit}
        onReset={handleReset}
        onSaveAndNext={() => requestSubmit("saveAndNext")}
        isEditMode={!!flatId}
        formRef={formRef}
      >
        <div className="row g-4">
          {/* Full width layout */}
          <div className="col-12">
            <div className="d-flex flex-column gap-4">
              <SectionCard title="Flat Details">
                <div className="row g-3">
                  <div className="col-md-6">
                    <SelectField
                      label="Apartment"
                      name="apartmentId"
                      value={formData.apartmentId}
                      onChange={handleSelectChange}
                      required
                      options={apartmentOptions}
                    />
                  </div>

                  <div className="col-md-6">
                    <TextInputField
                      label="Flat Number"
                      name="flatNumber"
                      value={formData.flatNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <TextInputField
                      label="Flat Type"
                      name="flatType"
                      value={formData.flatType ?? ""}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <TextInputField
                      label="Flat Facing"
                      name="facingDirection"
                      value={formData.facingDirection ?? ""}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Area & Parking">
                <div className="row g-3">
                  <div className="col-md-4">
                    <TextInputField
                      label="Floor Number"
                      name="floorNumber"
                      value={formData.floorNumber ?? ""}
                      onChange={handleInputChange}
                      inputMode="numeric"
                    />
                  </div>

                  <div className="col-md-4">
                    <TextInputField
                      label="Super Builtup Area (sqft)"
                      name="superBuiltUpArea"
                      value={superBuiltUpAreaText}
                      onChange={handleInputChange}
                      inputMode="decimal"
                    />
                  </div>

                  <div className="col-md-4">
                    <TextInputField
                      label="Car Parking Slots"
                      name="carParkingSlots"
                      value={String(formData.carParkingSlots ?? 0)}
                      onChange={handleInputChange}
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </SectionCard>

              {/* Full width amenities section with 2 rows (4 per row on lg) */}
              <SectionCard title="Amenities & Status">
                <div className="row g-3">
                  {amenitySwitches.map(({ name, label }) => (
                    <div key={name} className="col-12 col-md-6 col-lg-3">
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

              <SectionCard title="Registration">
                <div className="row g-3">
                  <div className="col-md-4">
                    <TextInputField
                      label="Registered Email"
                      name="registeredEmail"
                      value={formData.registeredEmail ?? ""}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-md-4">
                    <TextInputField
                      label="Registered Mobile"
                      name="registeredMobile"
                      value={formData.registeredMobile ?? ""}
                      onChange={handleInputChange}
                      maxLength={15}
                      inputMode="numeric"
                    />
                  </div>

                  <div className="col-md-4">
                    <TextInputField
                      label="Utility Notes"
                      name="utilityNotes"
                      value={formData.utilityNotes ?? ""}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      </SharedAddEditForm>
    );
  }
);

export default AddEditFlat;