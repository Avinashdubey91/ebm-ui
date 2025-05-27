// src/components/Modal.tsx
import React from 'react';
import './Modal.css';

interface ModalProps {
  type: 'success' | 'error';
  message?: string;
  onClose: () => void;
  children?: React.ReactNode; // ✅ NEW: to support form UIs
}

const Modal: React.FC<ModalProps> = ({ type, message, onClose, children }) => {
  return (
    <div className={`modal-backdrop ${type}`}>
      <div className="modal-box">
        <div className="modal-icon">
          {type === 'success' ? '✔️' : type === 'error' ? '❌' : ''}
        </div>

        <h2>{type === 'success' ? "You're Welcome" : type === 'error' ? 'Sorry!' : ''}</h2>

        {/* ✅ Conditional content area */}
        {message && <p>{message}</p>}
        {children}

        <button onClick={onClose} className="modal-button">
          {type === 'success' ? 'Close' : 'OK'}
        </button>
      </div>
    </div>
  );
};

export default Modal;
