import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useFormNavigationGuard } from "../../hooks/useFormNavigationGuard";
import { useCurrentMenu } from "../../hooks/useCurrentMenu";
import { showUnsavedChangesDialog } from "../../utils/showUnsavedChangesDialog";

export interface AddEditFormHandle {
  submit: () => void;
  reset: () => void;
  saveAndNext: () => void;
}

interface SharedAddEditFormProps {
  isSubmitting: boolean;
  hasUnsavedChanges: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onReset?: () => void;
  onSaveAndNext?: () => void;
  children: React.ReactNode;
  className?: string;
  disableSaveAndNext?: boolean;
  formRef?: React.RefObject<HTMLFormElement | null>;
  isEditMode?: boolean;
}

const SharedAddEditForm = forwardRef<AddEditFormHandle, SharedAddEditFormProps>(
  (
    {
      isSubmitting,
      hasUnsavedChanges,
      onSubmit,
      onReset,
      onSaveAndNext,
      children,
      disableSaveAndNext,
      formRef,
      isEditMode,
    },
    ref
  ) => {
    const internalFormRef = useRef<HTMLFormElement | null>(null);
    const formRefToUse = formRef ?? internalFormRef;
    const navigate = useNavigate();
    const { parentListPath, singularMenuName } = useCurrentMenu();

    useFormNavigationGuard(hasUnsavedChanges && !isSubmitting);

    const handleBack = async () => {
      if (hasUnsavedChanges) {
        const shouldLeave = await showUnsavedChangesDialog();
        if (!shouldLeave) return;
      }
      window.__suppressNavigationGuard = true;
      navigate(parentListPath);
    };

    useImperativeHandle(ref, () => ({
      submit: () => formRefToUse.current?.requestSubmit(),
      reset: () => onReset?.(),
      saveAndNext: () => formRefToUse.current?.requestSubmit(),
    }));

    return (
      <>
        <form
          ref={formRefToUse}
          onSubmit={onSubmit}
          style={{
            pointerEvents: isSubmitting ? "none" : "auto",
            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          <div className="inner-area-header-container d-flex align-items-center justify-content-between px-2">
            <h4 className="inner-area-header-title">
              {isEditMode ? "EDIT" : "ADD NEW"}{" "}
              {singularMenuName ? singularMenuName.toUpperCase() : ""}
            </h4>
            <div className="pe-3 gap-2 d-flex" style={{ flexShrink: 0 }}>
              <button type="submit" className="btn btn-success add-edit-action-button ">
                <i className="fa fa-save me-2" />
                {isEditMode ? "Update" : "Save"}
              </button>
              {onReset && (
                <button
                  type="button"
                  className="btn btn-danger add-edit-action-button "
                  onClick={() => onReset()}
                >
                  <i className="fa fa-undo me-2" />
                  Reset
                </button>
              )}
              {!isEditMode && !disableSaveAndNext && onSaveAndNext && (
                <button
                  type="button"
                  className="btn btn-primary add-edit-action-button "
                  onClick={() => formRefToUse.current?.requestSubmit()}
                >
                  <i className="fa fa-plus me-2" />
                  Save & Next
                </button>
              )}
              <button
                type="button"
                className="btn btn-light add-edit-action-button"
                onClick={handleBack}
              >
                <i className="fa fa-arrow-left me-2" />
                Back
              </button>
            </div>
          </div>
          <div className="p-4 position-relative"> {children} </div>
        </form>
      </>
    );
  }
);

export default SharedAddEditForm;
