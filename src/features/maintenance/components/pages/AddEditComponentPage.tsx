import React from "react";
import SharedAddEditPage from "../../../shared/SharedAddEditPage";
import AddEditComponent from "../forms/AddEditComponent";

const AddEditComponentPage: React.FC = () => {
  return (
    <SharedAddEditPage<"id", { maintenanceComponentId?: number }>
      idParamName="id"
      FormComponent={AddEditComponent}
      mapParamToProp={(id: number) => ({ maintenanceComponentId: id })}
    />
  );
};

export default AddEditComponentPage;