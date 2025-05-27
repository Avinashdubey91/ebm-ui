import React, { useEffect, useState } from 'react';
import { createUser } from '../../../api/userApi';
import { fetchUserRoles } from '../../../api/userRoleApi';
import type { UserDTO } from '../../../types/UserDTO';
import type { UserRole } from '../../../types/UserRole';
import FormLabel from '../../../components/common/FormLabel';

const CreateUserForm: React.FC = () => {
  const [formData, setFormData] = useState<UserDTO>({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    address: '',
    pinCode: '',
    roleId: undefined, // ✅ Correct key
  });

  const [roles, setRoles] = useState<UserRole[]>([]);

  useEffect(() => {
    console.log("📌 useEffect fired to fetch roles");
    fetchUserRoles()
      .then((roles) => {
        console.log("✅ Loaded roles from API:", roles);
        setRoles(roles);
      })
      .catch(err => console.error("❌ Failed to load roles", err));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'roleId' ? parseInt(value, 10) : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      username: '',
      firstName: '',
      lastName: '',
      email: '',
      mobile: '',
      address: '',
      pinCode: '',
      roleId: undefined,
    });
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement> | { preventDefault: () => void }
  ) => {
    e.preventDefault();
    const createdBy = localStorage.getItem('username') ?? 'system';
    try {
      await createUser(formData, createdBy);
      alert('✅ User created successfully!');
      resetForm();
    } catch (err) {
      alert('❌ Failed to create user. Check console.');
      console.error(err);
    }
  };

  const handleSaveAndNext = () => {
    const fakeFormEvent = { preventDefault: () => {} };
    handleSubmit(fakeFormEvent);
  };

  return (
    <>
      <div className="bg-light border-bottom py-3 px-4 mb-4" style={{ width: '100%' }}>
        <h4 className="m-0 text-primary d-flex align-items-center">Add New User</h4>
      </div>

      <form onSubmit={(e) => handleSubmit(e)}>
        <div className="row">
          <div className="col-md-6 mb-3">
            <FormLabel label="Username" htmlFor="username" required />
            <input
              id="username"
              name="username"
              className="form-control"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <FormLabel label="First Name" htmlFor="firstName" required />
            <input
              id="firstName"
              name="firstName"
              className="form-control"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <FormLabel label="Last Name" htmlFor="lastName" required />
            <input
              id="lastName"
              name="lastName"
              className="form-control"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <FormLabel label="Email" htmlFor="email" />
            <input
              id="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              type="email"
            />
          </div>

          <div className="col-md-6 mb-3">
            <FormLabel label="Mobile" htmlFor="mobile" />
            <input
              id="mobile"
              name="mobile"
              className="form-control"
              value={formData.mobile}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-6 mb-3">
            <FormLabel label="Address" htmlFor="address" />
            <input
              id="address"
              name="address"
              className="form-control"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-6 mb-3">
            <FormLabel label="Pin Code" htmlFor="pinCode" />
            <input
              id="pinCode"
              name="pinCode"
              className="form-control"
              value={formData.pinCode}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-6 mb-3">
            <FormLabel label="User Role" htmlFor="roleId" required />
            <select
              id="roleId"
              name="roleId"
              className="form-select"
              value={formData.roleId !== undefined ? String(formData.roleId) : ''}
              onChange={handleChange}
              required
            >
              <option value="">-- Select Role --</option>
              {roles.map((role) =>
                role.userRoleId !== undefined ? (
                  <option key={role.userRoleId} value={String(role.userRoleId)}>
                    {role.roleName}
                  </option>
                ) : null
              )}
            </select>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2 mt-3">
          <button type="submit" className="btn btn-success">
            <i className="fa fa-save me-2"></i>Save
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={resetForm}
          >
            <i className="fa fa-undo me-2"></i>Reset
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSaveAndNext}
          >
            <i className="fa fa-plus me-2"></i>Save & Next
          </button>
        </div>
      </form>
    </>
  );
};

export default CreateUserForm;
