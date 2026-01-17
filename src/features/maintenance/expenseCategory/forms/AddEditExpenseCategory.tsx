import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  createEntity,
  fetchEntityById,
  updateEntity,
} from "../../../../api/genericCrudApi";

import SharedAddEditForm from "../../../shared/SharedAddEditForm";
import type { AddEditFormHandle } from "../../../shared/SharedAddEditForm";

import TextInputField from "../../../../components/common/TextInputField";
import SectionCard from "../../../../components/SectionCard";
import SwitchTile from "../../../../components/SwitchTile";

import { showAddUpdateResult } from "../../../../utils/alerts/showAddUpdateConfirmation";
import { useCurrentMenu } from "../../../../hooks/useCurrentMenu";

import type { ExpenseCategoryDTO } from "../../../../types/ExpenseCategoryDTO";

type SubmitMode = "save" | "saveAndNext";

const endpoints = {
  getById: "/expensecategory/Get-Expense-Category-By-Id",
  add: "/expensecategory/Add-New-Expense-Category",
  update: "/expensecategory/Update-Expense-Category-By-Id",
};

type FormState = {
  expenseCategoryId: number;
  categoryName: string;
  description: string;
  isActive: boolean;
};

type Props = {
  expenseCategoryId?: number;
  onUnsavedChange: (changed: boolean) => void;
};

type SwitchName = "isActive";

const AddEditExpenseCategory = forwardRef<AddEditFormHandle, Props>(
  ({ expenseCategoryId, onUnsavedChange }, ref) => {
    const navigate = useNavigate();
    const { parentListPath } = useCurrentMenu();

    const isEditMode =
      typeof expenseCategoryId === "number" && expenseCategoryId > 0;

    const formRef = useRef<HTMLFormElement | null>(null);

    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState<FormState>(() => ({
      expenseCategoryId: 0,
      categoryName: "",
      description: "",
      isActive: true,
    }));

    useEffect(() => {
      onUnsavedChange(hasUnsavedChanges);
    }, [hasUnsavedChanges, onUnsavedChange]);

    useEffect(() => {
      if (!isEditMode) return;

      let alive = true;

      (async () => {
        const dto = await fetchEntityById<
          ExpenseCategoryDTO & {
            description?: string | null;
            Description?: string | null;
          }
        >(endpoints.getById, expenseCategoryId);

        if (!alive || !dto) return;

        setFormData({
          expenseCategoryId: dto.expenseCategoryId ?? dto.id ?? 0,
          categoryName: dto.categoryName?.trim() ?? "",
          description: (dto.description ?? dto.Description ?? "").trim(),
          isActive: dto.isActive ?? true,
        });

        setHasUnsavedChanges(false);
      })();

      return () => {
        alive = false;
      };
    }, [expenseCategoryId, isEditMode]);

    const markDirty = useCallback(() => {
      setHasUnsavedChanges(true);
    }, []);

    const handleSwitchChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.currentTarget;
        const switchName = name as SwitchName;

        if (switchName === "isActive") {
          setFormData((prev) => ({ ...prev, isActive: checked }));
          markDirty();
        }
      },
      [markDirty]
    );

    const handleChange = useCallback(
      (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
      ) => {
        const { name, value } = e.currentTarget;

        if (name === "categoryName") {
          setFormData((prev) => ({ ...prev, categoryName: value }));
          markDirty();
          return;
        }

        if (name === "description") {
          setFormData((prev) => ({ ...prev, description: value }));
          markDirty();
        }
      },
      [markDirty]
    );

    const validateBeforeSubmit = useCallback((): boolean => {
      if (!formRef.current) return false;
      const ok = formRef.current.checkValidity();
      if (!ok) {
        formRef.current.reportValidity();
        return false;
      }
      return true;
    }, []);

    const buildPayload = useCallback((): {
      categoryName: string;
      description: string | null;
      isActive: boolean;
    } => {
      const trimmedName = formData.categoryName.trim();
      const trimmedDesc = formData.description.trim();

      return {
        categoryName: trimmedName,
        description: trimmedDesc.length > 0 ? trimmedDesc : null,
        isActive: formData.isActive,
      };
    }, [formData.categoryName, formData.description, formData.isActive]);

    const doSubmit = useCallback(
      async (mode: SubmitMode) => {
        if (isSubmitting) return;
        if (!validateBeforeSubmit()) return;

        const userId = parseInt(localStorage.getItem("userId") ?? "0", 10);
        if (!userId) return;

        setIsSubmitting(true);

        try {
          const payload = buildPayload();

          if (isEditMode && expenseCategoryId) {
            await updateEntity(
              endpoints.update,
              expenseCategoryId,
              payload,
              userId,
              false
            );
            await showAddUpdateResult(true, "update", "expense category");
            setHasUnsavedChanges(false);
            navigate(parentListPath);
            return;
          }

          await createEntity(endpoints.add, payload, userId, false);
          await showAddUpdateResult(true, "add", "expense category");
          setHasUnsavedChanges(false);

          if (mode === "saveAndNext") {
            setFormData((prev) => ({
              ...prev,
              expenseCategoryId: 0,
              categoryName: "",
              description: "",
              isActive: true,
            }));
            return;
          }

          navigate(parentListPath);
        } catch (err) {
          console.error(err);
          await showAddUpdateResult(false, "error", "expense category");
        } finally {
          setIsSubmitting(false);
        }
      },
      [
        buildPayload,
        expenseCategoryId,
        isEditMode,
        isSubmitting,
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
        categoryName: "",
        description: "",
        isActive: true,
      }));
      setHasUnsavedChanges(false);
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
          <SectionCard title="Expense Category Details">
            <div className="row g-3">
              <div className="col-md-6">
                <TextInputField
                  label="Category Name"
                  name="categoryName"
                  value={formData.categoryName}
                  required
                  onChange={handleChange}
                  disabled={isEditMode}
                />
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

              <div className="col-12">
                <label className="form-label fw-semibold">Description</label>
                <textarea
                  className="form-control"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
            </div>
          </SectionCard>
        </div>
      </SharedAddEditForm>
    );
  }
);

export default AddEditExpenseCategory;
