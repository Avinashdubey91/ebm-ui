import React from 'react';
import './Modal.css';
interface ModalProps {
    type: 'success' | 'error' | 'info';
    message?: string;
    title?: string;
    onClose: () => void;
    children?: React.ReactNode;
}
declare const Modal: React.FC<ModalProps>;
export default Modal;
