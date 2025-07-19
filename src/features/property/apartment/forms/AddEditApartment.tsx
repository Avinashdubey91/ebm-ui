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
import type { SocietyDTO }  from "../../../../types/SocietyDTO";

import TextInputField   from "../../../../components/common/TextInputField";
import SelectField      from "../../../../components/common/SelectField";
import CheckBoxField    from "../../../../components/common/CheckBoxField";
import SharedAddEditForm from "../../../shared/SharedAddEditForm";
import type { AddEditFormHandle } from "../../../shared/SharedAddEditForm";
import { showAddUpdateResult } from "../../../../utils/alerts/showAddUpdateConfirmation";
import { useCurrentMenu } from "../../../../hooks/useCurrentMenu";
import Swal from "sweetalert2";

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
  getById : "/apartment/Get-Apartment-By-Id",
  add     : "/apartment/Add-New-Apartment",
  update  : "/apartment/Update-Existing-Apartment",

  /* helper for society dropdown */
  getAllSocieties : "/society/Get-All-Societies",
};

/* ---------- empty model ----------- */
const emptyApartment: ApartmentDTO = {
  apartmentId: 0,
  societyId  : 0,
  apartmentName : "",
  blockName      : "",
  constructionYear : undefined,
  buildingType  : "",
  totalFloors   : undefined,
  totalFlats    : undefined,
  hasLift       : false,
  hasGenerator  : false,
  gateFacing    : "",
  caretakerName : "",
  caretakerPhone: "",
  maintenanceLead  : "",
  emergencyContact : "",
};

const AddEditApartment = forwardRef<AddEditFormHandle, Props>(
({ apartmentId, onUnsavedChange }, ref) => {

  const [formData, setFormData] = useState<ApartmentDTO>(emptyApartment);
  const [societies, setSocieties] = useState<SocietyDTO[]>([]);           // dropdown
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMode,   setSubmitMode]   = useState<"save" | "saveAndNext">("save");

  const navigate        = useNavigate();
  const { parentListPath } = useCurrentMenu();
  const formRef         = useRef<HTMLFormElement>(null);
  const initialRef      = useRef<ApartmentDTO | null>(null);

  /* ---------- fetch societies for dropdown ---------- */
  useEffect(() => {
    fetchAllEntities<SocietyDTO>(endpoints.getAllSocieties)
      .then(setSocieties)
      .catch((err) => console.error("❌ Failed to fetch societies:", err));
  }, []);

  /* ---------- fetch single apartment (edit mode) ---------- */
  useEffect(() => {
    if (apartmentId) {
      fetchEntityById<ApartmentDTO>(endpoints.getById, apartmentId).then((data) => {
        setFormData(data);
        initialRef.current = { ...data };
      });
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

  useEffect(() => { onUnsavedChange?.(hasUnsavedChanges); },
            [hasUnsavedChanges, onUnsavedChange]);

  /* ---------- field change handler ---------- */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox"
      ? (e.target as HTMLInputElement).checked
      : value;
    setFormData((p) => ({ ...p, [name]: val }));
  };

  /* ---------- reset ---------- */
  const handleReset = () =>
    setFormData(initialRef.current ?? emptyApartment);

  /* ---------- submit ---------- */
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
        await updateEntity(endpoints.update, apartmentId, formData, userId, false);
        await showAddUpdateResult(true, "update", "apartment");
      } else {
        await createEntity(endpoints.add, formData, userId, false);
        await showAddUpdateResult(true, "add", "apartment");
      }

      /* post-submit */
      if (submitMode === "saveAndNext") {
        handleReset();
      } else {
        navigate(parentListPath);
      }
    } catch (err) {
      console.error(err);
      await showAddUpdateResult(true, "error", "apartment");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- save-and-next for bulk entry ---------- */
  const handleSaveAndNext = async () => {
    const userId = parseInt(localStorage.getItem("userId") || "0", 10);
    try {
      await createEntity(endpoints.add, formData, userId, false);
      await Swal.fire("Created!", "Apartment added successfully.", "success");
      handleReset();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to save apartment.", "error");
    }
  };

  /* ---------- expose imperative API ---------- */
  useImperativeHandle(ref, () => ({
    submit: () => { setSubmitMode("save");       formRef.current?.requestSubmit(); },
    reset : () => handleReset(),
    saveAndNext: () => { setSubmitMode("saveAndNext"); formRef.current?.requestSubmit(); },
  }));

   /* ---------- dropdown options (never undefined) ---------- */
  const societyOptions = societies
    .filter((s) => s.societyId !== undefined)
    .map((s) => ({
      label : s.societyName,
      value : s.societyId as number,      // guaranteed number
    }));

  /* ---------- UI ---------- */
  return (
    <SharedAddEditForm
      isSubmitting={isSubmitting}
      hasUnsavedChanges={hasUnsavedChanges}
      onSubmit={handleSubmit}
      onReset={handleReset}
      onSaveAndNext={handleSaveAndNext}
      isEditMode={!!apartmentId}
      formRef={formRef}
    >
      <div className="row align-items-end">
        {/* ----- Society (dropdown) ----- */}
        <div className="col-md-4 mb-3">
          <SelectField
            label="Society"
            name="societyId"
            value={formData.societyId}
            onChange={handleChange}
            required
            options={societyOptions}
          />
        </div>

        {/* ----- Basic Info ----- */}
        <div className="col-md-4 mb-3">
          <TextInputField
            label="Apartment Name"
            name="apartmentName"
            value={formData.apartmentName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-4 mb-3">
          <TextInputField
            label="Block"
            name="blockName"
            value={formData.blockName ?? ""}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-4 mb-3">
          <TextInputField
            label="Construction Year"
            name="constructionYear"
            value={formData.constructionYear ?? ""}
            onChange={handleChange}
            pattern="^\d{4}$"
            inputMode="numeric"
            title="Year must be 4 digits"
          />
        </div>
        <div className="col-md-4 mb-3">
          <TextInputField
            label="Building Type"
            name="buildingType"
            value={formData.buildingType ?? ""}
            onChange={handleChange}
          />
        </div>

        {/* ----- Stats ----- */}
        <div className="col-md-3 mb-3">
          <TextInputField
            label="Total Floors"
            name="totalFloors"
            value={formData.totalFloors ?? ""}
            onChange={handleChange}
            inputMode="numeric"
          />
        </div>
        <div className="col-md-3 mb-3">
          <TextInputField
            label="Total Flats"
            name="totalFlats"
            value={formData.totalFlats ?? ""}
            onChange={handleChange}
            inputMode="numeric"
          />
        </div>
        <div className="col-md-3 mb-3">
          <TextInputField
            label="Gate Facing"
            name="gateFacing"
            value={formData.gateFacing ?? ""}
            onChange={handleChange}
          />
        </div>

        {/* ----- Booleans ----- */}
        <div className="col-md-3 mb-3 d-flex flex-column">
          <CheckBoxField
            label="Lift"
            name="hasLift"
            checked={formData.hasLift}
            onChange={handleChange}
            checkboxStyle={{ transform: "scale(1.1)", marginRight: "10px" }}
          />
          <CheckBoxField
            label="Generator"
            name="hasGenerator"
            checked={formData.hasGenerator}
            onChange={handleChange}
            checkboxStyle={{ transform: "scale(1.1)", marginRight: "10px" }}
          />
        </div>

        {/* ----- Contacts ----- */}
        <div className="col-md-4 mb-3">
          <TextInputField
            label="Caretaker Name"
            name="caretakerName"
            value={formData.caretakerName ?? ""}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-4 mb-3">
          <TextInputField
            label="Caretaker Phone"
            name="caretakerPhone"
            value={formData.caretakerPhone ?? ""}
            onChange={handleChange}
            pattern="^\d{10}$"
            maxLength={10}
            inputMode="numeric"
          />
        </div>
        <div className="col-md-4 mb-3">
          <TextInputField
            label="Maintenance Lead"
            name="maintenanceLead"
            value={formData.maintenanceLead ?? ""}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-4 mb-3">
          <TextInputField
            label="Emergency Contact"
            name="emergencyContact"
            value={formData.emergencyContact ?? ""}
            onChange={handleChange}
          />
        </div>
      </div>
    </SharedAddEditForm>
  );
});

export default AddEditApartment;
