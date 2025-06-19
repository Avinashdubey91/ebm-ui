import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AddEditUserForm from '../forms/AddEditUserForm';
import { useCurrentMenu } from '../../../hooks/useCurrentMenu';
import { showUnsavedChangesDialog } from '../../../utils/showUnsavedChangesDialog'; 

declare global {
  interface Window {
    __suppressNavigationGuard?: boolean;
  }
}

const AddEditUserPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();  // 👈 Extract 'id' from route
  const userId = id ? parseInt(id, 10) : undefined;

  const navigate = useNavigate();
  const { parentListPath, singularMenuName } = useCurrentMenu();
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
          {userId ? 'EDIT' : 'ADD NEW'} {singularMenuName.toUpperCase()}
        </h4>
        <div className="pe-2" style={{ flexShrink: 0 }}>
          <button className="btn btn-light btn-md w-100" onClick={handleBack}>
            <i className="fa fa-arrow-left me-2" />
            Back
          </button>
        </div>
      </div>

      <AddEditUserForm
        key={userId ?? 'new'}
        userId={userId}
        onUnsavedChange={setHasUnsavedChanges}
      />
    </div>
  );
};

export default AddEditUserPage;
