// features/residents/owners/pages/AddEditOwnerPage.tsx

import React from "react";
import SharedAddEditPage from "../../../shared/SharedAddEditPage";
import AddEditOwner from "../forms/AddEditOwner";

const AddEditOwnerPage: React.FC = () => (
  <SharedAddEditPage<
    /* url param */ "id",
    /* props-to-form */ { ownerId?: number }
  >
    idParamName="id"
    FormComponent={AddEditOwner}
    mapParamToProp={(id: number) => ({ ownerId: id })}
  />
);

export default AddEditOwnerPage;
