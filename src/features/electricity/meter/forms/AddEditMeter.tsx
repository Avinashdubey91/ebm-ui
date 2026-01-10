import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  createEntity,
  fetchAllEntities,
  fetchEntityById,
  updateEntity,
} from "../../../../api/genericCrudApi";

import SharedAddEditForm from "../../../shared/SharedAddEditForm";
import type { AddEditFormHandle } from "../../../shared/SharedAddEditForm";

import SelectField from "../../../../components/common/SelectField";
import TextInputField from "../../../../components/common/TextInputField";
import DateInput from "../../../../components/common/DateInput";

import { showAddUpdateResult } from "../../../../utils/alerts/showAddUpdateConfirmation";
import { normalizeToYmd } from "../../../../utils/format";
import { useCurrentMenu } from "../../../../hooks/useCurrentMenu";

const SectionCard: React.FC<React.PropsWithChildren<{ title: string }>> = ({
  title,
  children,
}) => {
  return (
    <div className="border rounded-3 p-3">
      <div className="fw-bold mb-3">{title}</div>
      {children}
    </div>
  );
};

type SwitchTileProps = {
  id: string;
  name: "isActive" | "isSmartMeter";
  label: string;
  checked: boolean;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
};

const SwitchTile = ({ id, name, label, checked, onChange }: SwitchTileProps) => {
  const controlMinHeight = 38;

  return (
    <div className="d-flex flex-column w-100">
      <label className="form-label fw-semibold mb-2" htmlFor={id}>
        {label}
      </label>

      <div
        className="border rounded-3 d-flex align-items-center justify-content-between px-3 w-100"
        style={{ minHeight: controlMinHeight, cursor: "pointer" }}
        onClick={() => {
          const el = document.getElementById(id);
          if (el instanceof HTMLInputElement) el.click();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            const el = document.getElementById(id);
            if (el instanceof HTMLInputElement) el.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-controls={id}
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
          />
        </div>
      </div>
    </div>
  );
};

type SubmitMode = "save" | "saveAndNext";

type ApartmentDTO = { apartmentId: number; apartmentName?: string | null };

type FlatDTO = {
  flatId: number;
  flatNumber?: string | null;
  flatNo?: string | null;
  flatName?: string | null;
  flatDisplayName?: string | null;
};

type FlatOwnerNameLookupDTO = {
  flatId: number;
  firstName?: string | null;
  lastName?: string | null;
};

type MeterDTO = {
  meterId: number;
  utilityType: string | number;
  meterScope: string | number;
  flatId?: number | null;
  apartmentId: number;
  meterNumber: string;

  installationDate?: string | null;
  lastVerifiedDate?: string | null;

  isActive: boolean;
  isSmartMeter: boolean;

  manufacturer?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  readingUnit?: string | null;
  locationDescription?: string | null;

  installationBy?: string | null;
  verifiedBy?: string | null;
  verificationStatus?: string | number | null;
  verificationRemarks?: string | null;

  deactivationReason?: string | null;
  phaseType?: string | number | null;
};

type FormState = {
  meterId: number;
  apartmentId?: number;
  flatId?: number;

  meterNumber: string;
  utilityType: string;
  meterScope: string;

  installationDate: string;
  lastVerifiedDate: string;

  isActive: boolean;
  isSmartMeter: boolean;

  manufacturer: string;
  model: string;
  serialNumber: string;
  readingUnit: string;
  locationDescription: string;

  installationBy: string;
  verifiedBy: string;
  verificationStatus: string;
  verificationRemarks: string;

  phaseType: string;
  deactivationReason: string;
};

const endpoints = {
  getById: "/meter/Get-Meter-By-Id",
  add: "/meter/Create-New-Meter",
  update: "/meter/Update-Meter-By-Id",

  apartments: "/apartment/Get-All-Apartment",
  flats: "/flat/Get-All-Flats",
  flatOwnerLookup: "/meter/Get-FlatOwnerLookup",
};

const emptyForm: FormState = {
  meterId: 0,
  apartmentId: undefined,
  flatId: undefined,

  meterNumber: "",
  utilityType: "Electricity",
  meterScope: "Personal",

  installationDate: "",
  lastVerifiedDate: "",

  isActive: true,
  isSmartMeter: false,

  manufacturer: "",
  model: "",
  serialNumber: "",
  readingUnit: "",
  locationDescription: "",

  installationBy: "",
  verifiedBy: "",
  verificationStatus: "",
  verificationRemarks: "",

  phaseType: "",
  deactivationReason: "",
};

interface Props {
  meterId?: number;
  onUnsavedChange?: (changed: boolean) => void;
}

const pickText = (v: string | null | undefined): string | null => {
  const t = (v ?? "").trim();
  return t.length > 0 ? t : null;
};

const getFlatNumberText = (f: FlatDTO): string | null => {
  return (
    pickText(f.flatNumber) ??
    pickText(f.flatNo) ??
    pickText(f.flatDisplayName) ??
    pickText(f.flatName)
  );
};

const AddEditMeter = forwardRef<AddEditFormHandle, Props>(
  ({ meterId, onUnsavedChange }, ref) => {
    const navigate = useNavigate();
    const { parentListPath } = useCurrentMenu();

    const isEdit = !!meterId;

    const [formData, setFormData] = useState<FormState>(emptyForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMode, setSubmitMode] = useState<SubmitMode>("save");

    const [apartments, setApartments] = useState<ApartmentDTO[]>([]);
    const [flats, setFlats] = useState<FlatDTO[]>([]);
    const [flatOwners, setFlatOwners] = useState<FlatOwnerNameLookupDTO[]>([]);

    const formRef = useRef<HTMLFormElement>(null);
    const initialRef = useRef<FormState | null>(null);

    useEffect(() => {
      const loadMasters = async () => {
        try {
          const [aptRes, flatsRes] = await Promise.all([
            fetchAllEntities<ApartmentDTO>(endpoints.apartments),
            fetchAllEntities<FlatDTO>(endpoints.flats),
          ]);
          setApartments(Array.isArray(aptRes) ? aptRes : []);
          setFlats(Array.isArray(flatsRes) ? flatsRes : []);
        } catch (err) {
          console.error("❌ Failed to load master data:", err);
          setApartments([]);
          setFlats([]);
        }
      };

      void loadMasters();
    }, []);

    useEffect(() => {
      const load = async () => {
        if (!meterId) {
          setFormData(emptyForm);
          initialRef.current = { ...emptyForm };
          return;
        }

        const data = await fetchEntityById<MeterDTO>(endpoints.getById, meterId);

        const mapped: FormState = {
          ...emptyForm,
          meterId: data.meterId ?? meterId,
          apartmentId: data.apartmentId ?? undefined,
          flatId: data.flatId ?? undefined,

          meterNumber: data.meterNumber ?? "",
          utilityType:
            typeof data.utilityType === "string"
              ? data.utilityType
              : String(data.utilityType),
          meterScope:
            typeof data.meterScope === "string"
              ? data.meterScope
              : String(data.meterScope),

          installationDate: normalizeToYmd(data.installationDate),
          lastVerifiedDate: normalizeToYmd(data.lastVerifiedDate),

          isActive: Boolean(data.isActive),
          isSmartMeter: Boolean(data.isSmartMeter),

          manufacturer: data.manufacturer ?? "",
          model: data.model ?? "",
          serialNumber: data.serialNumber ?? "",
          readingUnit: data.readingUnit ?? "",
          locationDescription: data.locationDescription ?? "",

          installationBy: data.installationBy ?? "",
          verifiedBy: data.verifiedBy ?? "",
          verificationStatus:
            data.verificationStatus === null || data.verificationStatus === undefined
              ? ""
              : typeof data.verificationStatus === "string"
              ? data.verificationStatus
              : String(data.verificationStatus),
          verificationRemarks: data.verificationRemarks ?? "",

          phaseType:
            data.phaseType === null || data.phaseType === undefined
              ? ""
              : typeof data.phaseType === "string"
              ? data.phaseType
              : String(data.phaseType),

          deactivationReason: data.deactivationReason ?? "",
        };

        setFormData(mapped);
        initialRef.current = { ...mapped };
      };

      void load();
    }, [meterId]);

    useEffect(() => {
      const aptId = formData.apartmentId;
      if (!aptId) {
        setFlatOwners([]);
        return;
      }

      const loadOwners = async () => {
        try {
          const res = await fetchAllEntities<FlatOwnerNameLookupDTO>(
            `${endpoints.flatOwnerLookup}/${aptId}`
          );
          setFlatOwners(Array.isArray(res) ? res : []);
        } catch (err) {
          console.error("❌ Failed to load flat owner lookup:", err);
          setFlatOwners([]);
        }
      };

      void loadOwners();
    }, [formData.apartmentId]);

    const hasUnsavedChanges = useMemo(() => {
      if (!initialRef.current) return false;
      return (Object.keys(formData) as (keyof FormState)[]).some(
        (k) => formData[k] !== initialRef.current![k]
      );
    }, [formData]);

    useEffect(() => {
      onUnsavedChange?.(hasUnsavedChanges);
    }, [hasUnsavedChanges, onUnsavedChange]);

    const apartmentOptions = useMemo(
      () =>
        apartments.map((a) => ({
          value: a.apartmentId,
          label: a.apartmentName ?? `Apartment #${a.apartmentId}`,
        })),
      [apartments]
    );

    const flatNumberById = useMemo(() => {
      const m = new Map<number, string>();
      flats.forEach((f) => {
        const txt = getFlatNumberText(f);
        m.set(f.flatId, txt ?? `Flat #${f.flatId}`);
      });
      return m;
    }, [flats]);

    const flatOwnerOptions = useMemo(() => {
      const options = flatOwners.map((o) => {
        const flatNumber = flatNumberById.get(o.flatId) ?? `Flat #${o.flatId}`;

        const first = (o.firstName ?? "").trim();
        const last = (o.lastName ?? "").trim();
        const fullName = [first, last].filter((x) => x.length > 0).join(" ");

        return {
          value: o.flatId,
          label: fullName ? `${flatNumber} (${fullName})` : flatNumber,
        };
      });

      const currentId = formData.flatId;
      if (currentId && !options.some((x) => x.value === currentId)) {
        options.unshift({
          value: currentId,
          label: flatNumberById.get(currentId) ?? `Flat #${currentId}`,
        });
      }

      return options;
    }, [flatOwners, flatNumberById, formData.flatId]);

    const utilityOptions = useMemo(
      () => [
        { value: "Electricity", label: "Electricity" },
        { value: "Water", label: "Water" },
        { value: "Gas", label: "Gas" },
        { value: "Heat", label: "Heat" },
      ],
      []
    );

    const scopeOptions = useMemo(
      () => [
        { value: "Personal", label: "Personal" },
        { value: "Apartment", label: "Apartment" },
        { value: "Society", label: "Society" },
        { value: "Block", label: "Block" },
        { value: "Commercial", label: "Commercial" },
        { value: "CommonArea", label: "Common Area" },
        { value: "Temporary", label: "Temporary" },
      ],
      []
    );

    const phaseOptions = useMemo(
      () => [
        { value: "SinglePhase", label: "Single-Phase" },
        { value: "TwoPhase", label: "Two-Phase" },
        { value: "ThreePhase", label: "Three-Phase" },
      ],
      []
    );

    const verificationStatusOptions = useMemo(
      () => [
        { value: "Pending", label: "Pending" },
        { value: "Verified", label: "Verified" },
        { value: "Failed", label: "Failed" },
        { value: "ReverificationRequired", label: "Reverification Required" },
      ],
      []
    );

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      const { name, value } = e.currentTarget;

      if (
        e.currentTarget instanceof HTMLInputElement &&
        e.currentTarget.type === "checkbox"
      ) {
        const checked = e.currentTarget.checked;
        setFormData((prev) => ({ ...prev, [name]: checked }));
        return;
      }

      if (name === "apartmentId") {
        const num = value ? Number(value) : undefined;
        setFormData((prev) => ({
          ...prev,
          apartmentId: num,
          flatId: undefined,
        }));
        return;
      }

      if (name === "flatId") {
        const num = value ? Number(value) : undefined;
        setFormData((prev) => ({ ...prev, flatId: num }));
        return;
      }

      if (name === "meterScope") {
        setFormData((prev) => ({
          ...prev,
          meterScope: value,
          flatId: value === "Personal" ? prev.flatId : undefined,
        }));
        return;
      }

      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const validate = (): boolean => {
      if (!formData.apartmentId) {
        window.alert("Please select Apartment.");
        return false;
      }
      if (!formData.meterNumber.trim()) {
        window.alert("Please enter Meter Number.");
        return false;
      }
      if (!formData.utilityType) {
        window.alert("Please select Utility Type.");
        return false;
      }
      if (!formData.meterScope) {
        window.alert("Please select Meter Scope.");
        return false;
      }

      if (formData.meterScope === "Personal" && !formData.flatId) {
        window.alert("Please select Flat for Personal meter scope.");
        return false;
      }

      if (!formData.isActive && !formData.deactivationReason.trim()) {
        window.alert("Please provide Deactivation Reason when meter is inactive.");
        return false;
      }

      return true;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (formRef.current && !formRef.current.checkValidity()) {
        formRef.current.reportValidity();
        return;
      }

      if (!validate()) return;

      setIsSubmitting(true);
      try {
        const userId = parseInt(localStorage.getItem("userId") || "0", 10);

        const payload = {
          meterId: formData.meterId,
          apartmentId: formData.apartmentId!,
          flatId: formData.flatId ?? null,

          meterNumber: formData.meterNumber.trim(),
          utilityType: formData.utilityType,
          meterScope: formData.meterScope,

          installationDate: formData.installationDate ? formData.installationDate : null,
          lastVerifiedDate: formData.lastVerifiedDate ? formData.lastVerifiedDate : null,

          isActive: formData.isActive,
          isSmartMeter: formData.isSmartMeter,

          manufacturer: formData.manufacturer.trim() || null,
          model: formData.model.trim() || null,
          serialNumber: formData.serialNumber.trim() || null,
          readingUnit: formData.readingUnit.trim() || null,
          locationDescription: formData.locationDescription.trim() || null,

          installationBy: formData.installationBy.trim() || null,
          verifiedBy: formData.verifiedBy.trim() || null,
          verificationStatus: formData.verificationStatus || null,
          verificationRemarks: formData.verificationRemarks.trim() || null,

          phaseType: formData.phaseType || null,
          deactivationReason: formData.deactivationReason.trim() || null,
        };

        if (isEdit && meterId) {
          await updateEntity(endpoints.update, meterId, payload, userId, false);
          await showAddUpdateResult(true, "update", "meter");
          navigate(parentListPath);
          return;
        }

        await createEntity(endpoints.add, payload, userId, false);
        await showAddUpdateResult(true, "add", "meter");

        if (submitMode === "saveAndNext") {
          setFormData((prev) => {
            const next: FormState = {
              ...emptyForm,
              apartmentId: prev.apartmentId,
              utilityType: prev.utilityType,
              meterScope: prev.meterScope,
            };
            initialRef.current = { ...next };
            return next;
          });
        } else {
          navigate(parentListPath);
        }
      } catch (err) {
        console.error(err);
        await showAddUpdateResult(false, "error", "meter");
      } finally {
        setIsSubmitting(false);
        setSubmitMode("save");
      }
    };

    const handleReset = () => {
      const val = initialRef.current ?? emptyForm;
      setFormData({ ...val });
    };

    const handleSaveAndNext = () => {
      setSubmitMode("saveAndNext");
      formRef.current?.requestSubmit();
    };

    React.useImperativeHandle(ref, () => ({
      submit: () => {
        setSubmitMode("save");
        formRef.current?.requestSubmit();
      },
      reset: handleReset,
      saveAndNext: handleSaveAndNext,
    }));

    return (
      <SharedAddEditForm
        isSubmitting={isSubmitting}
        hasUnsavedChanges={hasUnsavedChanges}
        onSubmit={handleSubmit}
        onReset={handleReset}
        onSaveAndNext={handleSaveAndNext}
        isEditMode={isEdit}
        formRef={formRef}
      >
        <div className="row g-4">
          <div className="col-12">
            <SectionCard title="Meter Details">
              <div className="row g-3">
                <div className="col-md-6">
                  <SelectField
                    label="Apartment"
                    name="apartmentId"
                    value={formData.apartmentId ?? ""}
                    onChange={handleChange}
                    required
                    disabled={isEdit}
                    options={apartmentOptions}
                  />
                </div>

                <div className="col-md-6">
                  <TextInputField
                    label="Meter Number"
                    name="meterNumber"
                    value={formData.meterNumber}
                    onChange={handleChange}
                    required
                    placeholder="Enter Meter Number"
                  />
                </div>

                <div className="col-md-4">
                  <SelectField
                    label="Utility Type"
                    name="utilityType"
                    value={formData.utilityType}
                    onChange={handleChange}
                    required
                    options={utilityOptions}
                  />
                </div>

                <div className="col-md-4">
                  <SelectField
                    label="Meter Scope"
                    name="meterScope"
                    value={formData.meterScope}
                    onChange={handleChange}
                    required
                    options={scopeOptions}
                  />
                </div>

                <div className="col-md-4">
                  <SelectField
                    label="Flat No. & Owner"
                    name="flatId"
                    value={formData.flatId ?? ""}
                    onChange={handleChange}
                    disabled={isEdit || formData.meterScope !== "Personal"}
                    options={flatOwnerOptions}
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="col-12">
            <SectionCard title="Status">
              <div className="row g-3">
                <div className="col-md-6">
                  <SwitchTile
                    id="meter-switch-isActive"
                    name="isActive"
                    label="Active"
                    checked={!!formData.isActive}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <SwitchTile
                    id="meter-switch-isSmartMeter"
                    name="isSmartMeter"
                    label="Smart Meter"
                    checked={!!formData.isSmartMeter}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="col-12">
            <SectionCard title="Dates">
              <div className="row g-3">
                <div className="col-md-6">
                  <DateInput
                    id="installationDate"
                    label="Installation Date"
                    value={formData.installationDate}
                    onChange={(v) =>
                      setFormData((p) => ({ ...p, installationDate: v }))
                    }
                    allowClear
                  />
                </div>

                <div className="col-md-6">
                  <DateInput
                    id="lastVerifiedDate"
                    label="Last Verified Date"
                    value={formData.lastVerifiedDate}
                    onChange={(v) =>
                      setFormData((p) => ({ ...p, lastVerifiedDate: v }))
                    }
                    allowClear
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="col-12">
            <SectionCard title="Technical & Verification">
              <div className="row g-3">
                <div className="col-md-4">
                  <TextInputField
                    label="Manufacturer"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-4">
                  <TextInputField
                    label="Model"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-4">
                  <TextInputField
                    label="Serial Number"
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-4">
                  <TextInputField
                    label="Reading Unit"
                    name="readingUnit"
                    value={formData.readingUnit}
                    onChange={handleChange}
                    placeholder="e.g. kWh"
                  />
                </div>

                <div className="col-md-4">
                  <SelectField
                    label="Phase Type"
                    name="phaseType"
                    value={formData.phaseType}
                    onChange={handleChange}
                    options={phaseOptions}
                  />
                </div>

                <div className="col-md-4">
                  <SelectField
                    label="Verification Status"
                    name="verificationStatus"
                    value={formData.verificationStatus}
                    onChange={handleChange}
                    options={verificationStatusOptions}
                  />
                </div>

                <div className="col-md-6">
                  <TextInputField
                    label="Installed By"
                    name="installationBy"
                    value={formData.installationBy}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <TextInputField
                    label="Verified By"
                    name="verifiedBy"
                    value={formData.verifiedBy}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <TextInputField
                    label="Location Description"
                    name="locationDescription"
                    value={formData.locationDescription}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <TextInputField
                    label="Verification Remarks"
                    name="verificationRemarks"
                    value={formData.verificationRemarks}
                    onChange={handleChange}
                  />
                </div>

                {!formData.isActive && (
                  <div className="col-md-12">
                    <TextInputField
                      label="Deactivation Reason"
                      name="deactivationReason"
                      value={formData.deactivationReason}
                      onChange={handleChange}
                    />
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      </SharedAddEditForm>
    );
  }
);

export default AddEditMeter;