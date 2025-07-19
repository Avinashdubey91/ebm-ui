// features/property/apartment/pages/AddEditApartmentPage.tsx
import React from 'react';
import SharedAddEditPage from '../../../shared/SharedAddEditPage';
import AddEditApartment from '../forms/AddEditApartment';

const AddEditApartmentPage: React.FC = () => (
  <SharedAddEditPage<
    /* url param */ 'id',
    /* props-to-form */ { apartmentId?: number }
  >
    /** use the ":id" that is in the generated route */
    idParamName="id"
    /** form component to render */
    FormComponent={AddEditApartment}
    /** map it to the prop name the form expects */
    mapParamToProp={(id: number) => ({ apartmentId: id })}
  />
);

export default AddEditApartmentPage;
