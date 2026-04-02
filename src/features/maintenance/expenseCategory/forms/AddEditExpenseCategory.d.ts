import React from "react";
import type { AddEditFormHandle } from "../../../shared/SharedAddEditForm";
type Props = {
    expenseCategoryId?: number;
    onUnsavedChange: (changed: boolean) => void;
};
declare const AddEditExpenseCategory: React.ForwardRefExoticComponent<Props & React.RefAttributes<AddEditFormHandle>>;
export default AddEditExpenseCategory;
