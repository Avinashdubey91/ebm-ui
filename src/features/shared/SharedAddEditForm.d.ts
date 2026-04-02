import React from "react";
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
declare const SharedAddEditForm: React.ForwardRefExoticComponent<SharedAddEditFormProps & React.RefAttributes<AddEditFormHandle>>;
export default SharedAddEditForm;
