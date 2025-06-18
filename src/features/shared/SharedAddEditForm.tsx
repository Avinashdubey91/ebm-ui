// src/components/shared/SharedAddEditForm.tsx

import React, { useEffect } from "react";
import { useFormNavigationGuard } from "../../hooks/useFormNavigationGuard";

interface SharedAddEditFormProps {
  isSubmitting: boolean;
  hasUnsavedChanges: boolean;
  onUnsavedChange: (unsaved: boolean) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement> | { preventDefault: () => void }) => void;
  onReset?: () => void;
  onSaveAndNext?: () => void;
  children: React.ReactNode;
}

const SharedAddEditForm: React.FC<SharedAddEditFormProps> = ({
  isSubmitting,
  hasUnsavedChanges,
  onUnsavedChange,
  onSubmit,
  onReset,
  onSaveAndNext,
  children,
}) => {
  useFormNavigationGuard(hasUnsavedChanges && !isSubmitting);

  useEffect(() => {
    onUnsavedChange(hasUnsavedChanges);
  }, [hasUnsavedChanges, onUnsavedChange]);

  return (
    <form
      onSubmit={onSubmit}
      style={{
        pointerEvents: isSubmitting ? "none" : "auto",
        opacity: isSubmitting ? 0.6 : 1,
      }}
    >
      <div className="row align-items-end">
        {children}

        <div className="col-md-12 mt-3 d-flex gap-3 flex-wrap">
          <button type="submit" className="btn btn-outline-success" disabled={isSubmitting}>
            <i className="fa fa-save me-2" /> Save
          </button>
          {onReset && (
            <button type="button" className="btn btn-outline-danger" onClick={onReset}>
              <i className="fa fa-undo me-2" /> Reset
            </button>
          )}
          {onSaveAndNext && (
            <button type="button" className="btn btn-outline-primary" onClick={onSaveAndNext}>
              <i className="fa fa-plus me-2" /> Save & Next
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export default SharedAddEditForm;
