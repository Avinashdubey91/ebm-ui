import React, { useEffect, useState } from "react";
import "./login.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useNavigate } from "react-router-dom";

import { getGreeting } from "../../../utils/dateUtils";
import { loginUser } from "../authService";
import { clearSession } from "../../../utils/session";
import { stopNotificationConnection, startNotificationConnection } from "../../../api/signalR";

import Modal from "../../../components/Modal";
import ChangePasswordModal from "./ChangePasswordModal";
import UnlockAccountModal from "./UnlockAccountModal";
import { UseAuth } from "../../../context/UseAuth";

type ErrorResponse = {
  response?: {
    data?: { message?: string };
  };
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = UseAuth(); // 👈 Use hook that updates context state

  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [modalType, setModalType] = useState<"success" | "error" | null>(null);
  const [modalMessage, setModalMessage] = useState("");
  const [showChangePwdModal, setShowChangePwdModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  useEffect(() => {
    clearSession();
    stopNotificationConnection();
    console.log("🧹 Session forcibly cleared via /login route");
  }, []);

  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleLogin = async () => {
    try {
      const response = await loginUser({ userName: username, password });

      if (!response.userId || !response.token) {
        throw new Error("Invalid login response: Missing user ID or token");
      }

      setAuth(response.token, response.userId.toString());
      localStorage.setItem("username", username);
      localStorage.setItem("status", "Online");

      await startNotificationConnection((notification) => {
        console.log("🔔 Notification:", notification);
      }, response.token);

      setModalType("success");
      setModalMessage("Login Successful.");

      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (error: unknown) {
      const err = error as ErrorResponse;
      const msg =
        err.response?.data?.message || "An unexpected error occurred.";
      setModalType("error");
      setModalMessage(msg);
    }
  };

  const closeModal = () => {
    setModalType(null);
    setModalMessage("");
  };

  return (
    <div className="self-solutions-login-body">
      <div className="self-solutions-login-full-page">
        {/* Left Side */}
        <div className="self-solutions-login-left-side">
          <div>Picture 1</div>
          <div>Picture 2</div>
          <div>Picture 3</div>
          <div>Picture 4</div>
        </div>

        {/* Right Side */}
        <div className="self-solutions-login-right-side">
          <div className="self-solutions-login-login-box">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
            >
              <div className="self-solutions-login-greeting-text mb-4 text-start">
                <h5>Hello!</h5>
                <h3>{getGreeting()}</h3>
              </div>

              <h4 className="self-solutions-login-login-title">
                Login to Self Solutions
              </h4>

              <div className="mb-3">
                <div className="input-group self-solutions-login-input-group">
                  <span className="input-group-text">
                    <i className="fa fa-user fa-lg"></i>
                  </span>
                  <input
                    type="text"
                    id="txtUserName"
                    className="form-control"
                    placeholder="Enter User Name"
                    autoComplete="current-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-3">
                <div className="input-group self-solutions-login-input-group">
                  <span className="input-group-text">
                    <i className="fa fa-lock fa-lg"></i>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="txtPassword"
                    className="form-control"
                    placeholder="Enter Password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span
                    className="input-group-text"
                    style={{ cursor: "pointer" }}
                    onClick={togglePassword}
                  >
                    <i
                      className={`fa ${
                        showPassword ? "fa-eye-slash" : "fa-eye"
                      }`}
                    ></i>
                  </span>
                </div>
              </div>

              <div className="row self-solutions-login-row mb-3">
                <div className="col-6 d-grid">
                  <button
                    type="reset"
                    className="btn btn-outline-danger"
                    onClick={() => {
                      setUsername("");
                      setPassword("");
                    }}
                  >
                    <i className="fa fa-recycle"></i>&nbsp;&nbsp;Reset
                  </button>
                </div>
                <div className="col-6 d-grid">
                  <button type="submit" className="btn btn-outline-success">
                    <i className="fa fa-check"></i>&nbsp;&nbsp;Login
                  </button>
                </div>
              </div>

              <div className="row">
                <div className="col-6 d-grid">
                  <button
                    type="button"
                    className="btn btn-outline-warning"
                    onClick={() => setShowChangePwdModal(true)}
                  >
                    <i className="fa fa-key"></i>&nbsp;&nbsp;ResetPassword
                  </button>
                </div>
                <div className="col-6 d-grid">
                  <button
                    type="button"
                    className="btn btn-outline-info"
                    onClick={() => setShowUnlockModal(true)}
                  >
                    <i className="fa fa-unlock"></i>&nbsp;&nbsp;UnlockAccount
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {modalType && (
        <Modal type={modalType} message={modalMessage} onClose={closeModal} />
      )}

      {showChangePwdModal && (
        <ChangePasswordModal
          isOpen={showChangePwdModal}
          onClose={() => setShowChangePwdModal(false)}
          showUsername={true}
        />
      )}

      {showUnlockModal && (
        <UnlockAccountModal
          isOpen={showUnlockModal}
          onClose={() => setShowUnlockModal(false)}
        />
      )}
    </div>
  );
};

export default Login;
