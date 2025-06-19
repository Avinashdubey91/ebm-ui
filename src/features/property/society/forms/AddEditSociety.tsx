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
import Swal from "sweetalert2";

import TextInputField from "../../../../components/common/TextInputField";
import SelectField from "../../../../components/common/SelectField";
import CheckBoxField from "../../../../components/common/CheckBoxField";
import SharedAddEditForm from "../../../shared/SharedAddEditForm";
import type { AddEditFormHandle } from "../../../shared/SharedAddEditForm";
// import { showAddUpdateConfirmation } from "../../../../utils/alerts/showAddUpdateConfirmation";
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

const AddEditSociety = forwardRef<AddEditFormHandle, Props>(
  ({ societyId, onUnsavedChange }, ref) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<SocietyDTO>(emptySociety);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const initialRef = useRef<SocietyDTO | null>(null);
    const { countries, states, districts } = useLocationDropdowns(
      formData.countryId,
      formData.stateId
    );
    const [submitMode, setSubmitMode] = useState<"save" | "saveAndNext">("save");
    const formRef = useRef<HTMLFormElement>(null);
    const { parentListPath } = useCurrentMenu();

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
      const { name, value, type } = e.target;
      const finalValue =
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
      setFormData((prev) => ({ ...prev, [name]: finalValue }));
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
          await updateEntity(endpoints.update, societyId, formData, userId, false);
          await showAddUpdateResult(true, "update", "society");
        } else {
          await createEntity(endpoints.add, formData, userId, false);
          await showAddUpdateResult(true, "add", "society");
        }

        if (submitMode === "saveAndNext") {
          handleReset();
        } else {
          navigate(parentListPath);
        }
      } catch (err) {
        console.error(err);
        await showAddUpdateResult( true, "error", "society");
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleReset = () => {
      setFormData(initialRef.current ?? emptySociety);
    };

    const handleSaveAndNext = async () => {
      const userId = parseInt(localStorage.getItem("userId") || "0", 10);
      try {
        await createEntity(endpoints.add, formData, userId, false);
        await Swal.fire("Created!", "Society added successfully.", "success");
        handleReset(); // ✅ Clear the form after save
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Failed to save society.", "error");
      }
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
        onSaveAndNext={handleSaveAndNext}
        isEditMode={!!societyId}
        formRef={formRef} 
        className=""
      >
        <div className="row align-items-end">
          <div className="col-md-4 mb-3">
            <TextInputField
              label="Society Name"
              name="societyName"
              value={formData.societyName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-4 mb-3">
            <TextInputField
              label="Address"
              name="address"
              value={formData.address ?? ""}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-4 mb-3">
            <TextInputField
              label="City"
              name="city"
              value={formData.city ?? ""}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-4 mb-3">
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
                const input = e.currentTarget;
                input.value = input.value.replace(/[^0-9]/g, "").slice(0, 6);
              }}
            />
          </div>
          <div className="col-md-4 mb-3">
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
          <div className="col-md-4 mb-3">
            <SelectField
              label="State"
              name="stateId"
              value={formData.stateId ?? ""}
              onChange={handleChange}
              required
              disabled={!formData.countryId}
              options={states.map((state) => ({
                label: `${state.stateName} (${state.stateCode})`,
                value: state.stateId,
              }))}
            />
          </div>
          <div className="col-md-4 mb-3">
            <SelectField
              label="District"
              name="districtId"
              value={formData.districtId ?? ""}
              onChange={handleChange}
              required
              disabled={districts.length === 0}
              options={districts.map((district) => ({
                label: district.districtName,
                value: district.districtId,
              }))}
            />
          </div>
          <div className="col-md-4 mb-3">
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
                const input = e.currentTarget;
                input.value = input.value.replace(/[^0-9]/g, "").slice(0, 10);
              }}
            />
          </div>
          <div className="col-md-4 mb-3">
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
          <div className="col-md-4 mb-3">
            <TextInputField
              label="Contact Person"
              name="contactPerson"
              value={formData.contactPerson ?? ""}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-4 mb-3">
            <TextInputField
              label="Secretary Name"
              name="secretaryName"
              value={formData.secretaryName ?? ""}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-4 mb-3">
            <TextInputField
              name="secretaryPhone"
              label="Secratory Mobile"
              value={formData.secretaryPhone ?? ""}
              onChange={handleChange}
              pattern="^\d{10}$"
              maxLength={10}
              title="Mobile number must be 10 digits"
              inputMode="numeric"
              onInput={(e: React.FormEvent<HTMLInputElement>) => {
                const input = e.currentTarget;
                input.value = input.value.replace(/[^0-9]/g, "").slice(0, 10);
              }}
            />
          </div>
          <div className="col-md-4 mb-3">
            <TextInputField
              label="Treasurer Name"
              name="treasurerName"
              value={formData.treasurerName ?? ""}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-4 mb-3">
            <TextInputField
              name="treasurerPhone"
              label="Treassurer Mobile"
              value={formData.treasurerPhone ?? ""}
              onChange={handleChange}
              pattern="^\d{10}$"
              maxLength={10}
              title="Mobile number must be 10 digits"
              inputMode="numeric"
              onInput={(e: React.FormEvent<HTMLInputElement>) => {
                const input = e.currentTarget;
                input.value = input.value.replace(/[^0-9]/g, "").slice(0, 10);
              }}
            />
          </div>
          <div className="col-md-4 mb-3">
            <TextInputField
              label="Registration Number"
              name="registrationNumber"
              value={formData.registrationNumber ?? ""}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-4 mb-3">
            <TextInputField
              label="Society Type"
              name="societyType"
              value={formData.societyType ?? ""}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-4 mt-3 d-flex flex-column">
            <CheckBoxField
              label="Has Clubhouse"
              name="hasClubhouse"
              checked={!!formData.hasClubhouse}
              onChange={handleChange}
              checkboxStyle={{ transform: "scale(1.1)", marginRight: "10px" }}
            />
            <CheckBoxField
              label="Has Swimming Pool"
              name="hasSwimmingPool"
              checked={!!formData.hasSwimmingPool}
              onChange={handleChange}
              checkboxStyle={{ transform: "scale(1.1)", marginRight: "10px" }}
            />
          </div>
        </div>
      </SharedAddEditForm>
    );
  }
);

export default AddEditSociety;
