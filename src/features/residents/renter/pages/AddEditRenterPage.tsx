// features/residents/renters/pages/AddEditRenterPage.tsx

import React from "react";
import SharedAddEditPage from "../../../shared/SharedAddEditPage";
import AddEditRenter from "../forms/AddEditRenter";

const AddEditRenterPage: React.FC = () => (
  <SharedAddEditPage<
    /* url param */ "id",
    /* props-to-form */ { renterId?: number }
  >
    idParamName="id"
    FormComponent={AddEditRenter}
    mapParamToProp={(id: number) => ({ renterId: id })}
  />
);

export default AddEditRenterPage;
