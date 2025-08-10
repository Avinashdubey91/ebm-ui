import React, {
  useEffect, useRef, useState, useMemo, forwardRef, useImperativeHandle,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  createEntity, updateEntity, fetchEntityById,
} from "../../../../api/genericCrudApi";
import TextInputField from "../../../../components/common/TextInputField";
import CheckBoxField from "../../../../components/common/CheckBoxField";
import SharedAddEditForm from "../../../shared/SharedAddEditForm";
import type { AddEditFormHandle } from "../../../shared/SharedAddEditForm";
import type { OwnerDTO } from "../../../../types/OwnerDTO";
import { showAddUpdateResult } from "../../../../utils/alerts/showAddUpdateConfirmation";
import { useCurrentMenu } from "../../../../hooks/useCurrentMenu";
import { fetchCountries, fetchStatesByCountryId, fetchDistrictsByStateId } from "../../../../api/locationApi";
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

const AddEditOwner = forwardRef<AddEditFormHandle, Props>(({ ownerId, onUnsavedChange }, ref) => {
  const [formData, setFormData] = useState<OwnerDTO>(emptyOwner);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMode, setSubmitMode] = useState<"save" | "saveAndNext">("save");

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
    return Object.keys(formData).some((key) => formData[key as keyof OwnerDTO] !== initialRef.current?.[key as keyof OwnerDTO]);
  }, [formData]);

  useEffect(() => {
    onUnsavedChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onUnsavedChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleReset = () => setFormData(initialRef.current ?? emptyOwner);

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
        await updateEntity(endpoints.update, ownerId, formData, userId, false); // isMultipart = false
        await showAddUpdateResult(true, "update", "owner");
      } else {
        await createEntity(endpoints.add, formData, userId, false); // isMultipart = false
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

  useEffect(() => {
    fetchCountries().then(setCountries).catch(console.error);
  }, []);

  useEffect(() => {
    if (formData.countryId) {
      fetchStatesByCountryId(formData.countryId).then((fetchedStates) => {
        setStates(fetchedStates);

        // ✅ Only clear stateId/districtId if NOT in edit mode
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

        // ✅ Only clear districtId if NOT in edit mode
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

  return (
    <SharedAddEditForm
      isSubmitting={isSubmitting}
      hasUnsavedChanges={hasUnsavedChanges}
      onSubmit={handleSubmit}
      onReset={handleReset}
      onSaveAndNext={() => setSubmitMode("saveAndNext")}
      isEditMode={!!ownerId}
      formRef={formRef}
    >
      <div className="row">
        <div className="col-md-4 mb-3">
          <TextInputField label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
        </div>
        <div className="col-md-4 mb-3">
          <TextInputField label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
        </div>
        <div className="col-md-4 mb-3">
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

        <div className="col-md-4 mb-3">
          <TextInputField
            label="Mobile"
            name="mobile"
            value={formData.mobile ?? ""}
            onChange={handleChange}
            {...buildNumericInputProps({
              maxDigits: 10,
              pattern: "^\\d{10}$",
              title: "Mobile number must be exactly 10 digits",
              required: true,
            })}
          />
        </div>
        <div className="col-md-4 mb-3">
          <TextInputField
            label="Alternate Mobile"
            name="alternateMobile"
            value={formData.alternateMobile ?? ""}
            onChange={handleChange}
            {...buildNumericInputProps({
              maxDigits: 10,
              pattern: "^\\d{10}$",
              title: "Alternate mobile must be exactly 10 digits",
            })}
          />
        </div>
        <div className="col-md-4 mb-3">
          <TextInputField
            label="Email ID"
            name="emailId"
            value={formData.emailId ?? ""}
            onChange={handleChange}
            {...buildEmailProps()}
            onBlur={onBlurNormalizeEmail((val) =>
              setFormData((p) => ({ ...p, emailId: val }))
            )}
          />
        </div>

        <div className="col-md-6 mb-3">
          <TextInputField label="Address" name="address" value={formData.address ?? ""} onChange={handleChange} />
        </div>
        <div className="col-md-2 mb-3">
          <TextInputField label="PIN Code" name="pinCode" value={formData.pinCode ?? ""} onChange={handleChange} />
        </div>

        <div className="col-md-4 mb-3">
          <SelectField
            label="Country"
            name="countryId"
            value={formData.countryId ?? ""}
            onChange={handleChange}
            options={countries.map(c => ({ label: c.countryName, value: c.countryId }))}
            required
          />
        </div>
        <div className="col-md-4 mb-3">
          <SelectField
            label="State"
            name="stateId"
            value={formData.stateId ?? ""}
            onChange={handleChange}
            options={states.map(s => ({ label: `${s.stateName} (${s.stateCode})`, value: s.stateId }))}
            disabled={!formData.countryId}
            required
          />
        </div>
        <div className="col-md-4 mb-3">
          <SelectField
            label="District"
            name="districtId"
            value={formData.districtId ?? ""}
            onChange={handleChange}
            options={districts.map(d => ({ label: d.districtName, value: d.districtId }))}
            disabled={!formData.stateId}
            required
          />
        </div>

        <div className="col-md-4 mb-3">
          <TextInputField label="City" name="city" value={formData.city ?? ""} onChange={handleChange} />
        </div>

        <div className="col-md-3 mb-3">
          <TextInputField
            label="Aadhar Number"
            name="aadharNumber"
            value={formatAadhaarForDisplay(formData.aadharNumber ?? "", aadhaarFocused)}
            onChange={handleChange}
            {...buildAadhaarProps()}   // now defaults to no pattern (no hard block)
            onFocus={(e) => {
              setAadhaarFocused(true);
              e.currentTarget.value = e.currentTarget.value.replace(/-/g, "");
            }}
            onBlur={() => setAadhaarFocused(false)}
          />
        </div>
        <div className="col-md-3 mb-3">
          <TextInputField label="Occupation" name="occupation" value={formData.occupation ?? ""} onChange={handleChange} />
        </div>
        <div className="col-md-3 mb-3">
          <TextInputField label="Ownership Type" name="ownershipType" value={formData.ownershipType ?? ""} onChange={handleChange} />
        </div>

        <div className="col-md-3 mb-3">
          <TextInputField label="Emergency Contact Name" name="emergencyContactName" value={formData.emergencyContactName ?? ""} onChange={handleChange} />
        </div>
        <div className="col-md-3 mb-3">
          <TextInputField
            label="Emergency Contact Number"
            name="emergencyContactNumber"
            value={formData.emergencyContactNumber ?? ""}
            onChange={handleChange}
            {...buildNumericInputProps({
              maxDigits: 10,
              pattern: "^\\d{10}$",
              title: "Contact number must be exactly 10 digits",
              required: true,
            })}
          />
        </div>

        <div className="col-md-2 mb-3">
          <CheckBoxField label="First Owner" name="isFirstOwner" checked={formData.isFirstOwner} onChange={handleChange} />
          <CheckBoxField label="Deceased" name="isDeceased" checked={formData.isDeceased} onChange={handleChange} />
          <CheckBoxField label="Active" name="isActive" checked={formData.isActive} onChange={handleChange} />
        </div>

        <div className="col-md-6 mb-3">
          <TextInputField label="Notes" name="notes" value={formData.notes ?? ""} onChange={handleChange} />
        </div>
      </div>
    </SharedAddEditForm>
  );
});

export default AddEditOwner;
