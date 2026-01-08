import React from 'react';
import './Modal.css';

interface ModalProps {
  type: 'success' | 'error' | 'info';
  message?: string;
  title?: string;
  onClose: () => void;
  children?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ type, message, title, onClose, children }) => {
  return (
    <div className={`modal-backdrop ${type}`}>
      <div className="modal-box">
        <div className="modal-icon">
          {type === 'success' ? '✔️' : type === 'error' ? '❌' : type === 'info' ? 'ℹ️' : ''}
        </div>

        {(title || type === 'success' || type === 'error') && (
          <h2 className="text-black pb-3 font-semibold text-xl">
            {title ?? (type === 'success' ? 'You’re Welcome' : 'Sorry!')}
          </h2>
        )}

        {message && <p className="text-black mb-4 text-sm">{message}</p>}

        {children}

        <button onClick={onClose} className="modal-button">
          {type === 'success' ? 'Close' : 'OK'}
        </button>
      </div>
    </div>
  );
};

export default Modal;
