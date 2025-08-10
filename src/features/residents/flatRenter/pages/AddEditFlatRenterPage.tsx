import React from "react";
import SharedAddEditPage from "../../../shared/SharedAddEditPage";
import AddEditFlatRenter from "../forms/AddEditFlatRenter";

const AddEditFlatRenterPage: React.FC = () => {
  return (
    <SharedAddEditPage<"flatRenterId", { flatRenterId?: number }>
      idParamName="flatRenterId"
      FormComponent={AddEditFlatRenter}
      mapParamToProp={(id: number) => ({ flatRenterId: id })}
    />
  );
};

export default AddEditFlatRenterPage;
