import React from 'react';
import './Modal.css'; // style like your screenshots

interface ModalProps {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ type, message, onClose }) => {
  return (
    <div className={`modal-backdrop ${type}`}>
      <div className="modal-box">
        <div className="modal-icon">
          {type === 'success' ? '✔️' : '❌'}
        </div>
        <h2>{type === 'success' ? "You're Welcome" : 'Sorry!'}</h2>
        <p>{message}</p>
        <button onClick={onClose} className="modal-button">
          {type === 'success' ? 'Close' : 'OK'}
        </button>
      </div>
    </div>
  );
};

export default Modal;
