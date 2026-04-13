import React from "react";
interface PasswordSuccessModalProps {
    isOpen: boolean;
    onAction: () => void;
    actionLabel?: string;
}
declare const PasswordSuccessModal: React.FC<PasswordSuccessModalProps>;
export default PasswordSuccessModal;
