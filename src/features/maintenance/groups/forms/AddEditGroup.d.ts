import React from "react";
import type { AddEditFormHandle } from "../../../shared/SharedAddEditForm";
interface Props {
    maintenanceGroupId?: number;
    onUnsavedChange?: (changed: boolean) => void;
}
declare const AddEditGroup: React.ForwardRefExoticComponent<Props & React.RefAttributes<AddEditFormHandle>>;
export default AddEditGroup;
