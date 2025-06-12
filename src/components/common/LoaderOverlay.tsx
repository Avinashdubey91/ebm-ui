// src/components/Common/LoaderOverlay.tsx  
import React from "react";

const LoaderOverlay: React.FC<{
  text?: string;
  spinnerClass?: string;
  backgroundColor?: string;
}> = ({
  text = "",
  spinnerClass = "spinner-border big-red-spinner",
  backgroundColor = "rgba(255, 255, 255, 0.8)"
}) => (
  <div
    className="form-overlay"
    style={{ backgroundColor }}
  >
    <div>
      <div className={spinnerClass} role="status" />
      {text && (
        <div className="mt-2 text-muted fw-bold text-center">
          {text}
        </div>
      )}
    </div>
  </div>
);

export default LoaderOverlay;
