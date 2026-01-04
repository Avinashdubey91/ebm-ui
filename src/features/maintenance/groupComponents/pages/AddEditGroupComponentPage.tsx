import React from "react";
import SharedAddEditPage from "../../../shared/SharedAddEditPage";
import AddEditGroupComponent from "../forms/AddEditGroupComponent";

const AddEditGroupComponentPage: React.FC = () => {
  return (
    <SharedAddEditPage<"id", { maintenanceGroupComponentId?: number }>
      idParamName="id"
      FormComponent={AddEditGroupComponent}
      mapParamToProp={(id: number) => ({ maintenanceGroupComponentId: id })}
    />
  );
};

export default AddEditGroupComponentPage;
