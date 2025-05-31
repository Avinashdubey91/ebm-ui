// src/features/users/pages/UserListPage.tsx
import React from 'react';
import UserListTable from '../forms/UserListing';

const UserListPage: React.FC = () => {
  return (
    <div className="">
      <div className="inner-area-header-container">
        <h4 className="inner-area-header-title">User List</h4>
      </div>
      <UserListTable />
    </div>
  );
};

export default UserListPage;
