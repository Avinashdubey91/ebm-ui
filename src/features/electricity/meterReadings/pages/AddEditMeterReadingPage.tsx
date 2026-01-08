import React from "react";
import SharedAddEditPage from "../../../shared/SharedAddEditPage";
import AddEditMeterReading from "../forms/AddEditMeterReading";

const AddEditMeterReadingPage: React.FC = () => {
  return (
    <SharedAddEditPage
      idParamName="meterReadingId"
      FormComponent={AddEditMeterReading}
      mapParamToProp={(id) => ({ meterReadingId: id })}
    />
  );
};

export default AddEditMeterReadingPage;