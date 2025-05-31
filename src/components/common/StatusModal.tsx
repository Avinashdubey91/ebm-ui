import React from "react";
import { Modal } from "react-bootstrap";
import { FaCheck, FaTimes } from "react-icons/fa";
import "../../styles/_forms.scss"; // make sure it’s imported here or globally

interface StatusModalProps {
  show: boolean;
  onClose: () => void;
  message: string;
  isSuccess: boolean;
}

const StatusModal: React.FC<StatusModalProps> = ({
  show,
  onClose,
  message,
  isSuccess,
}) => {
  return (
    <Modal show={show} onHide={onClose} centered backdrop="static">
      <Modal.Body className="status-modal-content">
        <div
          className={`status-modal-icon ${
            isSuccess ? "status-success-icon" : "status-error-icon"
          }`}
        >
          {isSuccess ? <FaCheck size={36} /> : <FaTimes size={36} />}
        </div>
        <div className="status-modal-title">
          {isSuccess ? "SUCCESS" : "ERROR"}
        </div>
        <div className="status-modal-message">{message}</div>
        <button
          className={`status-modal-button ${isSuccess ? "success" : "error"}`}
          onClick={onClose}
        >
          {isSuccess ? "Continue" : "Try Again Later"}
        </button>
      </Modal.Body>
    </Modal>
  );
};

export default StatusModal;
