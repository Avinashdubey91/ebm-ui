// src/features/residents/flatOwner/pages/AddEditFlatOwnerPage.tsx
import React from "react";
import SharedAddEditPage from "../../../shared/SharedAddEditPage";
import AddEditFlatOwner from "../forms/AddEditFlatOwner";

const AddEditFlatOwnerPage: React.FC = () => {
  return (
    <SharedAddEditPage<"flatOwnerId", { flatOwnerId?: number }>
      idParamName="flatOwnerId"
      FormComponent={AddEditFlatOwner}
      mapParamToProp={(id: number) => ({ flatOwnerId: id })}
    />
  );
};

export default AddEditFlatOwnerPage;
