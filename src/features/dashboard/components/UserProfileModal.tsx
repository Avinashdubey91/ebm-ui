import React from "react";
import { FaCopy } from "react-icons/fa";
import { toTitleCase, safeValue, formatDate } from "../../../utils/format";
import type { UserDTO } from "../../../types/UserDTO";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: UserDTO | null;
}

const UserProfileModal: React.FC<Props> = ({ isOpen, onClose, profile }) => {
  if (!isOpen || !profile) return null;

  const imageUrl =
    profile.profilePicture &&
    profile.profilePicture.trim().toLowerCase() !== "string"
      ? `${import.meta.env.VITE_API_BASE_URL?.replace("/api", "")}/${profile.profilePicture}`
      : "/assets/default-avatar.png";

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="user-modal-overlay">
      <div className="user-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="user-modal-content">
          {/* Top Gray Section */}
          <div className="user-modal-header">
            <img
              src={imageUrl}
              alt="Profile"
              className="user-modal-avatar"
            />
          </div>
          <div className="user-modal-close-circle" onClick={onClose} title="Close"></div>
          {/* Info Section */}
          <div className="user-modal-body">
            {/* Header Info */}
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div>
                <div className="d-flex align-items-center">
                  <h5 className="fw-bold mb-0 text-dark">
                    {profile.firstName} {profile.lastName}
                  </h5>
                  <span className="ms-2 text-primary fs-6 fw-bold">({profile.userName})</span>
                </div>
                <div className="text-dark small mt-1">{profile.email}</div>
              </div>
              <button className="btn btn-outline-success btn-sm" onClick={handleCopy}>
                <FaCopy className="me-2" />
                Copy Profile link
              </button>
            </div>

            {/* Name */}
            <div className="row align-items-center mb-2">
              <label className="col-md-3 col-form-label text-dark fw-bold">Name</label>
              <div className="col-md-5">
                <input className="form-control" value={profile.firstName} readOnly />
              </div>
              <div className="col-md-4">
                <input className="form-control" value={profile.lastName} readOnly />
              </div>
            </div>

            {/* DOB */}
            <div className="row align-items-center mb-2">
              <label className="col-md-3 col-form-label text-dark fw-bold">Date of Birth</label>
              <div className="col-md-9">
                <input className="form-control" value={formatDate(profile.dob) || "-"} readOnly />
              </div>
            </div>

            {/* Address Line 1 */}
            <div className="row align-items-center mb-2">
              <label className="col-md-3 col-form-label text-dark fw-bold">Address Line 1</label>
              <div className="col-md-9">
                <input className="form-control" value={profile.addressLine1 || "-"} readOnly />
              </div>
            </div>

            {/* Street & City */}
            <div className="row align-items-center mb-2">
              <label className="col-md-3 col-form-label text-dark fw-bold">Street</label>
              <div className="col-md-4">
                <input className="form-control" value={safeValue(profile.street) || "-"} readOnly />
              </div>
              <label className="col-md-1 col-form-label text-dark fw-bold">City</label>
              <div className="col-md-4">
                <input className="form-control" value={safeValue(profile.city) || "-"} readOnly />
              </div>
            </div>

            {/* District & State */}
            <div className="row align-items-center mb-2">
              <label className="col-md-3 col-form-label text-dark fw-bold">District</label>
              <div className="col-md-4">
                <input className="form-control" value={profile.districtName ? toTitleCase(profile.districtName) : "-"} readOnly />
              </div>
              <label className="col-md-1 col-form-label text-dark fw-bold">State</label>
              <div className="col-md-4">
                <input className="form-control" value={profile.stateName ? toTitleCase(profile.stateName) : "-"} readOnly />
              </div>
            </div>

            {/* Country & Pin Code */}
            <div className="row align-items-center mb-2">
              <label className="col-md-3 col-form-label text-dark fw-bold">Country</label>
              <div className="col-md-4">
                <input className="form-control" value={profile.countryName || "-"} readOnly />
              </div>
              <label className="col-md-1 col-form-label text-dark fw-bold">Pin</label>
              <div className="col-md-4">
                <input className="form-control" value={profile.pinCode || "-"} readOnly />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
