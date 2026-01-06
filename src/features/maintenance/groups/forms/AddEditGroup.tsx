// src/features/maintenance/groups/forms/AddEditGroup.tsx
import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createEntity,
  fetchAllEntities,
  fetchEntityById,
  updateEntity,
} from "../../../../api/genericCrudApi";
import SelectField from "../../../../components/common/SelectField";
import DateInput from "../../../../components/common/DateInput";
import SharedAddEditForm from "../../../shared/SharedAddEditForm";
import type { AddEditFormHandle } from "../../../shared/SharedAddEditForm";
import { showAddUpdateResult } from "../../../../utils/alerts/showAddUpdateConfirmation";
import { useCurrentMenu } from "../../../../hooks/useCurrentMenu";

import type { ApartmentDTO } from "../../../../types/ApartmentDTO";

const endpoints = {
  apartments: "/apartment/Get-All-Apartment",
  getById: "/maintenancegroup/Get-MaintenanceGroup-By-Id",
  add: "/maintenancegroup/Create-New-MaintenanceGroup",
  update: "/maintenancegroup/Update-MaintenanceGroup-By-Id",
};

type SubmitMode = "save" | "saveAndNext";

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

type SwitchTileProps = {
  id: string;
  name: "isActive";
  label: string;
  checked: boolean;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
};

const SwitchTile = ({
  id,
  name,
  label,
  checked,
  onChange,
}: SwitchTileProps) => {
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

type ReadOnlyTextFieldProps = {
  label: string;
  value: string;
  helperText?: string;
};

const ReadOnlyTextField = ({
  label,
  value,
  helperText,
}: ReadOnlyTextFieldProps) => {
  const controlMinHeight = 38;

  return (
    <div className="d-flex flex-column w-100">
      <label className="form-label fw-semibold mb-2">{label}</label>

      <div
        className="form-control rounded-3 bg-white"
        style={{
          minHeight: controlMinHeight,
          display: "flex",
          alignItems: "center",
        }}
      >
        {value}
      </div>

      {helperText ? <div className="form-text">{helperText}</div> : null}
    </div>
  );
};

const toYmd = (d?: string | Date | null): string | undefined => {
  if (!d) return undefined;
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
};

const ymdToday = () => toYmd(new Date())!;

const sanitizeDecimal2 = (raw: string): string => {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const [intPart, ...rest] = cleaned.split(".");
  const decimals = rest.join("");
  const limited = decimals.slice(0, 2);

  if (rest.length === 0) return intPart;
  return `${intPart}.${limited}`;
};

type FormState = {
  maintenanceGroupId: number;
  apartmentId?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  totalCharge: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  maintenanceGroupId: 0,
  apartmentId: undefined,
  effectiveFrom: ymdToday(),
  effectiveTo: undefined,
  totalCharge: "0.00",
  isActive: true,
};

interface Props {
  maintenanceGroupId?: number;
  onUnsavedChange?: (changed: boolean) => void;
}

const numericFieldNames = new Set(["apartmentId"]);

const AddEditGroup = forwardRef<AddEditFormHandle, Props>(
  ({ maintenanceGroupId, onUnsavedChange }, ref) => {
    const navigate = useNavigate();
    const { parentListPath } = useCurrentMenu();
    const isEdit = !!maintenanceGroupId;

    const [formData, setFormData] = useState<FormState>(emptyForm);
    const [apartments, setApartments] = useState<ApartmentDTO[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMode, setSubmitMode] = useState<SubmitMode>("save");

    const formRef = useRef<HTMLFormElement>(null);
    const initialRef = useRef<FormState | null>(null);

    useEffect(() => {
      fetchAllEntities<ApartmentDTO>(endpoints.apartments)
        .then((res) => setApartments(Array.isArray(res) ? res : []))
        .catch((err) => {
          console.error("❌ Failed to load apartments:", err);
          setApartments([]);
        });
    }, []);

    useEffect(() => {
      const load = async () => {
        if (!maintenanceGroupId) {
          setFormData(emptyForm);
          initialRef.current = { ...emptyForm };
          return;
        }

        const data = await fetchEntityById<{
          maintenanceGroupId: number;
          apartmentId: number;
          effectiveFrom: string;
          effectiveTo?: string | null;
          totalCharge: number;
          isActive: boolean;
        }>(endpoints.getById, maintenanceGroupId);

        const mapped: FormState = {
          maintenanceGroupId: data.maintenanceGroupId ?? maintenanceGroupId,
          apartmentId: data.apartmentId ?? undefined,
          effectiveFrom: toYmd(data.effectiveFrom),
          effectiveTo: toYmd(data.effectiveTo ?? null),

          totalCharge:
            data.totalCharge === null || data.totalCharge === undefined
              ? "0.00"
              : String(data.totalCharge),

          isActive: Boolean(data.isActive),
        };

        setFormData(mapped);
        initialRef.current = { ...mapped };
      };

      void load();
    }, [maintenanceGroupId]);

    const hasUnsavedChanges = useMemo(() => {
      if (!initialRef.current) return false;
      return (Object.keys(formData) as (keyof FormState)[]).some(
        (k) => formData[k] !== initialRef.current![k]
      );
    }, [formData]);

    useEffect(() => {
      onUnsavedChange?.(hasUnsavedChanges);
    }, [hasUnsavedChanges, onUnsavedChange]);

    const apartmentOptions = useMemo(() => {
      return apartments
        .filter((a) => a.apartmentId !== undefined && a.apartmentId !== null)
        .map((a) => ({
          label: a.apartmentName ?? `Apartment #${a.apartmentId}`,
          value: a.apartmentId!,
        }));
    }, [apartments]);

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

      if (numericFieldNames.has(name)) {
        setFormData((prev) => ({
          ...prev,
          [name]: value === "" ? undefined : Number(value),
        }));
        return;
      }

      if (name === "totalCharge") {
        return;
      }

      // (kept for safety; not used now, but harmless if future fields reuse)
      if (name === "decimalPlaceholder") {
        setFormData((prev) => ({
          ...prev,
          totalCharge: sanitizeDecimal2(value),
        }));
        return;
      }

      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const validateDates = (): boolean => {
      if (!formData.effectiveFrom) return true;

      if (formData.effectiveTo) {
        const from = new Date(formData.effectiveFrom);
        const to = new Date(formData.effectiveTo);
        if (!isNaN(from.getTime()) && !isNaN(to.getTime()) && to < from) {
          window.alert("Effective To cannot be before Effective From.");
          return false;
        }
      }
      return true;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (formRef.current && !formRef.current.checkValidity()) {
        formRef.current.reportValidity();
        return;
      }

      if (!validateDates()) return;

      if (!formData.apartmentId) {
        window.alert("Apartment is required.");
        return;
      }

      const totalChargeNumber = (() => {
        const raw = formData.totalCharge.trim();
        if (raw.length === 0) return 0;
        const num = Number(raw);
        return Number.isFinite(num) ? num : 0;
      })();

      setIsSubmitting(true);
      try {
        const userId = parseInt(localStorage.getItem("userId") || "0", 10);

        const payload = {
          maintenanceGroupId: formData.maintenanceGroupId,
          apartmentId: formData.apartmentId,
          effectiveFrom: formData.effectiveFrom,
          effectiveTo: formData.effectiveTo ?? null,
          totalCharge: totalChargeNumber,
          isActive: formData.isActive,
        };

        if (isEdit && maintenanceGroupId) {
          await updateEntity(
            endpoints.update,
            maintenanceGroupId,
            payload,
            userId,
            false
          );
          await showAddUpdateResult(true, "update", "maintenance group");
        } else {
          await createEntity(endpoints.add, payload, userId, false);
          await showAddUpdateResult(true, "add", "maintenance group");
        }

        if (!isEdit && submitMode === "saveAndNext") {
          setFormData((prev) => ({
            ...emptyForm,
            apartmentId: prev.apartmentId,
            isActive: true,
            effectiveFrom: ymdToday(),
          }));
          initialRef.current = { ...emptyForm };
        } else {
          navigate(parentListPath);
        }
      } catch (err) {
        console.error(err);
        await showAddUpdateResult(false, "error", "maintenance group");
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
            <SectionCard title="Group Details">
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
                  <SwitchTile
                    id="maintenancegroup-switch-isActive"
                    name="isActive"
                    label="Active"
                    checked={!!formData.isActive}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-3">
                  <DateInput
                    id="effectiveFrom"
                    label="Effective From"
                    value={formData.effectiveFrom ?? ""}
                    onChange={(newDate) =>
                      setFormData((prev) => ({
                        ...prev,
                        effectiveFrom: newDate,
                      }))
                    }
                    required
                  />
                </div>

                <div className="col-md-3">
                  <DateInput
                    id="effectiveTo"
                    label="Effective To"
                    value={formData.effectiveTo ?? ""}
                    onChange={(newDate) =>
                      setFormData((prev) => ({
                        ...prev,
                        effectiveTo: newDate || undefined,
                      }))
                    }
                    required
                  />
                </div>

                <div className="col-md-6">
                  <ReadOnlyTextField
                    label="Total Charge"
                    value={formData.totalCharge}
                    helperText="Total Charge is auto-calculated from Maintenance Group Components."
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

export default AddEditGroup;
