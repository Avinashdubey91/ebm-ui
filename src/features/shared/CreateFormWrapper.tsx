// src/features/shared/CreateFormWrapper.tsx

import React from 'react';

interface CreateFormWrapperProps {
  isEditMode: boolean;
  formId: string;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  onSaveAndNext?: () => void;
  children: React.ReactNode;
}

const CreateFormWrapper: React.FC<CreateFormWrapperProps> = ({
  isEditMode,
  formId,
  isSubmitting,
  onSubmit,
  onReset,
  onSaveAndNext,
  children,
}) => {
  return (
    <div className="d-flex flex-column gap-3">
      {/* Form Content */}
      <form id={formId} onSubmit={onSubmit}>
        {children}
      </form>

      {/* Footer Buttons: Save / Reset / Save & Next */}
      <div className="d-flex gap-2 justify-content-end px-3 pt-3">
        <button
          form={formId}
          type="submit"
          className="btn btn-outline-success"
          disabled={isSubmitting}
        >
          <i className="fa fa-save me-2" /> Save
        </button>

        <button
          type="button"
          className="btn btn-outline-danger"
          onClick={onReset}
          disabled={isSubmitting}
        >
          <i className="fa fa-undo me-2" /> Reset
        </button>

        {!isEditMode && onSaveAndNext && (
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={onSaveAndNext}
            disabled={isSubmitting}
          >
            <i className="fa fa-plus me-2" /> Save & Next
          </button>
        )}
      </div>
    </div>
  );
};

export default CreateFormWrapper;
