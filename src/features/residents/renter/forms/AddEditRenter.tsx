// features/residents/renters/forms/AddEditRenter.tsx

import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  createEntity,
  updateEntity,
  fetchEntityById,
} from "../../../../api/genericCrudApi";
import TextInputField from "../../../../components/common/TextInputField";
import CheckBoxField from "../../../../components/common/CheckBoxField";
import SharedAddEditForm from "../../../shared/SharedAddEditForm";
import type { AddEditFormHandle } from "../../../shared/SharedAddEditForm";
import type { RenterDTO } from "../../../../types/RenterDTO";
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

interface Props {
  renterId?: number;
  onUnsavedChange?: (changed: boolean) => void;
}

const endpoints = {
  getById: "/RenterProfile/Get-Renter-By-Id",
  add: "/RenterProfile/Create-New-Renter",
  update: "/RenterProfile/Update-Renter-By-Id",
};

const emptyRenter: RenterDTO = {
  renterId: 0,
  firstName: "",
  lastName: "",
  gender: "",
  mobile: "",
  alternateMobile: "",
  emailId: "",
  address: "",
  pinCode: "",
  livingSince: "",
  leaseEndDate: "",
  agreementCopyUrl: "",
  profilePhotoUrl: "",
  aadharNumber: "",
  isPoliceVerified: false,
  emergencyContactName: "",
  emergencyContactNumber: "",
  isActive: true,
  notes: "",
  countryId: undefined,
  stateId: undefined,
  districtId: undefined,
};

const AddEditRenter = forwardRef<AddEditFormHandle, Props>(
  ({ renterId, onUnsavedChange }, ref) => {
    const [formData, setFormData] = useState<RenterDTO>(emptyRenter);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMode, setSubmitMode] = useState<"save" | "saveAndNext">(
      "save"
    );

    const { parentListPath } = useCurrentMenu();
    const navigate = useNavigate();
    const formRef = useRef<HTMLFormElement>(null);
    const initialRef = useRef<RenterDTO | null>(null);
    const [countries, setCountries] = useState<CountryDTO[]>([]);
    const [states, setStates] = useState<StateDTO[]>([]);
    const [districts, setDistricts] = useState<DistrictDTO[]>([]);

    useEffect(() => {
      if (renterId) {
        fetchEntityById<RenterDTO>(endpoints.getById, renterId).then((data) => {
          setFormData(data);
          initialRef.current = { ...data };
        });
      } else {
        setFormData(emptyRenter);
        initialRef.current = { ...emptyRenter };
      }
    }, [renterId]);

    const hasUnsavedChanges = useMemo(() => {
      if (!initialRef.current) return false;
      return Object.keys(formData).some(
        (key) =>
          formData[key as keyof RenterDTO] !==
          initialRef.current?.[key as keyof RenterDTO]
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

    const handleReset = () => setFormData(initialRef.current ?? emptyRenter);

    const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
      if (e) e.preventDefault();
      if (formRef.current && !formRef.current.checkValidity()) {
        formRef.current.reportValidity();
        return;
      }

      setIsSubmitting(true);
      try {
        const userId = parseInt(localStorage.getItem("userId") ?? "0", 10);
        if (renterId) {
          await updateEntity(endpoints.update, renterId, formData, userId, false);
          await showAddUpdateResult(true, "update", "renter");
        } else {
          await createEntity(endpoints.add, formData, userId, false);
          await showAddUpdateResult(true, "add", "renter");
        }

        if (submitMode === "saveAndNext") handleReset();
        else navigate(parentListPath);
      } catch (err) {
        console.error(err);
        await showAddUpdateResult(false, "error", "renter");
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
      fetchCountries()
        .then(setCountries)
        .catch((err) => console.error("❌ Failed to fetch countries", err));
    }, []);

    useEffect(() => {
      if (formData.countryId) {
        fetchStatesByCountryId(formData.countryId).then((fetchedStates) => {
          setStates(fetchedStates);

          // ✅ Only clear stateId/districtId if NOT in edit mode
          if (!renterId) {
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
    }, [formData.countryId, renterId]);

    useEffect(() => {
      if (formData.stateId) {
        fetchDistrictsByStateId(formData.stateId).then((fetchedDistricts) => {
          setDistricts(fetchedDistricts);

          // ✅ Only clear districtId if NOT in edit mode
          if (!renterId) {
            setFormData((prev) => ({
              ...prev,
              districtId: undefined,
            }));
          }
        });
      } else {
        setDistricts([]);
      }
    }, [formData.stateId, renterId]);

    return (
      <SharedAddEditForm
        isSubmitting={isSubmitting}
        hasUnsavedChanges={hasUnsavedChanges}
        onSubmit={handleSubmit}
        onReset={handleReset}
        onSaveAndNext={() => setSubmitMode("saveAndNext")}
        isEditMode={!!renterId}
        formRef={formRef}
      >
        <div className="row">
          <div className="col-md-4 mb-3">
            <TextInputField
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-4 mb-3">
            <TextInputField
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
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
              maxLength={15}
            />
          </div>
          <div className="col-md-4 mb-3">
            <TextInputField
              label="Alternate Mobile"
              name="alternateMobile"
              value={formData.alternateMobile ?? ""}
              onChange={handleChange}
              maxLength={15}
            />
          </div>
          <div className="col-md-4 mb-3">
            <TextInputField
              label="Email"
              name="emailId"
              type="email"
              value={formData.emailId ?? ""}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-6 mb-3">
            <TextInputField
              label="Address"
              name="address"
              value={formData.address ?? ""}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-2 mb-3">
            <TextInputField
              label="PIN Code"
              name="pinCode"
              value={formData.pinCode ?? ""}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4 mb-3">
            <SelectField
              label="Country"
              name="countryId"
              value={formData.countryId ?? ""}
              onChange={handleChange}
              options={countries.map((c) => ({
                label: c.countryName,
                value: c.countryId,
              }))}
              required
            />
          </div>
          <div className="col-md-4 mb-3">
            <SelectField
              label="State"
              name="stateId"
              value={formData.stateId ?? ""}
              onChange={handleChange}
              options={states.map((s) => ({
                label: `${s.stateName} (${s.stateCode})`,
                value: s.stateId,
              }))}
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
              options={districts.map((d) => ({
                label: d.districtName,
                value: d.districtId,
              }))}
              disabled={!formData.stateId}
              required
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

          <div className="col-md-3 mb-3">
            <TextInputField
              label="Aadhar Number"
              name="aadharNumber"
              value={formData.aadharNumber ?? ""}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-3 mb-3">
            <TextInputField
              label="Emergency Contact Name"
              name="emergencyContactName"
              value={formData.emergencyContactName ?? ""}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-3 mb-3">
            <TextInputField
              label="Emergency Contact Number"
              name="emergencyContactNumber"
              value={formData.emergencyContactNumber ?? ""}
              onChange={handleChange}
              maxLength={15}
            />
          </div>

          <div className="col-md-2 mb-3">
            <CheckBoxField
              label="Police Verified"
              name="isPoliceVerified"
              checked={formData.isPoliceVerified}
              onChange={handleChange}
            />
            <CheckBoxField
              label="Active"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-6 mb-3">
            <TextInputField
              label="Notes"
              name="notes"
              value={formData.notes ?? ""}
              onChange={handleChange}
            />
          </div>
        </div>
      </SharedAddEditForm>
    );
  }
);

export default AddEditRenter;
