import React from "react";
import type { AddEditFormHandle } from "../../../shared/SharedAddEditForm";
export interface AddEditApartmentRef {
    submit: () => void;
    reset: () => void;
    saveAndNext: () => void;
}
interface Props {
    apartmentId?: number;
    onUnsavedChange?: (changed: boolean) => void;
}
declare const AddEditApartment: React.ForwardRefExoticComponent<Props & React.RefAttributes<AddEditFormHandle>>;
export default AddEditApartment;
