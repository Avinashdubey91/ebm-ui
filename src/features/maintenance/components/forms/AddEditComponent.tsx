import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { createEntity, fetchEntityById, updateEntity } from "../../../../api/genericCrudApi";
import SharedAddEditForm from "../../../shared/SharedAddEditForm";
import type { AddEditFormHandle } from "../../../shared/SharedAddEditForm";

import TextInputField from "../../../../components/common/TextInputField";
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

type SwitchTileProps = {
  id: string;
  name: "isActive" | "isDeprecated";
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

type FormState = {
  maintenanceComponentId: number;
  componentName: string;
  description: string;
  isActive: boolean;
  isDeprecated: boolean;
};

const emptyForm: FormState = {
  maintenanceComponentId: 0,
  componentName: "",
  description: "",
  isActive: true,
  isDeprecated: false,
};

const endpoints = {
  getById: "/maintenancecomponent/Get-MaintenanceComponent-By-Id",
  add: "/maintenancecomponent/Create-New-MaintenanceComponent",
  update: "/maintenancecomponent/Update-MaintenanceComponent-By-Id",
};

interface Props {
  maintenanceComponentId?: number;
  onUnsavedChange?: (changed: boolean) => void;
}

const AddEditComponent = forwardRef<AddEditFormHandle, Props>(
  ({ maintenanceComponentId, onUnsavedChange }, ref) => {
    const navigate = useNavigate();
    const { parentListPath } = useCurrentMenu();

    const isEdit = !!maintenanceComponentId;

    const [formData, setFormData] = useState<FormState>(emptyForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMode, setSubmitMode] = useState<SubmitMode>("save");

    const formRef = useRef<HTMLFormElement>(null);
    const initialRef = useRef<FormState | null>(null);

    useEffect(() => {
      const load = async () => {
        if (!maintenanceComponentId) {
          setFormData(emptyForm);
          initialRef.current = { ...emptyForm };
          return;
        }

        const data = await fetchEntityById<{
          maintenanceComponentId: number;
          componentName: string;
          description?: string | null;
          isActive: boolean;
          isDeprecated: boolean;
        }>(endpoints.getById, maintenanceComponentId);

        const mapped: FormState = {
          maintenanceComponentId: data.maintenanceComponentId ?? maintenanceComponentId,
          componentName: data.componentName ?? "",
          description: data.description ?? "",
          isActive: Boolean(data.isActive),
          isDeprecated: Boolean(data.isDeprecated),
        };

        setFormData(mapped);
        initialRef.current = { ...mapped };
      };

      void load();
    }, [maintenanceComponentId]);

    const hasUnsavedChanges = useMemo(() => {
      if (!initialRef.current) return false;
      return (Object.keys(formData) as (keyof FormState)[]).some(
        (k) => formData[k] !== initialRef.current![k]
      );
    }, [formData]);

    useEffect(() => {
      onUnsavedChange?.(hasUnsavedChanges);
    }, [hasUnsavedChanges, onUnsavedChange]);

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

      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const validate = (): boolean => {
      const name = formData.componentName.trim();
      if (!name) {
        window.alert("Component Name is required.");
        return false;
      }
      if (name.length > 100) {
        window.alert("Component Name cannot exceed 100 characters.");
        return false;
      }
      if (formData.description.trim().length > 255) {
        window.alert("Description cannot exceed 255 characters.");
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
          maintenanceComponentId: formData.maintenanceComponentId,
          componentName: formData.componentName.trim(),
          description: formData.description.trim()
            ? formData.description.trim()
            : null,
          isActive: formData.isActive,
          isDeprecated: formData.isDeprecated,
        };

        if (isEdit && maintenanceComponentId) {
          await updateEntity(endpoints.update, maintenanceComponentId, payload, userId, false);
          await showAddUpdateResult(true, "update", "maintenance component");
        } else {
          await createEntity(endpoints.add, payload, userId, false);
          await showAddUpdateResult(true, "add", "maintenance component");
        }

        if (!isEdit && submitMode === "saveAndNext") {
          setFormData({ ...emptyForm });
          initialRef.current = { ...emptyForm };
        } else {
          navigate(parentListPath);
        }
      } catch (err) {
        console.error(err);
        await showAddUpdateResult(false, "error", "maintenance component");
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
            <SectionCard title="Component Details">
              <div className="row g-3">
                <div className="col-md-6">
                  <TextInputField
                    label="Component Name"
                    name="componentName"
                    value={formData.componentName}
                    onChange={handleChange}
                    required
                    placeholder="Enter component name"
                  />
                </div>

                <div className="col-md-6">
                  <TextInputField
                    label="Description"
                    name="description"
                    value={formData.description}
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
                <div className="col-md-6">
                  <SwitchTile
                    id="maintenancecomponent-switch-isActive"
                    name="isActive"
                    label="Active"
                    checked={!!formData.isActive}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <SwitchTile
                    id="maintenancecomponent-switch-isDeprecated"
                    name="isDeprecated"
                    label="Deprecated"
                    checked={!!formData.isDeprecated}
                    onChange={handleChange}
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

export default AddEditComponent;