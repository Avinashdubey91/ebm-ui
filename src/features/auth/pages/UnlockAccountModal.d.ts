import React from "react";
interface Props {
    isOpen: boolean;
    onClose: () => void;
    onUnlocked?: () => void;
    successActionLabel?: string;
}
declare const UnlockAccountModal: React.FC<Props>;
export default UnlockAccountModal;
