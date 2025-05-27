// src/features/auth/pages/ChangePasswordModal.tsx
import React, { useState } from 'react';
import Modal from '../../../components/Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  showUsername?: boolean;
  defaultUsername?: string;
}

const ChangePasswordModal: React.FC<Props> = ({
  isOpen,
  onClose,
  showUsername = false,
  defaultUsername = ''
}) => {
  const [username, setUsername] = useState(defaultUsername);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleChange = async () => {
    if (newPassword !== confirmPassword) {
      setError('New and confirm password do not match.');
      return;
    }

    try {
      const loginId = localStorage.getItem('userId');

      const payload = {
        loginId: parseInt(loginId || '0'),
        oldPassword,
        newPassword
      };

      const res = await fetch('/api/Login/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Password changed successfully');
        onClose();
      } else {
        const result = await res.json();
        setError(result.message || 'Failed to change password.');
      }
    } catch {
      setError('Something went wrong. Try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal type="success" message="" onClose={onClose}>
      <div>
        <h5 className="mb-3">🔒 Change Password</h5>
        {showUsername && (
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
        )}
        <div className="mb-3">
          <input
            type="password"
            className="form-control"
            placeholder="Old Password"
            value={oldPassword}
            onChange={e => setOldPassword(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <input
            type="password"
            className="form-control"
            placeholder="New Password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <input
            type="password"
            className="form-control"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-danger small">{error}</p>}
        <div className="d-grid">
          <button className="btn btn-primary" onClick={handleChange}>
            Change Password
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ChangePasswordModal;
