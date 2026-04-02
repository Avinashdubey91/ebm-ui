import React from "react";
import type { AddEditFormHandle } from "../../../shared/SharedAddEditForm";
export interface AddEditSocietyRef {
    submit: () => void;
    reset: () => void;
    saveAndNext: () => void;
}
interface Props {
    societyId?: number;
    onUnsavedChange?: (changed: boolean) => void;
}
declare const AddEditSociety: React.ForwardRefExoticComponent<Props & React.RefAttributes<AddEditFormHandle>>;
export default AddEditSociety;
