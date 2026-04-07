import React from "react";

interface PasswordSuccessModalProps {
  isOpen: boolean;
  onAction: () => void;
  actionLabel?: string;
}

const PasswordSuccessModal: React.FC<PasswordSuccessModalProps> = ({
  isOpen,
  onAction,
  actionLabel = "Done",
}) => {
  if (!isOpen) return null;

  return (
    <div className="self-solutions-success-backdrop" aria-hidden="false">
      <div
        className="self-solutions-success-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-success-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="self-solutions-success-icon">✓</div>
        <h2 id="password-success-title">Password Changed</h2>
        <p>
          Your password has been changed successfully. You can now continue with
          the next step.
        </p>
        <button
          type="button"
          onClick={onAction}
          className="btn btn-primary self-solutions-success-btn"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
};

export default PasswordSuccessModal;