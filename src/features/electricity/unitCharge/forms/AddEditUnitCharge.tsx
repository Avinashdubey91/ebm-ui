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

import MonthPickerField from "../../../../components/common/MonthPickerField";
import TimePickerField from "../../../../components/common/TimePickerField";

import SectionCard from "../../../../components/SectionCard";
import SwitchTile from "../../../../components/SwitchTile";

import type { UnitChargeDTO } from "../../../../types/UnitChargeDTO";
import type { CurrencyDTO } from "../../../../types/CurrencyDTO";
import type { RateTypeDTO } from "../../../../types/RateTypeDTO";

import { showAddUpdateResult } from "../../../../utils/alerts/showAddUpdateConfirmation";
import { normalizeToYmd } from "../../../../utils/format";
import {
  toNullableNumber,
  hhmmToTimeSpan,
} from "../../../../utils/formValueUtils";
import { useCurrentMenu } from "../../../../hooks/useCurrentMenu";

type SubmitMode = "save" | "saveAndNext";

type FormState = {
  unitChargeId: number;

  effectiveFrom: string;
  effectiveTo: string;
  chargePerUnit: string;

  currencyId?: number;
  rateTypeId?: number;

  minUnit?: number;
  maxUnit?: number;

  threshold: string;
  subsidizedFlag: boolean;

  peakDemandMultiplier: string;
  baseRate: string;
  tieredRate: string;

  applicableMonthFrom: string;
  applicableMonthTo: string;

  fromHour: string;
  toHour: string;

  isActive: boolean;
};

const emptyForm: FormState = {
  unitChargeId: 0,
  effectiveFrom: "",
  effectiveTo: "",
  chargePerUnit: "",
  currencyId: undefined,
  rateTypeId: undefined,
  minUnit: undefined,
  maxUnit: undefined,
  threshold: "",
  subsidizedFlag: false,
  peakDemandMultiplier: "",
  baseRate: "",
  tieredRate: "",
  applicableMonthFrom: "",
  applicableMonthTo: "",
  fromHour: "",
  toHour: "",
  isActive: true,
};

const pad2 = (n: number) => String(n).padStart(2, "0");

const getDefaultMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return {
    from: `${year}-${pad2(month)}`,
    to: `${year}-12`,
  };
};

const createEmptyForm = (): FormState => {
  const def = getDefaultMonthRange();
  return {
    ...emptyForm,
    applicableMonthFrom: def.from,
    applicableMonthTo: def.to,
    fromHour: "00:00:00",
    toHour: "23:59:00",
  };
};

interface Props {
  unitChargeId?: number;
  onUnsavedChange?: (changed: boolean) => void;
}

const normalizeEffectiveFrom = (raw: unknown): string => {
  if (typeof raw === "string" || raw instanceof Date || raw == null) {
    const ymd = normalizeToYmd(raw);
    if (!ymd || ymd.length < 10) return "";

    const year = Number(ymd.slice(0, 4));
    if (!Number.isFinite(year) || year < 1900 || year > 2099) return "";
    return ymd;
  }

  return "";
};

const safeYearForMonthPicker = (effectiveFromYmd?: string): number => {
  if (!effectiveFromYmd) return new Date().getFullYear();
  const year = Number(effectiveFromYmd.slice(0, 4));
  if (!Number.isFinite(year) || year < 1900 || year > 2099)
    return new Date().getFullYear();
  return year;
};

const monthByteToMonthInput = (
  monthByte?: number | null,
  effectiveFromYmd?: string
): string => {
  if (!monthByte || monthByte < 1 || monthByte > 12) return "";
  const year = safeYearForMonthPicker(effectiveFromYmd);
  const mm = String(monthByte).padStart(2, "0");
  return `${year}-${mm}`;
};

const monthInputToMonthByte = (value: string): number | null => {
  if (!value) return null;
  const parts = value.split("-");
  if (parts.length !== 2) return null;

  const m = Number(parts[1]);
  if (!Number.isFinite(m) || m < 1 || m > 12) return null;
  return m;
};

const parseMonthInput = (
  value: string
): { year: number; month: number } | null => {
  if (!value) return null;
  const [yStr, mStr] = value.split("-");
  const year = Number(yStr);
  const month = Number(mStr);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
  return { year, month };
};

const AddEditUnitCharge = forwardRef<AddEditFormHandle, Props>(
  ({ unitChargeId, onUnsavedChange }, ref) => {
    const navigate = useNavigate();
    const { parentListPath } = useCurrentMenu();

    const isEdit = !!unitChargeId;

    const ENDPOINTS = useMemo(
      () => ({
        getById: "/unitcharge/Get-UnitCharge-By-Id",
        add: "/unitcharge/Add-New-UnitCharge",
        update: "/unitcharge/Update-Existing-UnitCharge",
        currencies: "/unitcharge/Get-All-Currencies",
        rateTypes: "/unitcharge/Get-All-RateTypes",
      }),
      []
    );

    const [formData, setFormData] = useState<FormState>(() =>
      createEmptyForm()
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const submitModeRef = useRef<SubmitMode>("save");
    const setSubmitModeSafe = (mode: SubmitMode) => {
      submitModeRef.current = mode;
    };

    const [currencies, setCurrencies] = useState<CurrencyDTO[]>([]);
    const [rateTypes, setRateTypes] = useState<RateTypeDTO[]>([]);

    const formRef = useRef<HTMLFormElement>(null);

    const initialRef = useRef<FormState | null>(null);

    useEffect(() => {
      const loadLookups = async () => {
        try {
          const cur = await fetchAllEntities<CurrencyDTO>(ENDPOINTS.currencies);
          setCurrencies(Array.isArray(cur) ? cur : []);
        } catch {
          setCurrencies([]);
        }

        try {
          const rt = await fetchAllEntities<RateTypeDTO>(ENDPOINTS.rateTypes);
          setRateTypes(Array.isArray(rt) ? rt : []);
        } catch {
          setRateTypes([]);
        }
      };

      void loadLookups();
    }, [ENDPOINTS.currencies, ENDPOINTS.rateTypes]);

    useEffect(() => {
      const load = async () => {
        if (!unitChargeId) {
          const fresh = createEmptyForm();
          setFormData(fresh);
          initialRef.current = { ...fresh };
          return;
        }

        const data = await fetchEntityById<UnitChargeDTO>(
          ENDPOINTS.getById,
          unitChargeId
        );

        const effectiveFrom = normalizeEffectiveFrom(data.effectiveFrom);
        const effectiveTo = normalizeEffectiveFrom(data.effectiveTo);

        const mapped: FormState = {
          ...emptyForm,
          unitChargeId: data.unitChargeId ?? unitChargeId,

          effectiveFrom,
          effectiveTo,
          chargePerUnit:
            data.chargePerUnit == null ? "" : String(data.chargePerUnit),

          currencyId: data.currencyId ?? undefined,
          rateTypeId: data.rateTypeId ?? undefined,

          minUnit: data.minUnit ?? undefined,
          maxUnit: data.maxUnit ?? undefined,

          threshold: data.threshold == null ? "" : String(data.threshold),
          subsidizedFlag: Boolean(data.subsidizedFlag),

          peakDemandMultiplier:
            data.peakDemandMultiplier == null
              ? ""
              : String(data.peakDemandMultiplier),
          baseRate: data.baseRate == null ? "" : String(data.baseRate),
          tieredRate: data.tieredRate == null ? "" : String(data.tieredRate),

          applicableMonthFrom: effectiveFrom
            ? ymdToMonthInput(effectiveFrom)
            : monthByteToMonthInput(
                data.applicableMonthFrom ?? null,
                effectiveFrom
              ),

          applicableMonthTo: effectiveTo
            ? ymdToMonthInput(effectiveTo)
            : monthByteToMonthInput(
                data.applicableMonthTo ?? null,
                effectiveFrom
              ),

          fromHour: String(data.fromHour ?? "").trim() || "00:00:00",
          toHour: String(data.toHour ?? "").trim() || "23:59:00",

          isActive: Boolean(data.isActive),
        };

        setFormData(mapped);
        initialRef.current = { ...mapped };
      };

      void load();
    }, [unitChargeId, ENDPOINTS.getById]);

    const hasUnsavedChanges = useMemo(() => {
      if (!initialRef.current) return false;
      return (Object.keys(formData) as (keyof FormState)[]).some(
        (k) => formData[k] !== initialRef.current![k]
      );
    }, [formData]);

    useEffect(() => {
      onUnsavedChange?.(hasUnsavedChanges);
    }, [hasUnsavedChanges, onUnsavedChange]);

    const currencyOptions = useMemo(
      () =>
        currencies
          .filter((x) => x.isActive)
          .map((c) => {
            const code = String(c.currencyCode ?? "").trim();
            const sym = String(c.symbol ?? "").trim();
            return {
              value: c.currencyId,
              label: sym ? `${code} | ${sym}` : code,
            };
          }),
      [currencies]
    );

    const rateTypeOptions = useMemo(
      () =>
        rateTypes
          .filter((x) => x.isActive)
          .map((r) => ({ value: r.rateTypeId, label: r.rateTypeName })),
      [rateTypes]
    );

    const ymdToMonthInput = (ymd: string): string => {
      if (!ymd || ymd.length < 7) return "";
      return ymd.slice(0, 7);
    };

    const sanitizeDecimalText = (raw: string, maxDecimals: number): string => {
      // keep digits + dot only
      const cleaned = raw.replace(/[^\d.]/g, "");

      // split by dot, ignore extra dots by joining them into the decimals
      const [intRaw = "", ...rest] = cleaned.split(".");
      if (rest.length === 0) return intRaw;

      const decRaw = rest.join(""); // removes extra dots
      const dec = decRaw.slice(0, maxDecimals);

      // allow starting with "." -> "0."
      const intPart = intRaw === "" ? "0" : intRaw;

      // keep trailing dot if user types "9."
      return dec.length > 0 ? `${intPart}.${dec}` : `${intPart}.`;
    };

    type ValidityEl =
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement;

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

    const showValidityError = (
      el: ValidityEl | null,
      message: string
    ): boolean => {
      if (!el) return false;
      el.setCustomValidity(message);
      el.reportValidity();
      el.focus();
      return true;
    };

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      const target = e.currentTarget;
      const { name, value } = target;

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement
      ) {
        target.setCustomValidity("");
      }

      if (target instanceof HTMLInputElement && target.type === "checkbox") {
        setFormData((prev) => ({ ...prev, [name]: target.checked }));
        return;
      }

      if (name === "chargePerUnit") {
        setFormData((prev) => ({
          ...prev,
          chargePerUnit: sanitizeDecimalText(value, 4),
        }));
        return;
      }

      const intFields = new Set([
        "currencyId",
        "rateTypeId",
        "minUnit",
        "maxUnit",
      ]);
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
      clearValidity(getById("unitCharge-effectiveTo"));
      clearValidity(getByName("chargePerUnit"));
      clearValidity(getByName("maxUnit"));
      clearValidity(getByName("applicableMonthTo"));
      clearValidity(getByName("toHour"));

      if (!formData.effectiveFrom) {
        showValidityError(
          getById("unitCharge-effectiveFrom"),
          "Please fill out this field."
        );
        return false;
      }


      if (!formData.effectiveTo) {
        showValidityError(
          getById("unitCharge-effectiveTo"),
          "Please fill out this field."
        );
        return false;
      }

      if (formData.effectiveFrom && formData.effectiveTo) {
        if (formData.effectiveTo < formData.effectiveFrom) {
          showValidityError(
            getById("unitCharge-effectiveTo"),
            "Effective-To-Date must be greater than or equal to Effective-From-Date."
          );
          return false;
        }
      }

      if (toNullableNumber(formData.chargePerUnit) === null) {
        showValidityError(
          getByName("chargePerUnit"),
          "Please enter Charge Per Unit."
        );
        return false;
      }

      if (
        formData.minUnit != null &&
        formData.maxUnit != null &&
        formData.minUnit > formData.maxUnit
      ) {
        showValidityError(
          getByName("maxUnit"),
          "Min Unit cannot be greater than Max Unit."
        );
        return false;
      }

      const fromM = parseMonthInput(formData.applicableMonthFrom);
      const toM = parseMonthInput(formData.applicableMonthTo);
      if (fromM && toM) {
        const fromKey = fromM.year * 100 + fromM.month;
        const toKey = toM.year * 100 + toM.month;
        if (fromKey > toKey) {
          showValidityError(
            getByName("applicableMonthTo"),
            "Applicable Month From cannot be greater than Applicable Month To."
          );
          return false;
        }
      }

      if (
        formData.fromHour &&
        formData.toHour &&
        formData.fromHour >= formData.toHour
      ) {
        showValidityError(
          getByName("toHour"),
          "From Hour must be earlier than To Hour."
        );
        return false;
      }

      return true;
    };

    const buildPayload = (): UnitChargeDTO => ({
      unitChargeId: formData.unitChargeId,
      effectiveFrom: formData.effectiveFrom,
      effectiveTo: formData.effectiveTo,
      chargePerUnit: toNullableNumber(formData.chargePerUnit) ?? 0,

      currencyId: formData.currencyId!,
      rateTypeId: formData.rateTypeId!,

      minUnit: formData.minUnit ?? null,
      maxUnit: formData.maxUnit ?? null,

      threshold: toNullableNumber(formData.threshold),
      subsidizedFlag: formData.subsidizedFlag,

      peakDemandMultiplier: toNullableNumber(formData.peakDemandMultiplier),
      baseRate: toNullableNumber(formData.baseRate),
      tieredRate: toNullableNumber(formData.tieredRate),

      applicableMonthFrom: monthInputToMonthByte(formData.applicableMonthFrom),
      applicableMonthTo: monthInputToMonthByte(formData.applicableMonthTo),

      fromHour: hhmmToTimeSpan(formData.fromHour),
      toHour: hhmmToTimeSpan(formData.toHour),

      isActive: formData.isActive,
    });

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
        const payload = buildPayload();

        if (isEdit && unitChargeId) {
          await updateEntity(
            ENDPOINTS.update,
            unitChargeId,
            payload,
            userId,
            false
          );
          await showAddUpdateResult(true, "update", "unit charge");
          navigate(parentListPath);
          return;
        }

        await createEntity(ENDPOINTS.add, payload, userId, false);
        await showAddUpdateResult(true, "add", "unit charge");

        const mode = submitModeRef.current;

        if (mode === "saveAndNext") {
          setFormData((prev) => {
            const next: FormState = {
              ...createEmptyForm(),
              currencyId: prev.currencyId,
              rateTypeId: prev.rateTypeId,
            };
            initialRef.current = { ...next };
            return next;
          });
        } else {
          navigate(parentListPath);
        }
      } catch (err) {
        console.error(err);
        await showAddUpdateResult(false, "error", "unit charge");
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
            <SectionCard title="Unit Charge Details">
              <div className="row g-3">
                <div className="col-md-6">
                  <DateInput
                    id="unitCharge-effectiveFrom"
                    label="Effective From"
                    value={formData.effectiveFrom}
                    onChange={(v) => {
                      clearValidity(getById("unitCharge-effectiveFrom"));
                      setFormData((prev) => ({
                        ...prev,
                        effectiveFrom: v,
                        applicableMonthFrom: v
                          ? ymdToMonthInput(v)
                          : prev.applicableMonthFrom,
                      }));
                    }}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <DateInput
                    id="unitCharge-effectiveTo"
                    label="Effective To"
                    value={formData.effectiveTo}
                    onChange={(v) => {
                      clearValidity(getById("unitCharge-effectiveTo"));
                      setFormData((prev) => ({
                        ...prev,
                        effectiveTo: v,
                        applicableMonthTo: v
                          ? ymdToMonthInput(v)
                          : prev.applicableMonthTo,
                      }));
                    }}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <TextInputField
                    label="Charge Per Unit"
                    name="chargePerUnit"
                    value={formData.chargePerUnit}
                    onChange={handleChange}
                    inputMode="decimal"
                    placeholder="e.g. 9.6790"
                  />
                </div>

                <div className="col-md-6">
                  <TextInputField
                    label="Threshold"
                    name="threshold"
                    value={formData.threshold}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </div>

                <div className="col-md-6">
                  <SelectField
                    label="Currency"
                    name="currencyId"
                    value={formData.currencyId ?? ""}
                    onChange={handleChange}
                    required
                    options={currencyOptions}
                  />
                </div>

                <div className="col-md-6">
                  <SelectField
                    label="Rate Type"
                    name="rateTypeId"
                    value={formData.rateTypeId ?? ""}
                    onChange={handleChange}
                    required
                    options={rateTypeOptions}
                  />
                </div>

                <div className="col-md-4">
                  <TextInputField
                    label="Min Unit"
                    name="minUnit"
                    value={formData.minUnit ?? ""}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </div>

                <div className="col-md-4">
                  <TextInputField
                    label="Max Unit"
                    name="maxUnit"
                    value={formData.maxUnit ?? ""}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </div>

                <div className="col-md-4">
                  <SwitchTile
                    id="unitCharge-subsidizedFlag"
                    name="subsidizedFlag"
                    label="Subsidized"
                    checked={formData.subsidizedFlag}
                    onChange={(e) => {
                      const t = e.currentTarget;
                      if (t instanceof HTMLInputElement) {
                        setFormData((prev) => ({
                          ...prev,
                          subsidizedFlag: t.checked,
                        }));
                      }
                    }}
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="col-12">
            <SectionCard title="Advanced (Optional)">
              <div className="row g-3">
                <div className="col-md-4">
                  <TextInputField
                    label="Peak Demand Multiplier"
                    name="peakDemandMultiplier"
                    value={formData.peakDemandMultiplier}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </div>

                <div className="col-md-4">
                  <TextInputField
                    label="Base Rate"
                    name="baseRate"
                    value={formData.baseRate}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </div>

                <div className="col-md-4">
                  <TextInputField
                    label="Tiered Rate"
                    name="tieredRate"
                    value={formData.tieredRate}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </div>

                <div className="col-md-6 position-relative">
                  <MonthPickerField
                    id="unitCharge-applicableMonthFrom"
                    label="Applicable Month From"
                    name="applicableMonthFrom"
                    value={formData.applicableMonthFrom}
                    onChange={() => {}}
                  />
                  <div
                    className="position-absolute top-0 start-0 w-100 h-100"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => e.preventDefault()}
                    style={{ cursor: "default" }}
                  />
                </div>

                <div className="col-md-6 position-relative">
                  <MonthPickerField
                    id="unitCharge-applicableMonthTo"
                    label="Applicable Month To"
                    name="applicableMonthTo"
                    value={formData.applicableMonthTo}
                    onChange={() => {}}
                  />
                  <div
                    className="position-absolute top-0 start-0 w-100 h-100"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => e.preventDefault()}
                    style={{ cursor: "default" }}
                  />
                </div>

                <div className="col-md-6">
                  <TimePickerField
                    id="unitCharge-fromHour"
                    label="From Hour"
                    name="fromHour"
                    value={formData.fromHour}
                    onChange={(v) =>
                      setFormData((prev) => ({ ...prev, fromHour: v }))
                    }
                  />
                </div>

                <div className="col-md-6">
                  <TimePickerField
                    id="unitCharge-toHour"
                    label="To Hour"
                    name="toHour"
                    value={formData.toHour}
                    onChange={(v) =>
                      setFormData((prev) => ({ ...prev, toHour: v }))
                    }
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
                    id="unitCharge-isActive"
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

export default AddEditUnitCharge;
