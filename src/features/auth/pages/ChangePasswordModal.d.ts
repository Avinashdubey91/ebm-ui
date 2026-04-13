import React from "react";
interface Props {
    isOpen: boolean;
    onClose: () => void;
    showUsername?: boolean;
    defaultUsername?: string;
    onPasswordChanged?: () => void;
    successActionLabel?: string;
}
declare const ChangePasswordModal: React.FC<Props>;
export default ChangePasswordModal;
