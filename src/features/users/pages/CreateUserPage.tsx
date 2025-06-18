import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CreateUserForm from '../forms/CreateUserForm';
import { useCurrentMenu } from '../../../hooks/useCurrentMenu';
import { showUnsavedChangesDialog } from '../../../utils/showUnsavedChangesDialog'; 

declare global {
  interface Window {
    __suppressNavigationGuard?: boolean;
  }
}

const CreateUserPage: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const { parentListPath, singularMenuName } = useCurrentMenu(); // ✅ Get dynamic path
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleBack = async () => {
  if (hasUnsavedChanges) {
    const shouldLeave = await showUnsavedChangesDialog();
    if (!shouldLeave) return;
  }

  // ✅ Suppress popstate-based guard
  window.__suppressNavigationGuard = true;

  // ✅ Go directly to the fallback route — safer
  navigate(parentListPath);
};


  return (
    <div className="page-form">
      <div className="inner-area-header-container d-flex align-items-center justify-content-between px-3">
        <h4 className="inner-area-header-title m-0">
          {userId ? 'EDIT' : 'ADD NEW'} {singularMenuName.toUpperCase()}
        </h4>
        <div className="pe-2" style={{ flexShrink: 0 }}>
          <button className="btn btn-light btn-md" onClick={handleBack}>
            <i className="fa fa-arrow-left me-2" />
            Back
          </button>
        </div>
      </div>

      <CreateUserForm
        key={userId ?? 'new'}
        userId={userId ? parseInt(userId, 10) : undefined}
         onUnsavedChange={setHasUnsavedChanges}
      />
    </div>
  );
};

export default CreateUserPage;
