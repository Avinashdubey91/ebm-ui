import React from 'react';
import { useParams } from 'react-router-dom';
import CreateUserForm from '../forms/CreateUserForm';

const CreateUserPage: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  return (
    <div className="page-form">
      <div className="inner-area-header-container">
        <h4 className="inner-area-header-title">{userId ? 'EDIT USER' : 'ADD NEW USER'}</h4>
      </div>
      <CreateUserForm key={userId ?? 'new'} userId={userId ? parseInt(userId, 10) : undefined} />
    </div>
  );
};

export default CreateUserPage;
