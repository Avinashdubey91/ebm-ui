import React from "react";
import SharedAddEditPage from "../../../shared/SharedAddEditPage";
import AddEditSociety from "../forms/AddEditSociety";

const AddEditSocietyPage: React.FC = () => {
  return (
    <SharedAddEditPage<"societyId", { societyId?: number }>
      idParamName="societyId" 
      FormComponent={AddEditSociety}
      mapParamToProp={(id: number) => ({ societyId: id })}
    />
  );
};


export default AddEditSocietyPage;
