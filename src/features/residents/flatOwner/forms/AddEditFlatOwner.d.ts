import React from "react";
import type { AddEditFormHandle } from "../../../shared/SharedAddEditForm";
interface Props {
    flatOwnerId?: number;
    onUnsavedChange?: (changed: boolean) => void;
}
declare const AddEditFlatOwner: React.ForwardRefExoticComponent<Props & React.RefAttributes<AddEditFormHandle>>;
export default AddEditFlatOwner;
