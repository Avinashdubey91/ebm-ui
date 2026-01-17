import React from "react";
import SharedAddEditPage from "../../../shared/SharedAddEditPage";
import AddEditExpenseCategory from "../forms/AddEditExpenseCategory";

const AddEditExpenseCategoryPage: React.FC = () => {
  return (
    <SharedAddEditPage<"id", { expenseCategoryId?: number }>
      idParamName="id"
      FormComponent={AddEditExpenseCategory}
      mapParamToProp={(id: number) => ({ expenseCategoryId: id })}
    />
  );
};

export default AddEditExpenseCategoryPage;