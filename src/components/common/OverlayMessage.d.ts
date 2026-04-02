import React from "react";
type OverlayMessageProps = {
    message?: string;
    subMessage?: string;
    icon?: React.ReactNode;
    show?: boolean;
    fullScreen?: boolean;
};
declare const OverlayMessage: React.FC<OverlayMessageProps>;
export default OverlayMessage;
