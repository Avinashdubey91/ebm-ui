import React from "react";
import SharedAddEditPage from "../../../shared/SharedAddEditPage";
import AddEditMeter from "../forms/AddEditMeter";

const AddEditMeterPage: React.FC = () => {
  return (
    <SharedAddEditPage
      idParamName="meterId"
      FormComponent={AddEditMeter}
      mapParamToProp={(id) => ({ meterId: id })}
    />
  );
};

export default AddEditMeterPage;