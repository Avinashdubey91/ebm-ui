import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Modal from "../../../components/Modal";
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
}

const ChangePasswordModal: React.FC<Props> = ({
  isOpen,
  onClose,
  showUsername = false,
  defaultUsername = "",
}) => {
  const [username, setUsername] = useState(defaultUsername);
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [OTP, setOtp] = useState("");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const [loadingStage, setLoadingStage] = useState<
    "" | "sending" | "verifying" | "verified" | "finalizing"
  >("");

  useEffect(() => {
    if (!showUsername) {
      const storedUsername = localStorage.getItem("username");
      setUsername(storedUsername || "");

      if (storedUsername) {
        getUserProfile(storedUsername)
          .then((profile) => setEmail(profile.email))
          .catch(() => setError("Failed to fetch user email for OTP."));
      }
    }
  }, [showUsername]);

  const handleSendOtp = async () => {
    setError("");
    setMessage("");
    setLoadingStage("sending");

    if (newPassword !== confirmPassword) {
      setLoadingStage("");
      setError("New and confirm password do not match.");
      return;
    }

    if (showUsername && (!username || !email || !mobile)) {
      setLoadingStage("");
      setError("Please fill in all required fields.");
      return;
    }

    try {
      const otpPayload = showUsername ? { username, email } : { username };
      await sendOtp(otpPayload);
      setMessage("OTP sent successfully.");
      setStep("otp");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoadingStage("");
    }
  };

  const handleVerifyOtpAndChangePassword = async () => {
    setError("");
    setMessage("");
    setLoadingStage("verifying");

    try {
      await verifyOtp({ username, email, OTP });

      // ✅ Intermediate stage: OTP Verified
      setLoadingStage("verified");
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Delay for 1.5s

      // ✅ Start password update
      setLoadingStage("finalizing");

      const payload = showUsername
        ? { username, email, mobile, newPassword, OTP }
        : { username, newPassword, OTP };

      await changePasswordWithOtp(payload);

      setMessage("✅ Password changed successfully.");
      setShowSuccess(true);

      await Swal.fire({
        icon: "success",
        title: "Password changed successfully",
        text: "You can now log in using your new password.",
        confirmButtonColor: "#0d6efd",
      });

      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(
        e?.response?.data?.message ||
          "OTP verification or password change failed."
      );
    } finally {
      setLoadingStage(""); // Reset the spinner
    }
  };

  if (!isOpen) return null;

  return (
    <Modal type="success" message={message} onClose={onClose}>
      {!showSuccess && (
        <div>
          <div className="text-black">
            <h5 className="mb-3">🔐 Change Password</h5>

            {showUsername && (
              <>
                <input
                  className="form-control mb-2"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <input
                  className="form-control mb-2"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  className="form-control mb-2"
                  placeholder="Mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </>
            )}

            {step === "form" ? (
              <>
                <input
                  className="form-control mb-2"
                  placeholder="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <input
                  className="form-control mb-2"
                  placeholder="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {error && <p className="text-danger small">{error}</p>}
                <div className="d-grid">
                  <button className="btn btn-primary" onClick={handleSendOtp}>
                    Generate OTP
                  </button>
                </div>
              </>
            ) : (
              <>
                <input
                  className="form-control mb-2"
                  placeholder="Enter OTP"
                  value={OTP}
                  onChange={(e) => setOtp(e.target.value)}
                />
                {error && <p className="text-danger small">{error}</p>}
                <div className="d-grid">
                  <button
                    className="btn btn-success"
                    onClick={handleVerifyOtpAndChangePassword}
                  >
                    Verify OTP & Change Password
                  </button>
                </div>
              </>
            )}
          </div>

          <PasswordSuccessModal
            isOpen={showSuccess}
            onClose={() => {
              setShowSuccess(false);
              onClose();
            }}
          />
        </div>
      )}
        {/* ✅ Dynamic Spinner Overlay */}
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
    </Modal>
  );
};

export default ChangePasswordModal;
