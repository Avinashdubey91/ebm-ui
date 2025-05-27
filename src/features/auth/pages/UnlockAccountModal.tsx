import React, { useState } from "react";
import Modal from "../../../components/Modal";
import { sendOtp, verifyOtp, unlockAccount } from "../../../api/otpService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const UnlockAccountModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [OTP, setOtp] = useState("");
  const [step, setStep] = useState<"form" | "otp" | "success">("form");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  interface OTPResponse {
    message: string;
  }

  const handleSendOtp = async () => {
    try {
      const res = await sendOtp({ username, email });
      const data = res.data as OTPResponse;
      setMessage(data.message);
      setError("");
      setStep("otp");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || "Failed to send OTP.");
    }
  };

  const handleVerifyOtp = async () => {
    try {
        // Step 1: Verify OTP
        await verifyOtp({ username, email, OTP });

        // Step 2: Unlock Account
        const unlockRes = await unlockAccount({ username, email, mobile, OTP });
        const unlockData = unlockRes.data as { message: string };

        setMessage(unlockData.message);
        setError("");
        setStep("success");

        // ⏳ Wait 2.5 seconds before closing to allow user to read success
        setTimeout(() => {
            setMessage("");
            setOtp("");
            setUsername("");
            setEmail("");
            setMobile("");
            setStep("form");
            onClose();
        }, 5000);
    } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } };
        setError(e?.response?.data?.message || "OTP verification or unlock failed.");
    }
    };

  if (!isOpen) return null;

  return (
    <Modal type="success" message={message} onClose={onClose}>
        {step === "form" && (
        <>
            <h5>🔐 Unlock Account</h5>
            <input className="form-control mb-2" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
            <input className="form-control mb-2" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input className="form-control mb-2" placeholder="Mobile" value={mobile} onChange={e => setMobile(e.target.value)} />
            {error && <div className="text-danger">{error}</div>}
            <div className="d-grid">
            <button className="btn btn-primary" onClick={handleSendOtp}>Send OTP</button>
            </div>
        </>
        )}

        {step === "otp" && (
        <>
            <h5>📩 Enter OTP</h5>
            <input className="form-control mb-2" placeholder="Enter OTP" value={OTP} onChange={e => setOtp(e.target.value)} />
            {error && <div className="text-danger">{error}</div>}
            <div className="d-grid">
            <button className="btn btn-success" onClick={handleVerifyOtp}>Verify OTP & Unlock</button>
            </div>
        </>
        )}

        {step === "success" && message && (
            <div className="alert alert-success text-center">{message}</div>
        )}
    </Modal>
    );
};

export default UnlockAccountModal;
