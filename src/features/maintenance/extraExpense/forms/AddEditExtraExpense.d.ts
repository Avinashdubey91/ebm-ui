import React from "react";
import type { AddEditFormHandle } from "../../../shared/SharedAddEditForm";
type Props = {
    extraExpenseid?: number;
    onUnsavedChange: (changed: boolean) => void;
};
declare const AddEditExtraExpense: React.ForwardRefExoticComponent<Props & React.RefAttributes<AddEditFormHandle>>;
export default AddEditExtraExpense;
