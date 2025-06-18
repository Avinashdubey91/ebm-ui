// src/features/property/Society/forms/AddEditSociety.tsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEntity, fetchEntityById, updateEntity } from "../../../../api/genericCrudApi";
import { useLocationDropdowns } from "../../../../hooks/useLocationDropdowns";
import type { SocietyDTO } from "../../../../types/SocietyDTO";
import TextInputField from "../../../../components/common/TextInputField";
import SelectField from "../../../../components/common/SelectField";
import SharedAddEditForm from "../../../shared/SharedAddEditForm";
import Swal from "sweetalert2";

interface Props {
  societyId?: number;
  onUnsavedChange: (changed: boolean) => void;
}

const endpoints = {
  getById: "/society/Get-Society-By-Id",
  add: "/society/Add-New-Society",
  update: "/society/Update-Existing-Society",
};

const AddEditSociety: React.FC<Props> = ({ societyId, onUnsavedChange }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<SocietyDTO>({
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
    logoUrl: ""
  });

  const { countries, states, districts } = useLocationDropdowns(formData.countryId, formData.stateId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialRef = useRef<SocietyDTO | null>(null);

  useEffect(() => {
    if (societyId) {
      fetchEntityById<SocietyDTO>(endpoints.getById, societyId).then((data) => {
        setFormData(data);
        initialRef.current = { ...data };
      });
    } else {
      initialRef.current = {
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
        logoUrl: ""
        };
    }
  }, [societyId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
    }));
  };

  const hasUnsavedChanges = useMemo(() => {
    if (!initialRef.current) return false;
    const keys = Object.keys(formData) as (keyof SocietyDTO)[];
    return keys.some((key) => formData[key] !== initialRef.current?.[key]);

  }, [formData]);

  useEffect(() => {
    const keys = Object.keys(formData) as (keyof SocietyDTO)[];
    const changed = keys.some((key) => formData[key] !== initialRef.current?.[key]);
    onUnsavedChange(changed);
}, [formData, onUnsavedChange]);


  const resetForm = () => {
    if (societyId && initialRef.current) {
      setFormData(initialRef.current);
    } else {
      setFormData({
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
        logoUrl: ""
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement> | { preventDefault: () => void }) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const userId = parseInt(localStorage.getItem("userId") || "0", 10);
      if (!societyId) {
        await createEntity(endpoints.add, formData, userId, false);
        await Swal.fire("Created!", "Society added successfully.", "success");
      } else {
        await updateEntity(endpoints.update, societyId, formData, userId, false);
        await Swal.fire("Updated!", "Society updated successfully.", "success");
      }
      navigate("/dashboard/property/society/list");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to save society.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndNext = () => {
    handleSubmit({ preventDefault: () => {} });
  };

  return (
    <SharedAddEditForm
      isSubmitting={isSubmitting}
      hasUnsavedChanges={hasUnsavedChanges}
      onUnsavedChange={onUnsavedChange}
      onSubmit={handleSubmit}
      onReset={resetForm}
      onSaveAndNext={handleSaveAndNext}
    >
      <div className="col-md-4">
        <TextInputField label="Society Name" name="societyName" value={formData.societyName} onChange={handleChange} required />
      </div>
      <div className="col-md-4">
        <TextInputField label="Address" name="address" value={formData.address ?? ""} onChange={handleChange} />
      </div>
      <div className="col-md-4">
        <TextInputField label="City" name="city" value={formData.city ?? ""} onChange={handleChange} />
      </div>
      <div className="col-md-4">
        <TextInputField label="Pin Code" name="pinCode" value={formData.pinCode ?? ""} onChange={handleChange} />
      </div>
      <div className="col-md-4">
        <SelectField
          label="Country"
          name="countryId"
          value={formData.countryId ?? ""}
          onChange={handleChange}
          options={countries.map((c) => ({ label: c.countryName, value: c.countryId }))}
        />
      </div>
      <div className="col-md-4">
        <SelectField
          label="State"
          name="stateId"
          value={formData.stateId ?? ""}
          onChange={handleChange}
          options={states.map((s) => ({ label: s.stateName, value: s.stateId }))}
        />
      </div>
      <div className="col-md-4">
        <SelectField
          label="District"
          name="districtId"
          value={formData.districtId ?? ""}
          onChange={handleChange}
          options={districts.map((d) => ({ label: d.districtName, value: d.districtId }))}
        />
      </div>
      <div className="col-md-4">
        <TextInputField label="Contact Number" name="contactNumber" value={formData.contactNumber ?? ""} onChange={handleChange} />
      </div>
      <div className="col-md-4">
        <TextInputField label="Email" name="email" value={formData.email ?? ""} onChange={handleChange} />
      </div>
      <div className="col-md-4">
        <TextInputField label="Contact Person" name="contactPerson" value={formData.contactPerson ?? ""} onChange={handleChange} />
      </div>
      <div className="col-md-4">
        <TextInputField label="Secretary Name" name="secretaryName" value={formData.secretaryName ?? ""} onChange={handleChange} />
      </div>
      <div className="col-md-4">
        <TextInputField label="Secretary Phone" name="secretaryPhone" value={formData.secretaryPhone ?? ""} onChange={handleChange} />
      </div>
      <div className="col-md-4">
        <TextInputField label="Treasurer Name" name="treasurerName" value={formData.treasurerName ?? ""} onChange={handleChange} />
      </div>
      <div className="col-md-4">
        <TextInputField label="Treasurer Phone" name="treasurerPhone" value={formData.treasurerPhone ?? ""} onChange={handleChange} />
      </div>
      <div className="col-md-4">
        <TextInputField label="Registration Number" name="registrationNumber" value={formData.registrationNumber ?? ""} onChange={handleChange} />
      </div>
      <div className="col-md-4">
        <TextInputField label="Society Type" name="societyType" value={formData.societyType ?? ""} onChange={handleChange} />
      </div>
    </SharedAddEditForm>
  );
};

export default AddEditSociety;
