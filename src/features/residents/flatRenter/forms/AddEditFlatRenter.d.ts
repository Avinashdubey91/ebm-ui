import React from "react";
import type { AddEditFormHandle } from "../../../shared/SharedAddEditForm";
interface Props {
    flatRenterId?: number;
    onUnsavedChange?: (changed: boolean) => void;
}
declare const AddEditFlatRenter: React.ForwardRefExoticComponent<Props & React.RefAttributes<AddEditFormHandle>>;
export default AddEditFlatRenter;
