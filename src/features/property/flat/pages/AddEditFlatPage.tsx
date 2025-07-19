// features/property/flat/pages/AddEditFlatPage.tsx
import React from 'react';
import SharedAddEditPage from '../../../shared/SharedAddEditPage';
import AddEditFlat from '../forms/AddEditFlat';

const AddEditFlatPage: React.FC = () => (
  <SharedAddEditPage<
    /* URL param */ 'id',
    /* Props to Form */ { flatId?: number }
  >
    idParamName="id"
    FormComponent={AddEditFlat}
    mapParamToProp={(id: number) => ({ flatId: id })}
  />
);

export default AddEditFlatPage;
