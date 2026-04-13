import React, { useEffect, useState } from "react";
import "./Login.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useNavigate } from "react-router-dom";

import { getGreeting } from "../../../utils/dateUtils";
import { loginUser } from "../authService";
import { clearSession } from "../../../utils/session";
import { stopNotificationConnection } from "../../../api/signalR";

import Modal from "../../../components/Modal";
import ChangePasswordModal from "./ChangePasswordModal";
import UnlockAccountModal from "./UnlockAccountModal";
import { UseAuth } from "../../../context/UseAuth";
import OverlayMessage from "../../../components/common/OverlayMessage";
import { handleApiError } from "../../../utils/handleApiError";
import { setAccessToken } from "../../../api/httpClient";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = UseAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [modalType, setModalType] = useState<"success" | "error" | null>(null);
  const [modalMessage, setModalMessage] = useState("");
  const [showChangePwdModal, setShowChangePwdModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  const [isLoadingPostLogin, setIsLoadingPostLogin] = useState(false);
  const [overlayMessage, setOverlayMessage] = useState("Signing you in...");
  const [overlaySubMessage, setOverlaySubMessage] = useState(
    "Please wait while we verify your credentials..."
  );

  useEffect(() => {
    // Keep auth state untouched on the login route.
    // In a refresh-token flow, session restoration may still be in progress.
    // Only stop live connections and clear non-sensitive page-level session data here.
    clearSession();
    stopNotificationConnection();
    console.log("Login route initialized.");
  }, []);

  const togglePassword = () => {
    if (isLoadingPostLogin) return;
    setShowPassword((prev) => !prev);
  };

  const handleLogin = async () => {
    if (isLoadingPostLogin) return;

    try {
      setIsLoadingPostLogin(true);
      setOverlayMessage("Signing you in...");
      setOverlaySubMessage("Please wait while we verify your credentials...");

      const response = await loginUser({ userName: username, password });

      if (!response.userId || !response.accessToken) {
        throw new Error("Invalid login response: Missing user ID or access token.");
      }

      // Keep the access token in the shared in-memory HTTP client store.
      setAccessToken(response.accessToken);

      // Store authentication state in React context only.
      setAuth(response.accessToken, response.userId.toString());

      // Keep only lightweight non-sensitive UI state locally.
      localStorage.setItem("username", username);
      localStorage.setItem("status", "Online");

      setOverlayMessage("You have successfully logged in.");
      setOverlaySubMessage("Please wait while we load your dashboard...");

      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (error: unknown) {
      setIsLoadingPostLogin(false);

      const { userMessage, statusCode } = handleApiError(error, "Login failed");
      console.warn("Login failed with status:", statusCode);
      setModalType("error");
      setModalMessage(`${userMessage} (Error Code: ${statusCode ?? "N/A"})`);
    }
  };

  const closeModal = () => {
    setModalType(null);
    setModalMessage("");
  };

  return (
    <div className="self-solutions-login-body">
      <div className="self-solutions-login-full-page">
        <div className="self-solutions-login-left-side">
          <div>Picture 1</div>
          <div>Picture 2</div>
          <div>Picture 3</div>
          <div>Picture 4</div>
        </div>

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
                    disabled={isLoadingPostLogin}
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
                    disabled={isLoadingPostLogin}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span
                    className="input-group-text"
                    style={{ cursor: isLoadingPostLogin ? "not-allowed" : "pointer" }}
                    onClick={togglePassword}
                  >
                    <i
                      className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                    ></i>
                  </span>
                </div>
              </div>

              <div className="row self-solutions-login-row mb-3">
                <div className="col-6 d-grid">
                  <button
                    type="reset"
                    className="btn btn-outline-danger"
                    disabled={isLoadingPostLogin}
                    onClick={() => {
                      setUsername("");
                      setPassword("");
                    }}
                  >
                    <i className="fa fa-recycle"></i>&nbsp;&nbsp;Reset
                  </button>
                </div>
                <div className="col-6 d-grid">
                  <button
                    type="submit"
                    className="btn btn-outline-success"
                    disabled={isLoadingPostLogin}
                  >
                    <i className="fa fa-check"></i>&nbsp;&nbsp;
                    {isLoadingPostLogin ? "Please wait..." : "Login"}
                  </button>
                </div>
              </div>

              <div className="row">
                <div className="col-6 d-grid">
                  <button
                    type="button"
                    className="btn btn-outline-warning"
                    disabled={isLoadingPostLogin}
                    onClick={() => setShowChangePwdModal(true)}
                  >
                    <i className="fa fa-key"></i>&nbsp;&nbsp;ResetPassword
                  </button>
                </div>
                <div className="col-6 d-grid">
                  <button
                    type="button"
                    className="btn btn-outline-info"
                    disabled={isLoadingPostLogin}
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

      <OverlayMessage
        show={isLoadingPostLogin}
        message={overlayMessage}
        subMessage={overlaySubMessage}
      />
    </div>
  );
};

export default Login;