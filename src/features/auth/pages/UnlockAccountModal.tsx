import React, { useEffect, useMemo, useState } from "react";
import { sendOtp, verifyOtp, unlockAccount } from "../../../api/otpService";
import PasswordSuccessModal from "./PasswordSuccessModal";
import OverlayMessage from "../../../components/common/OverlayMessage";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUnlocked?: () => void;
  successActionLabel?: string;
}

type Step = "form" | "otp";
type LoadingStage = "" | "sending" | "verifying" | "unlocking";

const UnlockAccountModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onUnlocked,
  successActionLabel = "Done",
}) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>("");

  const isBusy = loadingStage !== "";

  useEffect(() => {
    if (!isOpen) return;

    setUsername("");
    setEmail("");
    setMobile("");
    setOtp("");
    setStep("form");
    setError("");
    setInfoMessage("");
    setShowSuccess(false);
    setLoadingStage("");
  }, [isOpen]);

  const canSendOtp = useMemo(() => {
    if (isBusy) return false;
    return Boolean(username.trim() && email.trim() && mobile.trim());
  }, [isBusy, username, email, mobile]);

  const canVerifyAndUnlock = useMemo(() => {
    if (isBusy) return false;
    return Boolean(
      username.trim() && email.trim() && mobile.trim() && otp.trim(),
    );
  }, [isBusy, username, email, mobile, otp]);

  const handleClose = () => {
    if (isBusy) return;
    onClose();
  };

  const handleMobileChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
    setMobile(digitsOnly);
  };

  const handleSendOtp = async () => {
    setError("");
    setInfoMessage("");

    if (!username.trim() || !email.trim() || !mobile.trim()) {
      setError("Please fill in username, email, and mobile.");
      return;
    }

    try {
      setLoadingStage("sending");

      await sendOtp({
        username: username.trim(),
        email: email.trim(),
      });

      setStep("otp");
      setInfoMessage(
        "OTP sent successfully. Please check your registered channel.",
      );
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoadingStage("");
    }
  };

  const handleVerifyAndUnlock = async () => {
    setError("");
    setInfoMessage("");

    if (!otp.trim()) {
      setError("Please enter OTP.");
      return;
    }

    try {
      setLoadingStage("verifying");

      await verifyOtp({
        username: username.trim(),
        email: email.trim(),
        OTP: otp.trim(),
      });

      setLoadingStage("unlocking");

      await unlockAccount({
        username: username.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        OTP: otp.trim(),
      });

      setShowSuccess(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(
        e?.response?.data?.message ||
          "OTP verification or account unlock failed.",
      );
    } finally {
      setLoadingStage("");
    }
  };

  const handleSuccessAction = () => {
    setShowSuccess(false);

    if (onUnlocked) {
      onUnlocked();
      return;
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="self-solutions-auth-modal-backdrop">
        <div
          className="self-solutions-auth-modal-card"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="unlock-account-title"
        >
          <button
            type="button"
            className="self-solutions-auth-modal-close"
            onClick={handleClose}
            disabled={isBusy}
            aria-label="Close"
          >
            ×
          </button>

          <div className="self-solutions-auth-modal-header">
            <div className="self-solutions-auth-modal-icon">🔓</div>
            <h2 id="unlock-account-title">Unlock Account</h2>
            <p>
              {step === "form"
                ? "Enter your details and request OTP."
                : "Enter the OTP to verify and unlock your account."}
            </p>
          </div>

          <div className="self-solutions-auth-stepper">
            <div
              className={`self-solutions-auth-step ${
                step === "form" ? "active" : "completed"
              }`}
            >
              1. Details
            </div>
            <div
              className={`self-solutions-auth-step ${
                step === "otp" ? "active" : ""
              }`}
            >
              2. OTP Verify
            </div>
          </div>

          <div className="self-solutions-auth-modal-body">
            <div className="self-solutions-auth-grid">
              <div className="self-solutions-auth-field">
                <label htmlFor="ua-username">Username</label>
                <input
                  id="ua-username"
                  className="form-control"
                  placeholder="Enter username"
                  value={username}
                  disabled={isBusy || step === "otp"}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="self-solutions-auth-field">
                <label htmlFor="ua-email">Email</label>
                <input
                  id="ua-email"
                  className="form-control"
                  placeholder="Enter email"
                  value={email}
                  disabled={isBusy || step === "otp"}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="self-solutions-auth-field self-solutions-auth-field-full">
                <label htmlFor="ua-mobile">Mobile</label>
                <input
                  id="ua-mobile"
                  className="form-control"
                  placeholder="Enter mobile number"
                  value={mobile}
                  disabled={isBusy || step === "otp"}
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(e) => handleMobileChange(e.target.value)}
                />
              </div>

              {step === "otp" && (
                <div className="self-solutions-auth-field self-solutions-auth-field-full">
                  <label htmlFor="ua-otp">OTP</label>
                  <input
                    id="ua-otp"
                    className="form-control"
                    placeholder="Enter OTP"
                    value={otp}
                    disabled={isBusy}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>
              )}
            </div>

            {infoMessage && (
              <div className="self-solutions-auth-alert self-solutions-auth-alert-info">
                {infoMessage}
              </div>
            )}

            {error && (
              <div className="self-solutions-auth-alert self-solutions-auth-alert-error">
                {error}
              </div>
            )}
          </div>

          <div className="self-solutions-auth-modal-footer">
            {step === "form" ? (
              <>
                <button
                  type="button"
                  className="btn btn-light self-solutions-auth-secondary-btn"
                  onClick={handleClose}
                  disabled={isBusy}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary self-solutions-auth-primary-btn"
                  onClick={handleSendOtp}
                  disabled={!canSendOtp}
                >
                  Send OTP
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-light self-solutions-auth-secondary-btn"
                  onClick={() => {
                    if (isBusy) return;
                    setStep("form");
                    setOtp("");
                    setError("");
                    setInfoMessage("");
                  }}
                  disabled={isBusy}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn-success self-solutions-auth-primary-btn"
                  onClick={handleVerifyAndUnlock}
                  disabled={!canVerifyAndUnlock}
                >
                  Verify OTP & Unlock
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <PasswordSuccessModal
        isOpen={showSuccess}
        actionLabel={successActionLabel}
        onAction={handleSuccessAction}
      />

      <OverlayMessage
        show={loadingStage !== ""}
        message={
          loadingStage === "sending"
            ? "Sending OTP..."
            : loadingStage === "verifying"
              ? "Verifying OTP..."
              : "Unlocking Account..."
        }
        subMessage={
          loadingStage === "sending"
            ? "Please wait while we generate and deliver OTP."
            : loadingStage === "verifying"
              ? "Please wait while we confirm your OTP."
              : "Finalizing your account unlock request."
        }
      />
    </>
  );
};

export default UnlockAccountModal;
