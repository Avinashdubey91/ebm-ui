// src/features/shared/SharedAddEditPage.tsx

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCurrentMenu } from '../../hooks/useCurrentMenu';
import { showUnsavedChangesDialog } from '../../utils/showUnsavedChangesDialog';

declare global {
  interface Window {
    __suppressNavigationGuard?: boolean;
  }
}

type SharedAddEditPageProps<TParam extends string, TFormProps extends Record<string, unknown>> = {
  idParamName: TParam;
  FormComponent: React.FC<TFormProps & { onUnsavedChange: (changed: boolean) => void }>;
};

const SharedAddEditPage = <TParam extends string, TFormProps extends Record<string, unknown>>({
  idParamName,
  FormComponent,
}: SharedAddEditPageProps<TParam, TFormProps>) => {
  const params = useParams();
  const navigate = useNavigate();
  const { parentListPath, singularMenuName } = useCurrentMenu();
  const id = params[idParamName];
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleBack = async () => {
    if (hasUnsavedChanges) {
      const shouldLeave = await showUnsavedChangesDialog();
      if (!shouldLeave) return;
    }
    window.__suppressNavigationGuard = true;
    navigate(parentListPath);
  };

  return (
    <div className="page-form">
      <div className="inner-area-header-container d-flex align-items-center justify-content-between px-3">
        <h4 className="inner-area-header-title m-0">
          {id ? 'EDIT' : 'ADD NEW'} {singularMenuName.toUpperCase()}
        </h4>
        <div className="pe-2" style={{ flexShrink: 0 }}>
          <button className="btn btn-light btn-md" onClick={handleBack}>
            <i className="fa fa-arrow-left me-2" />
            Back
          </button>
        </div>
      </div>

      <FormComponent
        key={id ?? 'new'}
        {...({ [idParamName]: id ? parseInt(id, 10) : undefined } as TFormProps)}
        onUnsavedChange={setHasUnsavedChanges}
      />
    </div>
  );
};

export default SharedAddEditPage;
