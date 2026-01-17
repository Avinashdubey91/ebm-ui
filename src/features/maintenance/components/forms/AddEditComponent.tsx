import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import { createEntity, fetchEntityById, updateEntity } from "../../../../api/genericCrudApi";
import SharedAddEditForm from "../../../shared/SharedAddEditForm";
import type { AddEditFormHandle } from "../../../shared/SharedAddEditForm";

import TextInputField from "../../../../components/common/TextInputField";

import SectionCard from "../../../../components/SectionCard";
import SwitchTile from "../../../../components/SwitchTile";

import { showAddUpdateResult } from "../../../../utils/alerts/showAddUpdateConfirmation";
import { useCurrentMenu } from "../../../../hooks/useCurrentMenu";

type SubmitMode = "save" | "saveAndNext";

type FormState = {
  maintenanceComponentId: number;
  componentName: string;
  description: string;
  isActive: boolean;
  isDeprecated: boolean;
};

type MaintenanceComponentApiDTO = {
  maintenanceComponentId: number;
  componentName: string;
  description?: string | null;
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

    const isEditMode =
      typeof maintenanceComponentId === "number" && maintenanceComponentId > 0;

    const formRef = useRef<HTMLFormElement>(null);

    // Patch - Replaced: align with AddEditExtraExpense pattern (explicit dirty state, no Object.keys diff)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [formData, setFormData] = useState<FormState>(emptyForm);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Keeps the last loaded/accepted state so Reset restores edit-mode values
    const initialSnapshotRef = useRef<FormState>(emptyForm);

    useEffect(() => {
      onUnsavedChange?.(hasUnsavedChanges);
    }, [hasUnsavedChanges, onUnsavedChange]);

    useEffect(() => {
      let isMounted = true;

      const load = async () => {
        if (!isEditMode) {
          if (!isMounted) return;
          setFormData(emptyForm);
          initialSnapshotRef.current = { ...emptyForm };
          setHasUnsavedChanges(false);
          return;
        }

        const data = await fetchEntityById<MaintenanceComponentApiDTO>(
          endpoints.getById,
          maintenanceComponentId
        );

        if (!isMounted) return;

        const mapped: FormState = {
          maintenanceComponentId: data.maintenanceComponentId ?? maintenanceComponentId,
          componentName: data.componentName ?? "",
          description: data.description ?? "",
          isActive: Boolean(data.isActive),
          isDeprecated: Boolean(data.isDeprecated),
        };

        setFormData(mapped);
        initialSnapshotRef.current = { ...mapped };
        setHasUnsavedChanges(false);
      };

      void load();

      return () => {
        isMounted = false;
      };
    }, [isEditMode, maintenanceComponentId]);

    const markDirty = useCallback(() => {
      setHasUnsavedChanges(true);
    }, []);

    const handleChange = useCallback(
      (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
      ) => {
        const { name, value } = e.currentTarget;

        if (e.currentTarget instanceof HTMLInputElement && e.currentTarget.type === "checkbox") {
          const checked = e.currentTarget.checked;
          setFormData((prev) => ({ ...prev, [name]: checked }));
          markDirty();
          return;
        }

        setFormData((prev) => ({ ...prev, [name]: value }));
        markDirty();
      },
      [markDirty]
    );

    const validateBeforeSubmit = useCallback((): boolean => {
      if (formRef.current && !formRef.current.checkValidity()) {
        formRef.current.reportValidity();
        return false;
      }

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
    }, [formData.componentName, formData.description]);

    const buildPayload = useCallback(() => {
      return {
        maintenanceComponentId: formData.maintenanceComponentId,
        componentName: formData.componentName.trim(),
        description: formData.description.trim() ? formData.description.trim() : null,
        isActive: formData.isActive,
        isDeprecated: formData.isDeprecated,
      };
    }, [formData]);

    // Patch - Replaced: remove submitMode/requestSubmit race; submit explicitly like AddEditExtraExpense
    const doSubmit = useCallback(
      async (mode: SubmitMode) => {
        if (!validateBeforeSubmit()) return;

        setIsSubmitting(true);
        try {
          const userId = parseInt(localStorage.getItem("userId") || "0", 10);
          const payload = buildPayload();

          if (isEditMode && typeof maintenanceComponentId === "number") {
            await updateEntity(
              endpoints.update,
              maintenanceComponentId,
              payload,
              userId,
              false
            );
            await showAddUpdateResult(true, "update", "maintenance component");
          } else {
            await createEntity(endpoints.add, payload, userId, false);
            await showAddUpdateResult(true, "add", "maintenance component");
          }

          setHasUnsavedChanges(false);

          if (!isEditMode && mode === "saveAndNext") {
            setFormData({ ...emptyForm });
            initialSnapshotRef.current = { ...emptyForm };
            return;
          }

          // Same navigation behavior, just suppress guard like other pages do
          window.__suppressNavigationGuard = true;
          navigate(parentListPath);
        } catch (err) {
          console.error(err);
          await showAddUpdateResult(false, "error", "maintenance component");
        } finally {
          setIsSubmitting(false);
        }
      },
      [
        buildPayload,
        isEditMode,
        maintenanceComponentId,
        navigate,
        parentListPath,
        validateBeforeSubmit,
      ]
    );

    const handleSubmit = useCallback(
      (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        void doSubmit("save");
      },
      [doSubmit]
    );

    const handleSaveAndNext = useCallback(() => {
      void doSubmit("saveAndNext");
    }, [doSubmit]);

    const handleReset = useCallback(() => {
      const snapshot = initialSnapshotRef.current ?? emptyForm;
      setFormData({ ...snapshot });
      setHasUnsavedChanges(false);
    }, []);

    // Preserve external ref contract (submit/reset/saveAndNext)
    useImperativeHandle(
      ref,
      () => ({
        submit: () => {
          void doSubmit("save");
        },
        reset: handleReset,
        saveAndNext: () => {
          void doSubmit("saveAndNext");
        },
      }),
      [doSubmit, handleReset]
    );

    return (
      <SharedAddEditForm
        isSubmitting={isSubmitting}
        hasUnsavedChanges={hasUnsavedChanges}
        onSubmit={handleSubmit}
        onReset={handleReset}
        onSaveAndNext={handleSaveAndNext}
        isEditMode={isEditMode}
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
                    disabled={isEditMode}
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