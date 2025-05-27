// src/features/auth/pages/UnlockAccountModal.tsx
import React, { useState } from 'react';
import Modal from '../../../components/Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const UnlockAccountModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');

  const handleUnlock = async () => {
    try {
      const res = await fetch('/api/Login/unlock-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, mobile })
      });

      if (res.ok) {
        alert('Account unlocked successfully');
        onClose();
      } else {
        const result = await res.json();
        setError(result.message || 'Unlock failed.');
      }
    } catch {
      setError('Something went wrong.');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal type="success" message="" onClose={onClose}>
      <h5>🔓 Unlock Account</h5>
      <input
        type="text"
        placeholder="Username"
        className="form-control mb-2"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email"
        className="form-control mb-2"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <input
        type="tel"
        placeholder="Mobile"
        className="form-control mb-3"
        value={mobile}
        onChange={e => setMobile(e.target.value)}
      />
      {error && <div className="text-danger mb-2">{error}</div>}
      <div className="d-grid">
        <button className="btn btn-warning" onClick={handleUnlock}>
          Unlock
        </button>
      </div>
    </Modal>
  );
};

export default UnlockAccountModal;