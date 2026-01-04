// src/features/maintenance/flatMaintenance/pages/AddEditFlatMaintenancePage.tsx
import React from "react";
import SharedAddEditPage from "../../../shared/SharedAddEditPage";
import AddEditFlatMaintenance from "../forms/AddEditFlatMaintenance";

const AddEditFlatMaintenancePage: React.FC = () => {
  return (
    <SharedAddEditPage<"id", { flatMaintenanceId?: number }>
      idParamName="id"
      FormComponent={AddEditFlatMaintenance}
      mapParamToProp={(id: number) => ({ flatMaintenanceId: id })}
    />
  );
};

export default AddEditFlatMaintenancePage;