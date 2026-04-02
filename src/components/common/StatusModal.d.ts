import React from "react";
import "../../styles/_forms.scss";
interface StatusModalProps {
    show: boolean;
    onClose: () => void;
    message: string;
    isSuccess: boolean;
}
declare const StatusModal: React.FC<StatusModalProps>;
export default StatusModal;
