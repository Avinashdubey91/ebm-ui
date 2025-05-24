import React, { useEffect, useState } from 'react';
import { createUser } from '../../../api/userApi';
import { fetchUserRoles } from '../../../api/userRoleApi';
import type { UserDTO } from '../../../types/user';
import type { UserRole } from '../../../types/UserRole';

const CreateUserForm: React.FC = () => {
  const [formData, setFormData] = useState<UserDTO>({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    address: '',
    pinCode: '',
    userRole: undefined
  });

  const [roles, setRoles] = useState<UserRole[]>([]);

  useEffect(() => {
    fetchUserRoles()
      .then(setRoles)
      .catch(err => console.error("Failed to load roles", err));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'userRole' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const createdBy = localStorage.getItem('username') ?? 'system';
    try {
      await createUser(formData, createdBy);
      alert('✅ User created successfully!');
      setFormData({
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        address: '',
        pinCode: '',
        userRole: undefined
      });
    } catch (err) {
      alert('❌ Failed to create user. Check console.');
      console.error(err);
    }
  };

  return (
    <form className="card p-4 shadow" onSubmit={handleSubmit}>
      <h5 className="mb-3">Create New User</h5>

      <input name="username" placeholder="Username" className="form-control mb-2" value={formData.username} onChange={handleChange} required />
      <input name="firstName" placeholder="First Name" className="form-control mb-2" value={formData.firstName} onChange={handleChange} required />
      <input name="lastName" placeholder="Last Name" className="form-control mb-2" value={formData.lastName} onChange={handleChange} required />
      <input name="email" placeholder="Email" className="form-control mb-2" value={formData.email} onChange={handleChange} />
      <input name="mobile" placeholder="Mobile" className="form-control mb-2" value={formData.mobile} onChange={handleChange} />
      <input name="address" placeholder="Address" className="form-control mb-2" value={formData.address} onChange={handleChange} />
      <input name="pinCode" placeholder="Pin Code" className="form-control mb-2" value={formData.pinCode} onChange={handleChange} />

      <div className="mb-3">
        <label htmlFor="userRole" className="form-label">User Role</label>
        <select
          id="userRole"
          name="userRole"
          className="form-select"
          value={formData.userRole ?? ''}
          onChange={handleChange}
          required
        >
          <option value="">-- Select Role --</option>
          {roles.map(role => (
            <option key={role.userRoleId} value={role.userRoleId}>
              {role.roleName}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="btn btn-primary">Create User</button>
    </form>
  );
};

export default CreateUserForm;
