import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  createEntity,
  fetchAllEntities,
  fetchEntity,
  fetchEntityById,
  updateEntity,
} from "../../../../api/genericCrudApi";

import SharedAddEditForm from "../../../shared/SharedAddEditForm";
import type { AddEditFormHandle } from "../../../shared/SharedAddEditForm";

import SelectField from "../../../../components/common/SelectField";
import TextInputField from "../../../../components/common/TextInputField";
import MonthPickerField from "../../../../components/common/MonthPickerField";

import SectionCard from "../../../../components/SectionCard";
import SwitchTile from "../../../../components/SwitchTile";

import { showAddUpdateResult } from "../../../../utils/alerts/showAddUpdateConfirmation";
import { useCurrentMenu } from "../../../../hooks/useCurrentMenu";

import type { ApartmentDTO } from "../../../../types/ApartmentDTO";
import type { FlatDTO } from "../../../../types/FlatDTO";
import type { ExpenseCategoryDTO } from "../../../../types/ExpenseCategoryDTO";
import type { ExtraExpenseDTO } from "../../../../types/ExtraExpenseDTO";
import type { FlatOwnerNameLookupDTO } from "../../../../types/FlatOwnerNameLookupDTO";

type SubmitMode = "save" | "saveAndNext";

const endpoints = {
  apartments: "/apartment/Get-All-Apartment",
  flats: "/flat/Get-All-Flats",
  categories: "/expensecategory/Get-All-Expense-Categories",
  getById: "/extraexpense/Get-ExtraExpense-By-Id",
  add: "/extraexpense/Create-New-ExtraExpense",
  update: "/extraexpense/Update-ExtraExpense-By-Id",
  flatOwnerLookup: "/extraexpense/Get-FlatOwnerLookup",
};

function getCurrentYearMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function isoToYearMonth(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function yearMonthToIso(yearMonth: string): string {
  if (!yearMonth) return "";
  return `${yearMonth}-01`;
}

function sanitizeDecimal2(input: string): string {
  const cleaned = input.replace(/[^\d.]/g, "");
  const [intPart, ...rest] = cleaned.split(".");
  const decimals = rest.join("");
  const limited = decimals.slice(0, 2);
  return rest.length === 0 ? intPart : `${intPart}.${limited}`;
}

function normalizeLookupArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const data = record.data ?? record.Data;
    if (Array.isArray(data)) return data as T[];
  }

  return [];
}

const toFlatLabel = (f: FlatDTO): string => {
  const label = (f.flatNumber ?? "").trim();
  return label.length > 0 ? label : `Flat #${f.flatId}`;
};

const toFullName = (
  first?: string | null,
  last?: string | null
): string | null => {
  const name = `${first ?? ""} ${last ?? ""}`.trim();
  return name.length > 0 ? name : null;
};

type FormState = {
  extraExpenseid: number;
  apartmentId: number | "";
  expenseCategoryId: number | "";
  flatId: number | "";

  expenseMonth: string;
  expenseAmount: string;
  expenseDescription: string;

  isShared: boolean;
  isActive: boolean;
};

type Props = {
  extraExpenseid?: number;
  onUnsavedChange: (changed: boolean) => void;
};

type SwitchName = "isActive" | "isShared";

const AddEditExtraExpense = forwardRef<AddEditFormHandle, Props>(
  ({ extraExpenseid, onUnsavedChange }, ref) => {
    const navigate = useNavigate();
    const { parentListPath } = useCurrentMenu();

    const isEditMode = typeof extraExpenseid === "number" && extraExpenseid > 0;
    const editModeReadOnlyStyle = useMemo<
      React.CSSProperties | undefined
    >(() => {
      return isEditMode ? { pointerEvents: "none" } : undefined;
    }, [isEditMode]);

    const formRef = useRef<HTMLFormElement | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const lastLookupApartmentIdRef = useRef<number | undefined>(undefined);

    const [apartments, setApartments] = useState<ApartmentDTO[]>([]);
    const [flats, setFlats] = useState<FlatDTO[]>([]);
    const [categories, setCategories] = useState<ExpenseCategoryDTO[]>([]);

    const [flatOwners, setFlatOwners] = useState<FlatOwnerNameLookupDTO[]>([]);

    const [flatRequiredError, setFlatRequiredError] = useState<string>("");

    const [formData, setFormData] = useState<FormState>(() => ({
      extraExpenseid: 0,
      apartmentId: "",
      expenseCategoryId: "",
      flatId: "",

      expenseMonth: getCurrentYearMonth(),
      expenseAmount: "",
      expenseDescription: "",

      isShared: true,
      isActive: true,
    }));

    useEffect(() => {
      onUnsavedChange(hasUnsavedChanges);
    }, [hasUnsavedChanges, onUnsavedChange]);

    useEffect(() => {
      let isComponentMounted = true;

      const loadLookups = async () => {
        try {
          const [aptList, flatList, catList] = await Promise.all([
            fetchAllEntities<ApartmentDTO>(endpoints.apartments),
            fetchAllEntities<FlatDTO>(endpoints.flats),
            fetchAllEntities<ExpenseCategoryDTO>(endpoints.categories),
          ]);

          if (!isComponentMounted) return;

          setApartments(normalizeLookupArray<ApartmentDTO>(aptList));
          setFlats(normalizeLookupArray<FlatDTO>(flatList));
          setCategories(normalizeLookupArray<ExpenseCategoryDTO>(catList));
        } catch (err) {
          console.error("❌ Failed to load extra expense lookups:", err);
          if (!isComponentMounted) return;
          setApartments([]);
          setFlats([]);
          setCategories([]);
        }
      };

      void loadLookups();

      return () => {
        isComponentMounted = false;
      };
    }, []);

    useEffect(() => {
      if (!isEditMode) return;

      let isComponentMounted = true;

      (async () => {
        const dto = await fetchEntityById<
          ExtraExpenseDTO & {
            monthYear?: string | null;
            MonthYear?: string | null;
          }
        >(endpoints.getById, extraExpenseid);

        if (!isComponentMounted || !dto) return;

        setFormData({
          extraExpenseid: dto.extraExpenseid ?? 0,
          apartmentId: dto.apartmentId == null ? "" : Number(dto.apartmentId),
          expenseCategoryId:
            dto.expenseCategoryId == null ? "" : Number(dto.expenseCategoryId),
          flatId: dto.flatId == null ? "" : Number(dto.flatId),

          expenseMonth: isoToYearMonth(
            dto.monthYear ?? dto.MonthYear ?? dto.expenseMonth
          ),
          expenseAmount:
            dto.expenseAmount != null ? String(dto.expenseAmount) : "",
          expenseDescription: dto.expenseDescription ?? "",

          isShared: dto.isShared ?? true,
          isActive: dto.isActive ?? true,
        });

        setHasUnsavedChanges(false);
        setFlatRequiredError("");
      })();

      return () => {
        isComponentMounted = false;
      };
    }, [extraExpenseid, isEditMode]);

    const apartmentOptions = useMemo(() => {
      return apartments
        .filter((a) => typeof a.apartmentId === "number")
        .map((a) => ({
          value: a.apartmentId!,
          label: a.apartmentName ?? `Apartment #${a.apartmentId}`,
        }));
    }, [apartments]);

    const categoryOptions = useMemo(() => {
      const map = new Map<number, string>();

      for (const category of categories) {
        if (category.isActive === false) continue;

        const key = category.expenseCategoryId ?? category.id;
        if (typeof key !== "number") continue;

        const label =
          category.categoryName && category.categoryName.trim().length > 0
            ? category.categoryName
            : `Category #${key}`;

        map.set(key, label);
      }

      return Array.from(map.entries()).map(([value, label]) => ({
        value,
        label,
      }));
    }, [categories]);

    const flatLabelById = useMemo(() => {
      const m = new Map<number, string>();
      flats.forEach((f) => {
        if (typeof f.flatId === "number") {
          m.set(f.flatId, toFlatLabel(f));
        }
      });
      return m;
    }, [flats]);

    const flatOwnerOptions = useMemo(() => {
      return flatOwners.map((o) => {
        const flatLabel = flatLabelById.get(o.flatId) ?? `Flat #${o.flatId}`;
        const ownerName = toFullName(o.firstName, o.lastName);
        const label = ownerName ? `${flatLabel} (${ownerName})` : flatLabel;
        return { value: o.flatId, label };
      });
    }, [flatOwners, flatLabelById]);

    // Patch - Replaced: GET-FLATOWNERLOOKUP effect trigger rules to match AddEditMeter (fetch on apartmentId change only)
    useEffect(() => {
      const rawApartmentId = formData.apartmentId;

      const parsedApartmentId =
        typeof rawApartmentId === "number"
          ? rawApartmentId
          : typeof rawApartmentId === "string" &&
            rawApartmentId.trim().length > 0
          ? Number(rawApartmentId)
          : undefined;

      const shouldLog = lastLookupApartmentIdRef.current !== parsedApartmentId;
      if (shouldLog) {
        lastLookupApartmentIdRef.current = parsedApartmentId;
        console.log("[ExtraExpense Lookup] effect triggered", {
          rawApartmentId,
          rawType: typeof rawApartmentId,
          parsedApartmentId,
          isEditMode,
        });
      }

      if (!parsedApartmentId || parsedApartmentId <= 0) {
        if (shouldLog) {
          console.log("[ExtraExpense Lookup] skipped (invalid apartmentId)", {
            parsedApartmentId,
          });
        }
        setFlatOwners([]);
        return;
      }

      const url = `${endpoints.flatOwnerLookup}/${parsedApartmentId}`;

      if (shouldLog) {
        console.log("[ExtraExpense Lookup] request will fire", { url });
      }

      const loadOwners = async () => {
        try {
          console.log("[Lookup] resolved request URL (browser-origin)", {
            url,
            resolved: new URL(url, window.location.origin).toString(),
          });

          const res = await fetchEntity<unknown>(url);

          console.log("[Lookup] raw response details", {
            typeofRes: typeof res,
            isArray: Array.isArray(res),
            preview: typeof res === "string" ? res.slice(0, 120) : undefined,
          });
          const owners = normalizeLookupArray<FlatOwnerNameLookupDTO>(res);
          setFlatOwners(owners);

          if (shouldLog) {
            const keys =
              res && typeof res === "object"
                ? Object.keys(res as Record<string, unknown>).slice(0, 8)
                : [];
            console.log("[ExtraExpense Lookup] response received", {
              normalizedCount: owners.length,
              isArray: Array.isArray(res),
              responseType: typeof res,
              responseKeys: keys,
            });
          }
        } catch (err) {
          console.error("❌ Failed to load flat owners:", err);
          setFlatOwners([]);
        }
      };

      void loadOwners();
    }, [formData.apartmentId, isEditMode]);

    const markDirty = useCallback(() => {
      setHasUnsavedChanges(true);
    }, []);

    const handleSwitchChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.currentTarget;
        const switchName = name as SwitchName;

        if (isEditMode && switchName === "isShared") {
          return;
        }

        if (switchName === "isShared") {
          setFormData((prev) => ({
            ...prev,
            isShared: checked,
            flatId: checked ? "" : prev.flatId,
          }));
          setFlatRequiredError("");
          markDirty();
          return;
        }

        if (switchName === "isActive") {
          setFormData((prev) => ({ ...prev, isActive: checked }));
          markDirty();
        }
      },
      [markDirty, isEditMode]
    );

    const handleChange = useCallback(
      (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
      ) => {
        const { name, value } = e.currentTarget;

        if (
          isEditMode &&
          (name === "apartmentId" ||
            name === "flatId" ||
            name === "expenseCategoryId" ||
            name === "expenseDescription")
        ) {
          return;
        }

        if (name === "expenseAmount") {
          setFormData((prev) => ({
            ...prev,
            expenseAmount: sanitizeDecimal2(value),
          }));
          markDirty();
          return;
        }

        if (name === "apartmentId") {
          const parsed = value ? Number(value) : "";
          setFormData((prev) => ({
            ...prev,
            apartmentId: parsed,
            flatId: "",
          }));
          setFlatRequiredError("");
          markDirty();
          return;
        }

        if (name === "expenseCategoryId") {
          const parsed = value ? Number(value) : "";
          setFormData((prev) => ({ ...prev, expenseCategoryId: parsed }));
          markDirty();
          return;
        }

        if (name === "flatId") {
          const parsed = value ? Number(value) : "";
          setFormData((prev) => ({ ...prev, flatId: parsed }));
          setFlatRequiredError("");
          markDirty();
          return;
        }

        if (name === "expenseDescription") {
          setFormData((prev) => ({ ...prev, expenseDescription: value }));
          markDirty();
        }
      },
      [markDirty, isEditMode]
    );

    const handleMonthChange = useCallback(
      (newYearMonth: string) => {
        if (isEditMode) return;
        setFormData((prev) => ({ ...prev, expenseMonth: newYearMonth }));
        markDirty();
      },
      [markDirty, isEditMode]
    );

    const validateBeforeSubmit = useCallback((): boolean => {
      setFlatRequiredError("");

      if (!formRef.current) return false;
      const ok = formRef.current.checkValidity();
      if (!ok) {
        formRef.current.reportValidity();
        return false;
      }

      if (!formData.isShared && formData.flatId === "") {
        setFlatRequiredError("Flat is required for Personal expense.");
        return false;
      }

      return true;
    }, [formData.flatId, formData.isShared]);

    const buildPayload = useCallback((): {
      apartmentId: number;
      flatId: number | null;
      monthYear: string;
      expenseDescription: string;
      expenseAmount: number;
      isShared: boolean;
      isActive: boolean;
      expenseCategoryId: number | null;
    } => {
      const monthIso = yearMonthToIso(formData.expenseMonth);

      return {
        apartmentId: Number(formData.apartmentId),
        expenseCategoryId:
          formData.expenseCategoryId === ""
            ? null
            : Number(formData.expenseCategoryId),
        flatId: formData.isShared
          ? null
          : formData.flatId === ""
          ? null
          : Number(formData.flatId),

        monthYear: monthIso,
        expenseAmount: formData.expenseAmount
          ? Number(formData.expenseAmount)
          : 0,
        expenseDescription: formData.expenseDescription.trim(),

        isShared: formData.isShared,
        isActive: formData.isActive,
      };
    }, [formData]);

    const doSubmit = useCallback(
      async (mode: SubmitMode) => {
        if (!validateBeforeSubmit()) return;

        setIsSubmitting(true);
        try {
          const userId = parseInt(localStorage.getItem("userId") ?? "0", 10);
          const payload = buildPayload();

          if (isEditMode && extraExpenseid) {
            await updateEntity(
              endpoints.update,
              extraExpenseid,
              payload,
              userId,
              false
            );
            await showAddUpdateResult(true, "update", "extra expense");
            setHasUnsavedChanges(false);
            navigate(parentListPath);
            return;
          }

          await createEntity(endpoints.add, payload, userId, false);
          await showAddUpdateResult(true, "add", "extra expense");
          setHasUnsavedChanges(false);

          if (mode === "saveAndNext") {
            setFormData((prev) => ({
              extraExpenseid: 0,
              apartmentId: prev.apartmentId,
              expenseCategoryId: "",
              flatId: "",

              expenseMonth: prev.expenseMonth,
              expenseAmount: "",
              expenseDescription: "",

              isShared: prev.isShared,
              isActive: true,
            }));

            setFlatRequiredError("");
            return;
          }

          navigate(parentListPath);
        } catch (err) {
          console.error(err);
          await showAddUpdateResult(false, "error", "extra expense");
        } finally {
          setIsSubmitting(false);
        }
      },
      [
        buildPayload,
        extraExpenseid,
        isEditMode,
        navigate,
        parentListPath,
        validateBeforeSubmit,
      ]
    );

    const onSubmit = useCallback(
      (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        void doSubmit("save");
      },
      [doSubmit]
    );

    const onSaveAndNext = useCallback(() => {
      void doSubmit("saveAndNext");
    }, [doSubmit]);

    const onReset = useCallback(() => {
      setFormData((prev) => ({
        ...prev,
        expenseCategoryId: "",
        flatId: "",
        expenseAmount: "",
        expenseDescription: "",
        isActive: true,
      }));
      setHasUnsavedChanges(false);
      setFlatRequiredError("");
    }, []);

    return (
      <SharedAddEditForm
        ref={ref}
        formRef={formRef}
        isSubmitting={isSubmitting}
        hasUnsavedChanges={hasUnsavedChanges}
        onSubmit={onSubmit}
        onReset={onReset}
        onSaveAndNext={onSaveAndNext}
        isEditMode={isEditMode}
      >
        <div className="p-3 d-flex flex-column gap-3">
          <SectionCard title="Extra Expense Details">
            <div className="row g-3">
              <div className="col-md-6">
                <div style={editModeReadOnlyStyle} aria-readonly={isEditMode}>
                  <SelectField
                    label="Apartment"
                    name="apartmentId"
                    value={formData.apartmentId}
                    options={apartmentOptions}
                    required
                    onChange={handleChange}
                    disabled={isEditMode}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div style={editModeReadOnlyStyle} aria-readonly={isEditMode}>
                  <MonthPickerField
                    id="expenseMonth"
                    label="Expense Month"
                    name="expenseMonth"
                    value={formData.expenseMonth}
                    required
                    onChange={handleMonthChange}
                    disabled={isEditMode}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div style={editModeReadOnlyStyle} aria-readonly={isEditMode}>
                  <SelectField
                    label="Expense Category"
                    name="expenseCategoryId"
                    value={formData.expenseCategoryId}
                    options={categoryOptions}
                    required
                    onChange={handleChange}
                    disabled={isEditMode}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <TextInputField
                  label="Amount"
                  name="expenseAmount"
                  value={formData.expenseAmount}
                  required
                  inputMode="decimal"
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-6">
                <div style={isEditMode ? { opacity: 0.6, pointerEvents: "none" } : undefined}>
                  <SwitchTile
                    id="isShared"
                    name="isShared"
                    label="Shared Expense?"
                    checked={formData.isShared}
                    onChange={handleSwitchChange}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <SwitchTile
                  id="isActive"
                  name="isActive"
                  label="Active?"
                  checked={formData.isActive}
                  onChange={handleSwitchChange}
                />
              </div>

              {!formData.isShared && (
                <div className="col-md-6">
                  <div style={editModeReadOnlyStyle} aria-readonly={isEditMode}>
                    <SelectField
                      label="Flat Number"
                      name="flatId"
                      value={formData.flatId}
                      options={flatOwnerOptions}
                      required
                      onChange={handleChange}
                      disabled={isEditMode}
                    />
                  </div>
                  {flatRequiredError && (
                    <div className="text-danger small mt-1">
                      {flatRequiredError}
                    </div>
                  )}
                </div>
              )}

              <div className="col-12">
                <label className="form-label fw-semibold">Description</label>
                <textarea
                  className="form-control"
                  name="expenseDescription"
                  rows={3}
                  value={formData.expenseDescription}
                  readOnly={isEditMode}
                  onChange={handleChange}
                  disabled={isEditMode}
                />
              </div>
            </div>
          </SectionCard>
        </div>
      </SharedAddEditForm>
    );
  }
);

export default AddEditExtraExpense;
