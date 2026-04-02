import React from "react";
import type { AddEditFormHandle } from "../../../shared/SharedAddEditForm";
interface Props {
    flatId?: number;
    onUnsavedChange?: (changed: boolean) => void;
}
declare const AddEditFlat: React.ForwardRefExoticComponent<Props & React.RefAttributes<AddEditFormHandle>>;
export default AddEditFlat;
