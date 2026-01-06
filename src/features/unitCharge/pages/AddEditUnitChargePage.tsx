import React from "react";
import SharedAddEditPage from "../../shared/SharedAddEditPage";
import AddEditUnitCharge from "../../unitCharge/forms/AddEditUnitCharge";

const AddEditUnitChargePage: React.FC = () => {
  return (
    <SharedAddEditPage
      idParamName="unitChargeId"
      FormComponent={AddEditUnitCharge}
      mapParamToProp={(id) => ({ unitChargeId: id })}
    />
  );
};

export default AddEditUnitChargePage;