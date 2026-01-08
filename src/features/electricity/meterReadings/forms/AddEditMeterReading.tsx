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

import SectionCard from "../../../../components/SectionCard";
import SwitchTile from "../../../../components/SwitchTile";

import type { MeterReadingDTO } from "../../../../types/MeterReadingDTO";
import type { ReadingTypeDTO } from "../../../../types/ReadingTypeDTO";

import { showAddUpdateResult } from "../../../../utils/alerts/showAddUpdateConfirmation";
import { normalizeToYmd } from "../../../../utils/format";
import { toNullableNumber } from "../../../../utils/formValueUtils";
import { useCurrentMenu } from "../../../../hooks/useCurrentMenu";

type SubmitMode = "save" | "saveAndNext";

/**
 * Keep lookup type local so we don't depend on MeterDTO shape.
 * Only what we need for dropdown.
 */
type MeterLookup = {
  meterId: number;
  meterNumber?: string | null;
  isActive?: boolean;
};

type FormState = {
  meterReadingId: number;

  meterId?: number;

  readingDate: string;
  readingValue: string;

  isEstimated: boolean;
  readingTypeId?: number;

  billingFromDate: string;
  billingToDate: string;

  notes: string;

  isActive: boolean;
};

const emptyForm: FormState = {
  meterReadingId: 0,
  meterId: undefined,

  readingDate: "",
  readingValue: "",

  isEstimated: false,
  readingTypeId: undefined,

  billingFromDate: "",
  billingToDate: "",

  notes: "",

  isActive: true,
};

const createEmptyForm = (): FormState => ({ ...emptyForm });

interface Props {
  meterReadingId?: number;
  onUnsavedChange?: (changed: boolean) => void;
}

const normalizeYmdSafe = (raw: unknown): string => {
  if (typeof raw === "string" || raw instanceof Date || raw == null) {
    const ymd = normalizeToYmd(raw);
    if (!ymd || ymd.length < 10) return "";

    const year = Number(ymd.slice(0, 4));
    if (!Number.isFinite(year) || year < 1900 || year > 2099) return "";
    return ymd;
  }

  return "";
};

//Billing period auto-derive helpers (ReadingDate -> BillingFrom/BillingTo)
const pad2 = (n: number) => String(n).padStart(2, "0");

const getBillingPeriodFromReadingDate = (readingYmd: string): { from: string; to: string } => {
  if (!readingYmd || readingYmd.length < 10) return { from: "", to: "" };

  const y = Number(readingYmd.slice(0, 4));
  const m = Number(readingYmd.slice(5, 7));
  const d = Number(readingYmd.slice(8, 10));

  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return { from: "", to: "" };
  if (m < 1 || m > 12 || d < 1 || d > 31) return { from: "", to: "" };

  let billYear = y;
  let billMonth = m;

  // If reading is done 1st week of month => treat as previous month
  if (d <= 7) {
    billMonth -= 1;
    if (billMonth === 0) {
      billMonth = 12;
      billYear -= 1;
    }
  }

  const from = `${billYear}-${pad2(billMonth)}-01`;

  // last day of billMonth
  const lastDay = new Date(billYear, billMonth, 0).getDate(); // month param is 1-based here intentionally
  const to = `${billYear}-${pad2(billMonth)}-${pad2(lastDay)}`;

  return { from, to };
};

const AddEditMeterReading = forwardRef<AddEditFormHandle, Props>(
  ({ meterReadingId, onUnsavedChange }, ref) => {
    const navigate = useNavigate();
    const { parentListPath } = useCurrentMenu();

    const isEdit = !!meterReadingId;

    const ENDPOINTS = useMemo(
      () => ({
        getById: "/meterreading/Get-MeterReading-By-Id",
        add: "/meterreading/Add-New-MeterReading",
        update: "/meterreading/Update-MeterReading-By-Id",

        // ✅ update these two only if your actual endpoints differ
        meters: "/meter/Get-All-Meters",
        readingTypes: "/meterreading/Get-All-ReadingTypes",
      }),
      []
    );

    const [formData, setFormData] = useState<FormState>(() => createEmptyForm());
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitModeRef = useRef<SubmitMode>("save");
    const setSubmitModeSafe = (mode: SubmitMode) => {
      submitModeRef.current = mode;
    };

    const [meters, setMeters] = useState<MeterLookup[]>([]);
    const [readingTypes, setReadingTypes] = useState<ReadingTypeDTO[]>([]);

    const formRef = useRef<HTMLFormElement>(null);
    const initialRef = useRef<FormState | null>(null);

    useEffect(() => {
      const loadLookups = async () => {
        try {
          const m = await fetchAllEntities<MeterLookup>(ENDPOINTS.meters);
          setMeters(Array.isArray(m) ? m : []);
        } catch {
          setMeters([]);
        }

        try {
          const rt = await fetchAllEntities<ReadingTypeDTO>(ENDPOINTS.readingTypes);
          setReadingTypes(Array.isArray(rt) ? rt : []);
        } catch {
          setReadingTypes([]);
        }
      };

      void loadLookups();
    }, [ENDPOINTS.meters, ENDPOINTS.readingTypes]);

    useEffect(() => {
      const load = async () => {
        if (!meterReadingId) {
          const fresh = createEmptyForm();
          setFormData(fresh);
          initialRef.current = { ...fresh };
          return;
        }

        const data = await fetchEntityById<MeterReadingDTO>(ENDPOINTS.getById, meterReadingId);

        const readingDate = normalizeYmdSafe(data.readingDate);

        // Always derive billing period from reading date (readonly UI)
        const derived = getBillingPeriodFromReadingDate(readingDate);

        const mapped: FormState = {
          ...emptyForm,
          meterReadingId: data.meterReadingId ?? meterReadingId,
          meterId: data.meterId,

          readingDate,
          readingValue: data.readingValue == null ? "" : String(data.readingValue),

          isEstimated: Boolean(data.isEstimated),
          readingTypeId: data.readingTypeId ?? undefined,

          // use derived billing dates
          billingFromDate: derived.from,
          billingToDate: derived.to,

          notes: data.notes == null ? "" : String(data.notes),

          isActive: Boolean(data.isActive),
        };

        setFormData(mapped);
        initialRef.current = { ...mapped };
      };

      void load();
    }, [meterReadingId, ENDPOINTS.getById]);

    const hasUnsavedChanges = useMemo(() => {
      if (!initialRef.current) return false;
      return (Object.keys(formData) as (keyof FormState)[]).some(
        (k) => formData[k] !== initialRef.current![k]
      );
    }, [formData]);

    useEffect(() => {
      onUnsavedChange?.(hasUnsavedChanges);
    }, [hasUnsavedChanges, onUnsavedChange]);

    const meterOptions = useMemo(
      () =>
        meters
          .filter((x) => x.isActive !== false)
          .map((m) => ({
            value: m.meterId,
            label: String(m.meterNumber ?? "").trim() || `Meter #${m.meterId}`,
          })),
      [meters]
    );

    const readingTypeOptions = useMemo(
      () =>
        readingTypes.map((t) => ({
          value: t.readingTypeId,
          label: String(t.typeName ?? "").trim(),
        })),
      [readingTypes]
    );

    const sanitizeDecimalText = (raw: string, maxDecimals: number): string => {
      const cleaned = raw.replace(/[^\d.]/g, "");
      const [intRaw = "", ...rest] = cleaned.split(".");
      if (rest.length === 0) return intRaw;

      const decRaw = rest.join("");
      const dec = decRaw.slice(0, maxDecimals);

      const intPart = intRaw === "" ? "0" : intRaw;
      return dec.length > 0 ? `${intPart}.${dec}` : `${intPart}.`;
    };

    type ValidityEl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

    const isValidityEl = (el: Element | null): el is ValidityEl =>
      el instanceof HTMLInputElement ||
      el instanceof HTMLSelectElement ||
      el instanceof HTMLTextAreaElement;

    const getById = (id: string): ValidityEl | null => {
      const el = document.getElementById(id);
      return isValidityEl(el) ? el : null;
    };

    const getByName = (name: string): ValidityEl | null => {
      const el = formRef.current?.querySelector(`[name="${name}"]`) ?? null;
      return isValidityEl(el) ? el : null;
    };

    const clearValidity = (el: ValidityEl | null) => {
      if (el) el.setCustomValidity("");
    };

    const showValidityError = (el: ValidityEl | null, message: string): boolean => {
      if (!el) return false;
      el.setCustomValidity(message);
      el.reportValidity();
      el.focus();
      return true;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const target = e.currentTarget;
      const { name, value } = target;

      if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) {
        target.setCustomValidity("");
      }

      if (target instanceof HTMLInputElement && target.type === "checkbox") {
        setFormData((prev) => ({ ...prev, [name]: target.checked }));
        return;
      }

      if (name === "readingValue") {
        setFormData((prev) => ({
          ...prev,
          readingValue: sanitizeDecimalText(value, 4),
        }));
        return;
      }

      const intFields = new Set(["meterId", "readingTypeId"]);
      if (intFields.has(name)) {
        setFormData((prev) => ({
          ...prev,
          [name]: value ? Number(value) : undefined,
        }));
        return;
      }

      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const validate = (): boolean => {
      clearValidity(getByName("meterId"));
      clearValidity(getById("meterReading-readingDate"));
      clearValidity(getByName("readingValue"));

      clearValidity(getById("meterReading-billingFromDate"));
      clearValidity(getById("meterReading-billingToDate"));

      clearValidity(getByName("notes"));

      if (!formData.meterId) {
        showValidityError(getByName("meterId"), "Please select Meter.");
        return false;
      }

      if (!formData.readingDate) {
        showValidityError(getById("meterReading-readingDate"), "Please fill out this field.");
        return false;
      }

      const readingVal = toNullableNumber(formData.readingValue);
      if (readingVal === null) {
        showValidityError(getByName("readingValue"), "Please enter Reading Value.");
        return false;
      }

      if (readingVal < 0) {
        showValidityError(getByName("readingValue"), "Reading Value cannot be negative.");
        return false;
      }

      if (readingVal > 99999999.9999) {
        showValidityError(getByName("readingValue"), "Reading Value is too large.");
        return false;
      }

      // Billing period should always be derived, but keep guard anyway
      if (!formData.billingFromDate) {
        showValidityError(getById("meterReading-billingFromDate"), "Please fill out this field.");
        return false;
      }

      if (!formData.billingToDate) {
        showValidityError(getById("meterReading-billingToDate"), "Please fill out this field.");
        return false;
      }

      if (formData.billingToDate < formData.billingFromDate) {
        showValidityError(
          getById("meterReading-billingToDate"),
          "Billing-To-Date must be greater than or equal to Billing-From-Date."
        );
        return false;
      }

      if (formData.notes && formData.notes.length > 255) {
        showValidityError(getByName("notes"), "Notes cannot exceed 255 characters.");
        return false;
      }

      return true;
    };

    const buildPayload = (): MeterReadingDTO => ({
      meterReadingId: formData.meterReadingId || undefined,
      meterId: formData.meterId ?? 0,

      readingDate: formData.readingDate,
      readingValue: toNullableNumber(formData.readingValue) ?? 0,

      isEstimated: formData.isEstimated,
      readingTypeId: formData.readingTypeId ?? null,

      billingFromDate: formData.billingFromDate,
      billingToDate: formData.billingToDate,

      notes: formData.notes ? formData.notes.trim() : null,

      isModifiedOnce: undefined,
      isActive: formData.isActive,
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // remove native browser validity (we use custom validity everywhere)
      if (!validate()) return;

      setIsSubmitting(true);
      try {
        const userId = parseInt(localStorage.getItem("userId") || "0", 10);
        const payload = buildPayload();

        if (isEdit && meterReadingId) {
          await updateEntity(ENDPOINTS.update, meterReadingId, payload, userId, false);
          await showAddUpdateResult(true, "update", "meter reading");
          navigate(parentListPath);
          return;
        }

        await createEntity(ENDPOINTS.add, payload, userId, false);
        await showAddUpdateResult(true, "add", "meter reading");

        const mode = submitModeRef.current;

        if (mode === "saveAndNext") {
          setFormData((prev) => {
            const next: FormState = {
              ...createEmptyForm(),
              meterId: prev.meterId,
              readingTypeId: prev.readingTypeId,
            };
            initialRef.current = { ...next };
            return next;
          });
        } else {
          navigate(parentListPath);
        }
      } catch (err) {
        console.error(err);
        await showAddUpdateResult(false, "error", "meter reading");
      } finally {
        setIsSubmitting(false);
        submitModeRef.current = "save";
        setSubmitModeSafe("save");
      }
    };

    const handleReset = () => {
      setFormData({ ...(initialRef.current ?? createEmptyForm()) });
    };

    const handleSaveAndNext = () => {
      setSubmitModeSafe("saveAndNext");
      formRef.current?.requestSubmit();
    };

    React.useImperativeHandle(ref, () => ({
      submit: () => {
        setSubmitModeSafe("save");
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
            <SectionCard title="Meter Reading Details">
              <div className="row g-3">
                <div className="col-md-6">
                  <SelectField
                    label="Meter"
                    name="meterId"
                    value={formData.meterId ?? ""}
                    onChange={handleChange}
                    required
                    options={meterOptions}
                  />
                </div>

                <div className="col-md-6">
                  <DateInput
                    id="meterReading-readingDate"
                    label="Reading Date"
                    value={formData.readingDate}
                    onChange={(v) => {
                      // Derive billing period from reading date
                      clearValidity(getById("meterReading-readingDate"));
                      clearValidity(getById("meterReading-billingFromDate"));
                      clearValidity(getById("meterReading-billingToDate"));

                      const derived = getBillingPeriodFromReadingDate(v);
                      setFormData((prev) => ({
                        ...prev,
                        readingDate: v,
                        billingFromDate: derived.from,
                        billingToDate: derived.to,
                      }));
                    }}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <TextInputField
                    label="Reading Value"
                    name="readingValue"
                    value={formData.readingValue}
                    onChange={handleChange}
                    inputMode="decimal"
                    placeholder="e.g. 123.4567"
                  />
                </div>

                <div className="col-md-6">
                  <SelectField
                    label="Reading Type (Optional)"
                    name="readingTypeId"
                    value={formData.readingTypeId ?? ""}
                    onChange={handleChange}
                    options={readingTypeOptions}
                  />
                </div>

                <div className="col-md-6">
                  <SwitchTile
                    id="meterReading-isEstimated"
                    name="isEstimated"
                    label="Estimated"
                    checked={formData.isEstimated}
                    onChange={(e) => {
                      const t = e.currentTarget;
                      if (t instanceof HTMLInputElement) {
                        setFormData((prev) => ({
                          ...prev,
                          isEstimated: t.checked,
                        }));
                      }
                    }}
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="col-12">
            <SectionCard title="Billing Period">
              <div className="row g-3">
                <div className="col-md-6 position-relative">
                  <DateInput
                    id="meterReading-billingFromDate"
                    label="Billing From"
                    value={formData.billingFromDate}
                    onChange={() => {}}
                    required
                  />
                  <div
                    className="position-absolute top-0 start-0 w-100 h-100"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => e.preventDefault()}
                    style={{ cursor: "default" }}
                  />
                </div>

                <div className="col-md-6 position-relative">
                  <DateInput
                    id="meterReading-billingToDate"
                    label="Billing To"
                    value={formData.billingToDate}
                    onChange={() => {}}
                    required
                  />
                  <div
                    className="position-absolute top-0 start-0 w-100 h-100"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => e.preventDefault()}
                    style={{ cursor: "default" }}
                  />
                </div>

                <div className="col-12">
                  <TextInputField
                    label="Notes (Optional)"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="col-12">
            <SectionCard title="Status">
              <div className="row g-3">
                <div className="col-md-12">
                  <SwitchTile
                    id="meterReading-isActive"
                    name="isActive"
                    label="Active"
                    checked={formData.isActive}
                    onChange={(e) => {
                      const t = e.currentTarget;
                      if (t instanceof HTMLInputElement) {
                        setFormData((prev) => ({
                          ...prev,
                          isActive: t.checked,
                        }));
                      }
                    }}
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

export default AddEditMeterReading;