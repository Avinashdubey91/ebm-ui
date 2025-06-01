import React from 'react';
import { useNavigate } from 'react-router-dom';
import UserListTable from '../forms/UserListing';

const UserListPage: React.FC = () => {
  const navigate = useNavigate();

  const handleAddUser = () => {
    navigate('/dashboard/users/create');
  };

  return (
    <div>
      {/* Header Container with Your Existing Styles */}
      <div className="inner-area-header-container d-flex align-items-center justify-content-between px-3">
        {/* Centered Title */}
        <h4 className="inner-area-header-title flex-grow-1 text-center m-0">
          MANAGE USERS
        </h4>

        {/* Right-Aligned Button */}
        <div style={{ flexShrink: 0 }}>
          <button className="btn btn-success btn-md" onClick={handleAddUser}>
            <i className="fa fa-plus me-2" />
            Add New User
          </button>
        </div>
      </div>

      <UserListTable />
    </div>
  );
};

export default UserListPage;
