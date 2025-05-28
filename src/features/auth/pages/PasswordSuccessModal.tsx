import React from 'react';

interface PasswordSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PasswordSuccessModal: React.FC<PasswordSuccessModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      style={{ backgroundColor: 'transparent' }}
    >
      <div className="bg-white shadow-xl rounded-xl p-6 w-80 text-center pointer-events-auto">
        <div className="text-green-500 text-5xl mb-4">✓</div>
        <h2 className="text-xl text-black font-bold">Password Changed!</h2>
        <p className="text-sm text-black">Your password has been changed successfully.</p>
        <button
          onClick={onClose}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-all"
        >
          Back to My App
        </button>
      </div>
    </div>
  );
};

export default PasswordSuccessModal;