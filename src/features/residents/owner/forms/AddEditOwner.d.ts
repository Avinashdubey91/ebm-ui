import React from "react";
import type { AddEditFormHandle } from "../../../shared/SharedAddEditForm";
interface Props {
    ownerId?: number;
    onUnsavedChange?: (changed: boolean) => void;
}
declare const AddEditOwner: React.ForwardRefExoticComponent<Props & React.RefAttributes<AddEditFormHandle>>;
export default AddEditOwner;
