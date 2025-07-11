// src/features/dashboard/components/Topbar.tsx

import React, { useState, useEffect, useRef } from "react";
import { useDashboardContext } from "../context/useDashboardContext";
import {
  FaUser,
  FaToggleOn,
  FaToggleOff,
  FaSignOutAlt,
  FaCalendarAlt,
} from "react-icons/fa";
import { useNotificationContext } from "../../../hooks/useNotificationContext";
import { Link, useNavigate } from "react-router-dom";
import { getUserProfile } from "../../../api/userProfileService";
import { markNotificationAsRead, markAllNotificationsAsRead,markAllNotificationsAsUnread } from "../../../api/notificationApi";
import type { UserDTO } from "../../../types/UserDTO";
import ChangePasswordModal from "../../auth/pages/ChangePasswordModal";
import { stopNotificationConnection } from "../../../api/signalR";
import OverlayMessage from "../../../components/common/OverlayMessage";
import UserProfileModal from "./UserProfileModal";

const Topbar: React.FC = () => {
  const user = useDashboardContext();
  const navigate = useNavigate();
  const { notifications, setNotifications } = useNotificationContext();

  const [profile, setProfile] = useState<UserDTO | null>(null);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [showChangePwdModal, setShowChangePwdModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const monthRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    if (monthRef.current) {
      monthRef.current.value = `${year}-${month}`;
    }

    const toggleButton = document.getElementById("sidebarToggle");
    const handleToggle = () => {
      const event = new CustomEvent("toggleSidebar");
      window.dispatchEvent(event);
    };

    toggleButton?.addEventListener("click", handleToggle);
    return () => toggleButton?.removeEventListener("click", handleToggle);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node) &&
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (username) {
      getUserProfile(username).then(setProfile).catch(console.error);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = () => {
    if (!isDropdownOpen) setProfileOpen(false);
    setDropdownOpen((prev) => !prev);
  };

  const handleProfileClick = () => {
    if (!isProfileOpen) setDropdownOpen(false);
    setProfileOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true); // 👈 Show spinner overlay

    await stopNotificationConnection(); // ✅ Disconnect SignalR

    // Optional delay for visual effect
    setTimeout(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("userId");
      localStorage.removeItem("status");

      user.setStatus("Offline");
      navigate("/login");
    }, 1500); // 🕒 Delay before redirect
  };

  const markNotificationAsReadHandler = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const toggleStatus = () => {
    const newStatus = user.status === "Online" ? "Offline" : "Online";
    user.setStatus(newStatus);
  };

  const handleMarkAllRead = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    try {
      await markAllNotificationsAsRead(userId);
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleMarkAllUnread = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    try {
      await markAllNotificationsAsUnread(userId);
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: false }))
      );
    } catch (err) {
      console.error("Failed to mark all as unread", err);
    }
  };

  const getInitials = (firstName: string = "", lastName: string = "") => {
    const firstInitial = firstName.trim().charAt(0).toUpperCase();
    const lastInitial = lastName.trim().charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  };

  return (
    <div className="dashboard-ebm-topbar d-flex justify-content-between align-items-center text-white px-3 py-2">
      <div className="dashboard-ebm-topbar-left">
        <button
          className="btn text-white dashboard-ebm-toggle-btn"
          id="sidebarToggle"
        >
          <i className="fas fa-bars fa-lg"></i>
        </button>
        <Link
          to="/dashboard"
          className="dashboard-ebm-brand-title text-white text-decoration-none"
        >
          EBM
        </Link>
      </div>

      <div className="d-flex align-items-center">
        <button className="btn btn-success btn-md ms-3">
          <i className="fa-solid fa-money-check-dollar mr-2"></i> Update Payment
          Status
        </button>
        <button className="btn btn-warning btn-md ms-3">
          <i className="fas fa-money-bill mr-2"></i> Generate Monthly Bill
        </button>

        <div className="dashboard-ebm-month-picker-wrapper position-relative dashboard-ebm-custom-month-wrapper ms-3">
          <input
            type="month"
            ref={monthRef}
            className="form-control form-control-md month-selector"
          />
          <FaCalendarAlt className="dashboard-ebm-custom-calendar-icon" />
        </div>

        {/* Notifications */}
        <div className="dropdown position-relative ms-3" ref={notifRef}>
          <button
            className="btn text-white position-relative"
            onClick={handleNotificationClick}
          >
            <i className="far fa-bell fa-lg"></i>
            {unreadCount > 0 && (
              <span className="badge position-absolute dashboard-ebm-notification-badge">
                {unreadCount}
              </span>
            )}
          </button>
          {isDropdownOpen && (
            <div className="dropdown-menu dropdown-menu-right p-0 show dashboard-ebm-notification-dropdown">
              {/* Sticky Header + Controls */}
              <div
                className="fw-bold border-bottom text-dark mb-1 text-center pt-2 pb-2"
              >
                Notifications
              </div>
              <div className="px-3 pt-2 pb-1 border-bottom bg-white position-sticky top-0 z-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <a
                    href="#"
                    className="text-primary small text-decoration-none"
                    onClick={(e) => {
                      e.preventDefault();
                      handleMarkAllRead();
                    }}
                    title="Mark all notifications as read"
                  >
                    <i className="fas fa-envelope-open-text me-1"></i> Read All
                  </a>
                  <a
                    href="#"
                    className="text-secondary small text-decoration-none"
                    onClick={(e) => {
                      e.preventDefault();
                      handleMarkAllUnread();
                    }}
                    title="Mark all notifications as unread"
                  >
                    <i className="fas fa-envelope me-1"></i> Unread All
                  </a>
                </div>
              </div>

              {/* Notification list */}
              <div
                className="px-2 pt-1 pb-2 custom-scroll"
                style={{ maxHeight: "300px", overflowY: "scroll" }}
              >
                {notifications.map((note) => (
                  <a
                    key={note.notificationId}
                    className="dropdown-item small"
                    href="#"
                    onClick={() =>
                      markNotificationAsReadHandler(note.notificationId)
                    }
                    data-bypass-guard="true"
                  >
                    <strong className={note.isRead ? "fw-normal" : "fw-bold"}>
                      {note.type?.toUpperCase() || "Info"}
                    </strong>
                    <br />
                    <small
                      className={`text-muted ${note.isRead ? "" : "fw-bold"}`}
                    >
                      {note.message}
                    </small>
                  </a>
                ))}
              </div>

              <div className="border-top text-center">
                <a className="dropdown-item text-primary small py-2" href="#">
                  View All
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown Trigger */}
        <div
          className="dropdown dashboard-ebm-profile-dropdown ms-3"
          ref={profileRef}
        >
          <div
            className="dashboard-ebm-avatar-trigger d-flex align-items-center justify-content-center ms-3"
            onClick={handleProfileClick}
            title={`${profile?.firstName} ${profile?.lastName}`}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              cursor: "pointer",
              backgroundColor: "#d40652",
              color: "#fff",
              fontWeight: "bold",
              fontSize: 14,
              userSelect: "none",
              overflow: "hidden",
            }}
          >
            {profile?.profilePicture &&
            profile.profilePicture.trim().toLowerCase() !== "string" ? (
              <img
                src={`${import.meta.env.VITE_API_BASE_URL?.replace(
                  "/api",
                  ""
                )}/${profile.profilePicture}`}
                className="rounded-circle"
                width="36"
                height="36"
                alt="Profile"
                style={{ objectFit: "cover" }}
                onError={(e) => {
                  console.warn("Image not found. Falling back to initials.");
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement!.innerHTML = getInitials(
                    profile?.firstName,
                    profile?.lastName
                  );
                }}
              />
            ) : (
              getInitials(profile?.firstName, profile?.lastName)
            )}
          </div>
          {isProfileOpen && (
            <div className="dropdown-menu dropdown-menu-right show dashboard-ebm-profile-dropdown-menu">
              <div className="dropdown-item-text text-center">
                {profile?.profilePicture &&
                profile.profilePicture.trim().toLowerCase() !== "string" ? (
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL?.replace(
                      "/api",
                      ""
                    )}/${profile.profilePicture}`}
                    className="rounded-circle mb-2"
                    width="64"
                    height="64"
                    alt="Profile"
                    style={{ objectFit: "cover" }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div
                    className="mb-2"
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      backgroundColor: "#d40652",
                      color: "#fff",
                      fontWeight: "bold",
                      fontSize: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto",
                      userSelect: "none",
                    }}
                  >
                    {getInitials(profile?.firstName, profile?.lastName)}
                  </div>
                )}
                <div>
                  <strong className="dashboard-ebm-user-name">
                    {profile?.firstName} {profile?.lastName}
                  </strong>
                </div>
                <small className="text-muted dashboard-ebm-user-role">
                  {profile?.roleName ? `🛡️ ${profile.roleName}` : "User"}
                </small>
                <div className="mt-1">
                  <span
                    className={`badge ${
                      user.status === "Online" ? "bg-success" : "bg-secondary"
                    }`}
                  >
                    {user.status}
                  </span>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <a
                className="dropdown-item toggle-status"
                href="#"
                onClick={(e) => {
                  e.preventDefault(); // ⛔ stop navigation attempt
                  toggleStatus(); // ✅ run the actual handler
                }}
              >
                {user.status === "Online" ? (
                  <FaToggleOn className="me-2 text-success" />
                ) : (
                  <FaToggleOff className="me-2 text-muted" />
                )}
                Set {user.status === "Online" ? "Offline" : "Online"}
              </a>
              <a className="dropdown-item" href="#" onClick={() => setShowProfileModal(true)}>
                <FaUser className="mr-2" /> Profile
              </a>
              <a
                className="dropdown-item"
                href="#"
                onClick={() => setShowChangePwdModal(true)}
              >
                <FaUser className="mr-2" /> Change Password
              </a>
              <a
                className="dropdown-item text-danger"
                href="#"
                onClick={handleLogout}
              >
                <FaSignOutAlt className="mr-2" /> Logout
              </a>
            </div>
          )}
        </div>
      </div>

      {showChangePwdModal && (
        <ChangePasswordModal
          isOpen={showChangePwdModal}
          onClose={() => setShowChangePwdModal(false)}
          showUsername={false}
        />
      )}
      <OverlayMessage
        show={isLoggingOut}
        message="Logging you out..."
        subMessage=""
      />
      {showProfileModal && profile && (
        <UserProfileModal
          isOpen={true}
          onClose={() => setShowProfileModal(false)}
          profile={profile}
        />
      )}

    </div>
  );
};

export default Topbar;
