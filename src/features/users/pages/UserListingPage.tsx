import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserListTable from '../forms/UserListing';
import { useCurrentMenu } from '../../../hooks/useCurrentMenu';

const UserListingPage: React.FC = () => { const navigate = useNavigate();

  const { singularMenuName, pluralMenuName, createRoutePath  } = useCurrentMenu();

  const handleAddUser = () => {
  if (createRoutePath) {
    navigate(createRoutePath);
  } else {
    console.warn("⚠️ No dynamic create path found for current menu");
  }
};
  useEffect(() => {
    console.log("✅ UserListPage mounted");
  }, []);

  return (
    <div className="page-listing">
      <div className="inner-area-header-container d-flex align-items-center justify-content-between px-3">
        <h4 className="inner-area-header-title flex-grow-1 text-center m-0">
          MANAGE {pluralMenuName.toUpperCase()}
        </h4>
        <div style={{ flexShrink: 0 }}>
          <button className="btn btn-success btn-md" onClick={handleAddUser}>
            <i className="fa fa-plus me-2" />
            Add New {singularMenuName}
          </button>
        </div>
      </div>
      <UserListTable />
    </div>
  );
};

export default UserListingPage;
