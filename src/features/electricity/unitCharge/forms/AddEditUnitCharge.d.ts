import React from "react";
import type { AddEditFormHandle } from "../../../shared/SharedAddEditForm";
interface Props {
    unitChargeId?: number;
    onUnsavedChange?: (changed: boolean) => void;
}
declare const AddEditUnitCharge: React.ForwardRefExoticComponent<Props & React.RefAttributes<AddEditFormHandle>>;
export default AddEditUnitCharge;
