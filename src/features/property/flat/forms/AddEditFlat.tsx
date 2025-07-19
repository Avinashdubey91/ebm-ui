// features/property/flat/forms/AddEditFlat.tsx

import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchEntityById,
  createEntity,
  updateEntity,
  fetchAllEntities,
} from "../../../../api/genericCrudApi";
import { showAddUpdateResult } from "../../../../utils/alerts/showAddUpdateConfirmation";
import Swal from "sweetalert2";

import type { FlatDTO } from "../../../../types/FlatDTO";
import type { ApartmentDTO } from "../../../../types/ApartmentDTO";

import TextInputField from "../../../../components/common/TextInputField";
import CheckBoxField from "../../../../components/common/CheckBoxField";
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
  hasBalcony: true,
  isFurnished: false,
  hasSolarPanel: false,
  hasInternetConnection: false,
  registeredEmail: "",
  registeredMobile: "",
  utilityNotes: "",
};

const AddEditFlat = forwardRef<AddEditFormHandle, Props>(
  ({ flatId, onUnsavedChange }, ref) => {
    const [formData, setFormData] = useState<FlatDTO>(emptyFlat);
    const [apartments, setApartments] = useState<ApartmentDTO[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMode, setSubmitMode] = useState<"save" | "saveAndNext">(
      "save"
    );

    const navigate = useNavigate();
    const formRef = useRef<HTMLFormElement>(null);
    const initialRef = useRef<FlatDTO | null>(null);
    const { parentListPath } = useCurrentMenu();

    useEffect(() => {
      fetchAllEntities<ApartmentDTO>(endpoints.getAllApartments)
        .then(setApartments)
        .catch(console.error);
    }, []);

    useEffect(() => {
      if (flatId) {
        fetchEntityById<FlatDTO>(endpoints.getById, flatId).then((data) => {
          setFormData(data);
          initialRef.current = { ...data };
        });
      } else {
        setFormData(emptyFlat);
        initialRef.current = { ...emptyFlat };
      }
    }, [flatId]);

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

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      const { name, value, type } = e.target;
      const val =
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
      setFormData((prev) => ({ ...prev, [name]: val }));
    };

    const handleReset = () => {
      setFormData(initialRef.current ?? emptyFlat);
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
        } else {
          await createEntity(endpoints.add, formData, userId, false);
          await showAddUpdateResult(true, "add", "flat");
        }

        if (submitMode === "saveAndNext") {
          handleReset();
        } else {
          navigate(parentListPath);
        }
      } catch (err) {
        console.error(err);
        await showAddUpdateResult(true, "error", "flat");
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleSaveAndNext = async () => {
      const userId = parseInt(localStorage.getItem("userId") || "0", 10);
      try {
        await createEntity(endpoints.add, formData, userId, false);
        await Swal.fire("Created!", "Flat added successfully.", "success");
        handleReset();
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Failed to save flat.", "error");
      }
    };

    useImperativeHandle(ref, () => ({
      submit: () => {
        setSubmitMode("save");
        formRef.current?.requestSubmit();
      },
      reset: () => handleReset(),
      saveAndNext: () => {
        setSubmitMode("saveAndNext");
        formRef.current?.requestSubmit();
      },
    }));

    const apartmentOptions = Array.isArray(apartments)
  ? apartments
      .filter((a) => a.apartmentId !== undefined)
      .map((a) => ({
        label: a.apartmentName,
        value: a.apartmentId!,
      }))
  : [];


    return (
      <SharedAddEditForm
        isSubmitting={isSubmitting}
        hasUnsavedChanges={hasUnsavedChanges}
        onSubmit={handleSubmit}
        onReset={handleReset}
        onSaveAndNext={handleSaveAndNext}
        isEditMode={!!flatId}
        formRef={formRef}
      >
        <div className="row align-items-end">
          <div className="col-md-4 mb-3">
            <SelectField
              label="Apartment"
              name="apartmentId"
              value={formData.apartmentId}
              onChange={handleChange}
              required
              options={apartmentOptions}
            />
          </div>

          <div className="col-md-4 mb-3">
            <TextInputField
              label="Flat Number"
              name="flatNumber"
              value={formData.flatNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-4 mb-3">
            <TextInputField
              label="Flat Type"
              name="flatType"
              value={formData.flatType ?? ""}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4 mb-3">
            <TextInputField
              label="Facing"
              name="facingDirection"
              value={formData.facingDirection ?? ""}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-3 mb-3">
            <TextInputField
              label="Floor Number"
              name="floorNumber"
              value={formData.floorNumber ?? ""}
              onChange={handleChange}
              inputMode="numeric"
            />
          </div>

          <div className="col-md-3 mb-3">
            <TextInputField
              label="Super Builtup Area (sqft)"
              name="superBuiltUpArea"
              value={formData.superBuiltUpArea ?? ""}
              onChange={handleChange}
              inputMode="decimal"
            />
          </div>

          <div className="col-md-3 mb-3">
            <TextInputField
              label="Car Parking Slots"
              name="carParkingSlots"
              value={formData.carParkingSlots}
              onChange={handleChange}
              inputMode="numeric"
            />
          </div>

          {/* Boolean fields in checkbox grid */}
          <div className="col-md-6 mb-3 d-flex flex-wrap gap-3">
            {[
              { name: "isRented", label: "Rented" },
              { name: "hasGasPipeline", label: "Gas Pipeline" },
              { name: "hasWaterConnection", label: "Water" },
              { name: "hasBalcony", label: "Balcony" },
              { name: "isFurnished", label: "Furnished" },
              { name: "hasSolarPanel", label: "Solar Panel" },
              { name: "hasInternetConnection", label: "Internet" },
              { name: "isActive", label: "Active" },
            ].map(({ name, label }) => (
              <CheckBoxField
                key={name}
                name={name}
                label={label}
                checked={formData[name as keyof FlatDTO] as boolean}
                onChange={handleChange}
                checkboxStyle={{ transform: "scale(1.05)" }}
              />
            ))}
          </div>

          <div className="col-md-6 mb-3">
            <TextInputField
              label="Registered Email"
              name="registeredEmail"
              value={formData.registeredEmail ?? ""}
              onChange={handleChange}
            />
            <TextInputField
              label="Registered Mobile"
              name="registeredMobile"
              value={formData.registeredMobile ?? ""}
              onChange={handleChange}
              maxLength={15}
            />
            <TextInputField
              label="Utility Notes"
              name="utilityNotes"
              value={formData.utilityNotes ?? ""}
              onChange={handleChange}
            />
          </div>
        </div>
      </SharedAddEditForm>
    );
  }
);

export default AddEditFlat;
