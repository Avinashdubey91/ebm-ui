import React from "react";
import type { AddEditFormHandle } from "../../../shared/SharedAddEditForm";
interface Props {
    renterId?: number;
    onUnsavedChange?: (changed: boolean) => void;
}
declare const AddEditRenter: React.ForwardRefExoticComponent<Props & React.RefAttributes<AddEditFormHandle>>;
export default AddEditRenter;
