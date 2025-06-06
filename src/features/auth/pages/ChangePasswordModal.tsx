import React, { useState, useEffect } from 'react';
import Modal from '../../../components/Modal';
import { sendOtp, verifyOtp } from '../../../api/otpService';
import { changePasswordWithOtp } from '../../../api/passwordService';
import { getUserProfile } from '../../../api/userProfileService';
import PasswordSuccessModal from './PasswordSuccessModal';

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
  defaultUsername = ''
}) => {
  const [username, setUsername] = useState(defaultUsername);
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [OTP, setOtp] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // ✅ For logged-in users: load profile to get email
  useEffect(() => {
    if (!showUsername) {
      const storedUsername = localStorage.getItem('username');
      setUsername(storedUsername || '');

      if (storedUsername) {
        getUserProfile(storedUsername)
          .then((profile) => {
            setEmail(profile.email);
          })
          .catch(() => {
            setError('Failed to fetch user email for OTP.');
          });
      }
    }
  }, [showUsername]);

  const handleSendOtp = async () => {
    if (newPassword !== confirmPassword) {
      setError('New and confirm password do not match.');
      return;
    }

    if (showUsername && (!username || !email || !mobile || !currentPassword)) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const otpPayload = showUsername
      ? { username, email } // For unauthenticated
      : { username };       // For logged-in: don’t send empty email

      await sendOtp(otpPayload);
      setMessage('OTP sent successfully.');
      setError('');
      setStep('otp');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Failed to send OTP.');
    }
  };

  const handleVerifyOtpAndChangePassword = async () => {
    try {
      await verifyOtp({ username, email, OTP });

      const payload = showUsername
        ? {
            username,
            email,
            mobile,
            currentPassword,
            newPassword,
            OTP
          }
        : {
            username,
            newPassword,
            OTP
          };

      await changePasswordWithOtp(payload);

      setMessage('✅ Password changed successfully.');
      setError('');
      setShowSuccess(true); // Show the PasswordSuccessModal
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'OTP verification or password change failed.');
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
                placeholder="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
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

          {step === 'form' ? (
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
                <button className="btn btn-success" onClick={handleVerifyOtpAndChangePassword}>
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
            onClose(); // Close the main modal too
          }}
        />
      </div>
      )}
    </Modal>
  );
};

export default ChangePasswordModal;