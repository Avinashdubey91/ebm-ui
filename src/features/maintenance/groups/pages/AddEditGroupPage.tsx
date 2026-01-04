// src/features/maintenance/groups/pages/AddEditGroupPage.tsx
import React from "react";
import SharedAddEditPage from "../../../shared/SharedAddEditPage";
import AddEditGroup from "../forms/AddEditGroup";

const AddEditGroupPage: React.FC = () => {
  return (
    <SharedAddEditPage<"id", { maintenanceGroupId?: number }>
      idParamName="id"
      FormComponent={AddEditGroup}
      mapParamToProp={(id: number) => ({ maintenanceGroupId: id })}
    />
  );
};

export default AddEditGroupPage;