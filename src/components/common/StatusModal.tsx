import React from "react";
import { Modal } from "react-bootstrap";
import "../../styles/_forms.scss";

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
    <Modal show={show} onHide={onClose} centered backdrop="static" className="custom-swal-modal">
      <Modal.Body className="p-0">
        <div className={`swal2-popup-container ${isSuccess ? "success" : "error"}`}>
          <div className="swal2-icon swal2-icon-success animate">
            <div className="swal2-success-circular-line-left"></div>
            <span className="swal2-success-line-tip"></span>
            <span className="swal2-success-line-long"></span>
            <div className="swal2-success-ring"></div>
            <div className="swal2-success-fix"></div>
            <div className="swal2-success-circular-line-right"></div>
          </div>

          <h2 className="swal2-title">{isSuccess ? "Success" : "Error"}</h2>
          <div className="swal2-message">{message}</div>
          <button className="swal2-confirm" onClick={onClose}>Okay</button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default StatusModal;
