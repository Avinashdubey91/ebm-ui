// src/components/common/OverlayMessage.tsx
import React from "react";

type OverlayMessageProps = {
  message?: string;
  subMessage?: string;
  icon?: React.ReactNode;
  show?: boolean;
  fullScreen?: boolean;
};

const OverlayMessage: React.FC<OverlayMessageProps> = ({
  show = false,
  message = "Please wait...",
  subMessage,
  icon = <i className="fa fa-spinner fa-spin fa-3x" style={{ color: "#0d6efd" }} />,
  fullScreen = true,
}) => {
  if (!show) return null;

  return (
    <div
      style={{
        position: fullScreen ? "fixed" : "absolute",
        top: 0,
        left: 0,
        width: fullScreen ? "100vw" : "100%",
        height: fullScreen ? "100vh" : "100%",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "20px",
      }}
    >
      {icon}
      <h4 className="mt-4 text-success fw-bold">{message}</h4>
      {subMessage && (
        <p className="text-primary fw-medium mt-2">{subMessage}</p>
      )}
    </div>
  );
};

export default OverlayMessage;
