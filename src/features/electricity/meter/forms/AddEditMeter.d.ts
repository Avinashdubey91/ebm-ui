import React from "react";
import type { AddEditFormHandle } from "../../../shared/SharedAddEditForm";
interface Props {
    meterId?: number;
    onUnsavedChange?: (changed: boolean) => void;
}
declare const AddEditMeter: React.ForwardRefExoticComponent<Props & React.RefAttributes<AddEditFormHandle>>;
export default AddEditMeter;
