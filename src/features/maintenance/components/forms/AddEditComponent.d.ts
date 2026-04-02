import React from "react";
import type { AddEditFormHandle } from "../../../shared/SharedAddEditForm";
interface Props {
    maintenanceComponentId?: number;
    onUnsavedChange?: (changed: boolean) => void;
}
declare const AddEditComponent: React.ForwardRefExoticComponent<Props & React.RefAttributes<AddEditFormHandle>>;
export default AddEditComponent;
