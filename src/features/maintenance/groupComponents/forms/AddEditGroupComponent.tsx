import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import DateInput from "../../../../components/common/DateInput";
import { normalizeToYmd } from "../../../../utils/format";

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

import type { MaintenanceGroupComponentDTO } from "../../../../types/MaintenanceGroupComponentDTO";
import type { MaintenanceGroupDTO } from "../../../../types/MaintenanceGroupDTO";
import type { MaintenanceComponentDTO } from "../../../../types/MaintenanceComponentDTO";
import type { ApartmentDTO } from "../../../../types/ApartmentDTO";

import { showAddUpdateResult } from "../../../../utils/alerts/showAddUpdateConfirmation";
import { useCurrentMenu } from "../../../../hooks/useCurrentMenu";

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

const sanitizeDecimal2 = (raw: string): string => {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const [intPart, ...rest] = cleaned.split(".");
  const decimals = rest.join("");
  const limited = decimals.slice(0, 2);

  if (rest.length === 0) return intPart;
  return `${intPart}.${limited}`;
};

const endpoints = {
  getById: "/maintenancegroupcomponent/Get-MaintenanceGroup-Component-By-Id",
  add: "/maintenancegroupcomponent/Add-New-MaintenanceGroupComponent",
  update: "/maintenancegroupcomponent/Update-MaintenanceGroup-Component-By-Id",

  getAllGroups: "/maintenancegroup/Get-All-MaintenanceGroups",
  getAllComponents: "/maintenancecomponent/Get-All-MaintenanceComponents",
  getAllApartments: "/apartment/Get-All-Apartment",
};

type FormState = {
  maintenanceGroupComponentId: number;
  maintenanceGroupId?: number;
  maintenanceComponentId?: number;
  amount: string;
};

const emptyForm: FormState = {
  maintenanceGroupComponentId: 0,
  maintenanceGroupId: undefined,
  maintenanceComponentId: undefined,
  amount: "",
};

interface Props {
  maintenanceGroupComponentId?: number;
  onUnsavedChange?: (changed: boolean) => void;
}

const AddEditGroupComponent = forwardRef<AddEditFormHandle, Props>(
  ({ maintenanceGroupComponentId, onUnsavedChange }, ref) => {
    const navigate = useNavigate();
    const { parentListPath } = useCurrentMenu();
    const isEdit = !!maintenanceGroupComponentId;

    const [formData, setFormData] = useState<FormState>(emptyForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMode, setSubmitMode] = useState<SubmitMode>("save");

    const [groups, setGroups] = useState<MaintenanceGroupDTO[]>([]);
    const [components, setComponents] = useState<MaintenanceComponentDTO[]>([]);
    const [apartments, setApartments] = useState<ApartmentDTO[]>([]);

    const formRef = useRef<HTMLFormElement>(null);
    const initialRef = useRef<FormState | null>(null);

    useEffect(() => {
      const loadMasters = async () => {
        try {
          const [groupsRes, componentsRes, apartmentsRes] = await Promise.all([
            fetchAllEntities<MaintenanceGroupDTO>(endpoints.getAllGroups),
            fetchAllEntities<MaintenanceComponentDTO>(
              endpoints.getAllComponents
            ),
            fetchAllEntities<ApartmentDTO>(endpoints.getAllApartments),
          ]);

          setGroups(Array.isArray(groupsRes) ? groupsRes : []);
          setComponents(Array.isArray(componentsRes) ? componentsRes : []);
          setApartments(Array.isArray(apartmentsRes) ? apartmentsRes : []);
        } catch (err) {
          console.error("❌ Failed to load master data:", err);
          setGroups([]);
          setComponents([]);
          setApartments([]);
        }
      };

      void loadMasters();
    }, []);

    useEffect(() => {
      const load = async () => {
        if (!maintenanceGroupComponentId) {
          setFormData(emptyForm);
          initialRef.current = { ...emptyForm };
          return;
        }

        const data = await fetchEntityById<MaintenanceGroupComponentDTO>(
          endpoints.getById,
          maintenanceGroupComponentId
        );

        const mapped: FormState = {
          maintenanceGroupComponentId:
            data.maintenanceGroupComponentId ?? maintenanceGroupComponentId,
          maintenanceGroupId: data.maintenanceGroupId ?? undefined,
          maintenanceComponentId: data.maintenanceComponentId ?? undefined,
          amount:
            data.amount === null ||
            data.amount === undefined ||
            Number.isNaN(data.amount)
              ? ""
              : String(data.amount),
        };

        setFormData(mapped);
        initialRef.current = { ...mapped };
      };

      void load();
    }, [maintenanceGroupComponentId]);

    const hasUnsavedChanges = useMemo(() => {
      if (!initialRef.current) return false;
      return (Object.keys(formData) as (keyof FormState)[]).some(
        (k) => formData[k] !== initialRef.current![k]
      );
    }, [formData]);

    useEffect(() => {
      onUnsavedChange?.(hasUnsavedChanges);
    }, [hasUnsavedChanges, onUnsavedChange]);

    const apartmentNameById = useMemo(() => {
      const m = new Map<number, string>();
      apartments.forEach((a) => {
        if (a.apartmentId !== undefined && a.apartmentId !== null) {
          m.set(
            a.apartmentId,
            a.apartmentName ?? `Apartment #${a.apartmentId}`
          );
        }
      });
      return m;
    }, [apartments]);

    const groupOptions = useMemo(() => {
      return groups
        .filter(
          (
            g
          ): g is MaintenanceGroupDTO & {
            maintenanceGroupId: number;
            apartmentId: number;
          } =>
            typeof g.maintenanceGroupId === "number" &&
            typeof g.apartmentId === "number"
        )
        .map((g) => {
          const aptName =
            apartmentNameById.get(g.apartmentId) ??
            `Apartment #${g.apartmentId}`;
          const activeTag = g.isActive ? "" : " (Inactive)";

          return {
            label: `${aptName} | Group ${g.maintenanceGroupId}${activeTag}`,
            value: g.maintenanceGroupId,
          };
        });
    }, [groups, apartmentNameById]);

    const componentOptions = useMemo(() => {
      return components
        .filter(
          (
            c
          ): c is MaintenanceComponentDTO & {
            maintenanceComponentId: number;
          } => typeof c.maintenanceComponentId === "number"
        )
        .map((c) => {
          const name =
            c.componentName ?? `Component #${c.maintenanceComponentId}`;
          const tags: string[] = [];
          if (!c.isActive) tags.push("Inactive");
          if (c.isDeprecated) tags.push("Deprecated");
          const suffix = tags.length ? ` (${tags.join(", ")})` : "";

          return {
            label: `${name}${suffix}`,
            value: c.maintenanceComponentId,
          };
        });
    }, [components]);

    const selectedGroupEffectiveFromYmd = useMemo(() => {
      if (!formData.maintenanceGroupId) return "";

      const g = groups.find(
        (x) => x.maintenanceGroupId === formData.maintenanceGroupId
      );

      return normalizeToYmd(g?.effectiveFrom ?? "");
    }, [formData.maintenanceGroupId, groups]);

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      const { name, value } = e.currentTarget;

      if (name === "amount") {
        // Patch Start: numeric-only with max 2 decimals (consistent with backend decimal(10,2))
        setFormData((prev) => ({ ...prev, amount: sanitizeDecimal2(value) }));
        // Patch End
        return;
      }

      if (name === "maintenanceGroupId" || name === "maintenanceComponentId") {
        setFormData((prev) => ({
          ...prev,
          [name]: value === "" ? undefined : Number(value),
        }));
        return;
      }

      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const validate = (): boolean => {
      if (!formData.maintenanceGroupId) {
        window.alert("Maintenance Group is required.");
        return false;
      }
      if (!formData.maintenanceComponentId) {
        window.alert("Maintenance Component is required.");
        return false;
      }

      const raw = formData.amount.trim();
      if (raw.length === 0) {
        window.alert("Amount is required.");
        return false;
      }

      const num = Number(raw);
      if (!Number.isFinite(num)) {
        window.alert("Amount must be a valid number.");
        return false;
      }

      if (num < 0) {
        window.alert("Amount cannot be negative.");
        return false;
      }

      if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
        window.alert("Amount can have maximum 2 decimals.");
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
          maintenanceGroupComponentId: formData.maintenanceGroupComponentId,
          maintenanceGroupId: formData.maintenanceGroupId!,
          maintenanceComponentId: formData.maintenanceComponentId!,
          amount: Number(formData.amount),
        };

        if (isEdit && maintenanceGroupComponentId) {
          await updateEntity(
            endpoints.update,
            maintenanceGroupComponentId,
            payload,
            userId,
            false
          );
          await showAddUpdateResult(true, "update", "group component map");
          navigate(parentListPath);
          return;
        }

        await createEntity(endpoints.add, payload, userId, false);
        await showAddUpdateResult(true, "add", "group component map");

        // Patch Start: Save & Next keeps Group, clears Component + Amount
        if (submitMode === "saveAndNext") {
          setFormData((prev) => ({
            ...emptyForm,
            maintenanceGroupId: prev.maintenanceGroupId,
          }));
          initialRef.current = { ...emptyForm };
        } else {
          navigate(parentListPath);
        }
        // Patch End
      } catch (err) {
        console.error(err);
        await showAddUpdateResult(false, "error", "group component map");
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
            <SectionCard title="Mapping Details">
              <div className="row g-3">
                <div className="col-md-6">
                  <SelectField
                    label="Maintenance Group"
                    name="maintenanceGroupId"
                    value={formData.maintenanceGroupId ?? ""}
                    onChange={handleChange}
                    required
                    disabled={isEdit}
                    options={groupOptions}
                  />
                </div>

                <div className="col-md-6">
                  <DateInput
                    id="maintenanceGroupEffectiveFrom"
                    label="Effective From"
                    value={selectedGroupEffectiveFromYmd}
                    readOnly
                  />
                </div>

                <div className="col-md-6">
                  <SelectField
                    label="Maintenance Component"
                    name="maintenanceComponentId"
                    value={formData.maintenanceComponentId ?? ""}
                    onChange={handleChange}
                    required
                    disabled={isEdit}
                    options={componentOptions}
                  />
                </div>

                <div className="col-md-6">
                  <TextInputField
                    label="Amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    inputMode="decimal"
                    placeholder="0.00"
                  />
                  <div className="form-text">
                    Saving this mapping recalculates the Maintenance Group Total
                    Charge automatically.
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </SharedAddEditForm>
    );
  }
);

export default AddEditGroupComponent;
