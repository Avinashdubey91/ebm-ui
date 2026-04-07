import React, { useEffect, useMemo, useState } from "react";
import { sendOtp, verifyOtp } from "../../../api/otpService";
import { changePasswordWithOtp } from "../../../api/passwordService";
import { getUserProfile } from "../../../api/userProfileService";
import PasswordSuccessModal from "./PasswordSuccessModal";
import OverlayMessage from "../../../components/common/OverlayMessage";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  showUsername?: boolean;
  defaultUsername?: string;
  onPasswordChanged?: () => void;
  successActionLabel?: string;
}

type Step = "form" | "otp";
type LoadingStage = "" | "sending" | "verifying" | "verified" | "finalizing";

const ChangePasswordModal: React.FC<Props> = ({
  isOpen,
  onClose,
  showUsername = false,
  defaultUsername = "",
  onPasswordChanged,
  successActionLabel,
}) => {
  const [username, setUsername] = useState(defaultUsername);
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>("");

  const isBusy = loadingStage !== "";

  useEffect(() => {
    if (!isOpen) return;

    setUsername(defaultUsername || "");
    setEmail("");
    setMobile("");
    setNewPassword("");
    setConfirmPassword("");
    setOtp("");
    setStep("form");
    setError("");
    setInfoMessage("");
    setShowSuccess(false);
    setLoadingStage("");
  }, [isOpen, defaultUsername]);

  useEffect(() => {
    if (!isOpen) return;
    if (showUsername) return;

    const storedUsername = localStorage.getItem("username") || defaultUsername || "";
    setUsername(storedUsername);

    if (!storedUsername) return;

    getUserProfile(storedUsername)
      .then((profile) => {
        setEmail(profile.email ?? "");
      })
      .catch(() => {
        setError("Failed to fetch user details.");
      });
  }, [isOpen, showUsername, defaultUsername]);

  const passwordMismatch =
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPassword !== confirmPassword;

  const passwordTooShort = newPassword.length > 0 && newPassword.length < 4;

  const canGenerateOtp = useMemo(() => {
    if (isBusy) return false;
    if (!newPassword || !confirmPassword) return false;
    if (passwordMismatch || passwordTooShort) return false;

    if (showUsername) {
      return Boolean(username.trim() && email.trim() && mobile.trim());
    }

    return Boolean(username.trim());
  }, [
    isBusy,
    newPassword,
    confirmPassword,
    passwordMismatch,
    passwordTooShort,
    showUsername,
    username,
    email,
    mobile,
  ]);

  const canVerifyAndChange = useMemo(() => {
    if (isBusy) return false;
    return Boolean(otp.trim() && username.trim());
  }, [isBusy, otp, username]);

  const handleClose = () => {
    if (isBusy) return;
    onClose();
  };

  const handleSendOtp = async () => {
    setError("");
    setInfoMessage("");

    if (passwordMismatch) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (passwordTooShort) {
      setError("Password must be at least 4 characters.");
      return;
    }

    if (showUsername && (!username.trim() || !email.trim() || !mobile.trim())) {
      setError("Please fill in username, email, and mobile.");
      return;
    }

    if (!showUsername && !username.trim()) {
      setError("Username is required.");
      return;
    }

    try {
      setLoadingStage("sending");

      const otpPayload = showUsername
        ? { username: username.trim(), email: email.trim() }
        : { username: username.trim() };

      await sendOtp(otpPayload);

      setStep("otp");
      setInfoMessage("OTP sent successfully. Please check your registered channel.");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoadingStage("");
    }
  };

  const handleVerifyOtpAndChangePassword = async () => {
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

      setLoadingStage("verified");
      await new Promise((resolve) => setTimeout(resolve, 900));

      setLoadingStage("finalizing");

      const payload = showUsername
        ? {
            username: username.trim(),
            email: email.trim(),
            mobile: mobile.trim(),
            newPassword,
            OTP: otp.trim(),
          }
        : {
            username: username.trim(),
            newPassword,
            OTP: otp.trim(),
          };

      await changePasswordWithOtp(payload);

      setShowSuccess(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(
        e?.response?.data?.message ||
          "OTP verification or password change failed."
      );
    } finally {
      setLoadingStage("");
    }
  };

  const handleSuccessAction = () => {
    setShowSuccess(false);

    if (onPasswordChanged) {
      onPasswordChanged();
      return;
    }

    onClose();
  };

  const resolvedSuccessActionLabel =
    successActionLabel || (showUsername ? "Back to Login" : "Done");

  if (!isOpen) return null;

  return (
    <>
      <div className="self-solutions-auth-modal-backdrop">
        <div
          className="self-solutions-auth-modal-card"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-password-title"
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
            <div className="self-solutions-auth-modal-icon">🔐</div>
            <h2 id="change-password-title">Change Password</h2>
            <p>
              {step === "form"
                ? "Enter your details and generate OTP."
                : "Enter the OTP to verify and complete password change."}
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
            {showUsername && (
              <div className="self-solutions-auth-grid">
                <div className="self-solutions-auth-field">
                  <label htmlFor="cp-username">Username</label>
                  <input
                    id="cp-username"
                    className="form-control"
                    placeholder="Enter username"
                    value={username}
                    disabled={isBusy}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                <div className="self-solutions-auth-field">
                  <label htmlFor="cp-email">Email</label>
                  <input
                    id="cp-email"
                    className="form-control"
                    placeholder="Enter email"
                    value={email}
                    disabled={isBusy}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="self-solutions-auth-field self-solutions-auth-field-full">
                  <label htmlFor="cp-mobile">Mobile</label>
                  <input
                    id="cp-mobile"
                    className="form-control"
                    placeholder="Enter mobile number"
                    value={mobile}
                    disabled={isBusy}
                    onChange={(e) => setMobile(e.target.value)}
                  />
                </div>
              </div>
            )}

            {!showUsername && (
              <div className="self-solutions-auth-readonly-chip">
                <span>Username</span>
                <strong>{username || "Not available"}</strong>
              </div>
            )}

            {step === "form" ? (
              <div className="self-solutions-auth-grid">
                <div className="self-solutions-auth-field">
                  <label htmlFor="cp-new-password">New Password</label>
                  <input
                    id="cp-new-password"
                    className="form-control"
                    placeholder="Enter new password"
                    type="password"
                    value={newPassword}
                    disabled={isBusy}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="self-solutions-auth-field">
                  <label htmlFor="cp-confirm-password">Confirm Password</label>
                  <input
                    id="cp-confirm-password"
                    className="form-control"
                    placeholder="Confirm new password"
                    type="password"
                    value={confirmPassword}
                    disabled={isBusy}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="self-solutions-auth-grid">
                <div className="self-solutions-auth-field self-solutions-auth-field-full">
                  <label htmlFor="cp-otp">OTP</label>
                  <input
                    id="cp-otp"
                    className="form-control"
                    placeholder="Enter OTP"
                    value={otp}
                    disabled={isBusy}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>
              </div>
            )}

            {infoMessage && (
              <div className="self-solutions-auth-alert self-solutions-auth-alert-info">
                {infoMessage}
              </div>
            )}

            {(passwordMismatch || passwordTooShort || error) && (
              <div className="self-solutions-auth-alert self-solutions-auth-alert-error">
                {error ||
                  (passwordMismatch
                    ? "New password and confirm password do not match."
                    : "Password must be at least 4 characters.")}
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
                  disabled={!canGenerateOtp}
                >
                  Generate OTP
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
                  onClick={handleVerifyOtpAndChangePassword}
                  disabled={!canVerifyAndChange}
                >
                  Verify OTP & Change Password
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <PasswordSuccessModal
        isOpen={showSuccess}
        actionLabel={resolvedSuccessActionLabel}
        onAction={handleSuccessAction}
      />

      <OverlayMessage
        show={loadingStage !== ""}
        message={
          loadingStage === "sending"
            ? "Sending OTP..."
            : loadingStage === "verifying"
            ? "Verifying OTP..."
            : loadingStage === "verified"
            ? "✅ OTP Verified Successfully"
            : "Updating Password..."
        }
        subMessage={
          loadingStage === "sending"
            ? "Please wait while we generate and deliver OTP."
            : loadingStage === "verifying"
            ? "Please wait while we confirm your OTP."
            : loadingStage === "verified"
            ? "Password update will begin shortly..."
            : "Finalizing your password update."
        }
      />
    </>
  );
};

export default ChangePasswordModal;