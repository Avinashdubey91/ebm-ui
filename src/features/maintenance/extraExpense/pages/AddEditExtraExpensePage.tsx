import React from "react";
import SharedAddEditPage from "../../../shared/SharedAddEditPage";
import AddEditExtraExpense from "../forms/AddEditExtraExpense";

const AddEditExtraExpensePage: React.FC = () => {
  return (
    <SharedAddEditPage<"id", { extraExpenseid?: number }>
      idParamName="id"
      FormComponent={AddEditExtraExpense}
      mapParamToProp={(id: number) => ({ extraExpenseid: id })}
    />
  );
};

export default AddEditExtraExpensePage;
