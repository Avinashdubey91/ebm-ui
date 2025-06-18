import React from 'react';
import AddEditSociety from '../forms/AddEditSociety';
import SharedAddEditPage from '../../../shared/SharedAddEditPage';

const AddEditSocietyPage: React.FC = () => (
  <SharedAddEditPage idParamName="societyId" FormComponent={AddEditSociety} />
);

export default AddEditSocietyPage;
