import React from "react";
import type { AddEditFormHandle } from "../../../shared/SharedAddEditForm";
interface Props {
    maintenanceGroupComponentId?: number;
    onUnsavedChange?: (changed: boolean) => void;
}
declare const AddEditGroupComponent: React.ForwardRefExoticComponent<Props & React.RefAttributes<AddEditFormHandle>>;
export default AddEditGroupComponent;
