import React, { useState, useEffect, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';

import { Link } from 'react-router-dom';

import { authStorage } from "../auth/storage";

import { useNavigate } from 'react-router-dom';

import { apiClient, API_BASE_URL, getApiErrorMessage } from "../api/client";
import ThemeToggle from "./common/ThemeToggle";
import LoginRobot from "./common/LoginRobot";
import { useTheme } from "../context/ThemeContext";

function Login() {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [focusField, setFocusField] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);

  // 2FA OTP state
  const [otpStep, setOtpStep] = useState(false);
  const [verificationId, setVerificationId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpMessage, setOtpMessage] = useState('');

  // Track theme toggles so the robot can react
  const { theme } = useTheme();
  const [themeFlip, setThemeFlip] = useState(0);
  const mountedTheme = useRef(theme);
  useEffect(() => {
    if (theme !== mountedTheme.current) {
      mountedTheme.current = theme;
      setThemeFlip(prev => prev + 1);
    }
  }, [theme]);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setHasError(false);
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setHasError(false);

    try {
      const res = await apiClient.post(`/api/auth/login`, {
        identifier: formData.identifier,
        password: formData.password,
      });

      // Check if 2FA is required (HTTP 202)
      if (res.status === 202 && res.data.twoFactorRequired) {
        setVerificationId(res.data.verificationId);
        setOtpMessage(res.data.message || "OTP sent to your phone");
        setOtpStep(true);
        setIsSubmitting(false);
        return;
      }

      handleLoginSuccess(res.data.token);
    } catch (err) {
      setHasError(true);
      setIsSubmitting(false);
      if (!err.response) {
        alert(`Cannot reach backend at ${API_BASE_URL}. Start the Spring Boot app and try again.`);
        return;
      }
      alert(getApiErrorMessage(err, "Login failed"));
    }
  };

  const handleLoginSuccess = (token) => {
    authStorage.clear();
    const decoded = jwtDecode(token);
    authStorage.setSession({
      token,
      email: decoded.sub,
      role: String(decoded.role || "").toLowerCase(),
      username: decoded.username || "",
    });

    const role = (decoded.role || "").toLowerCase();
    if (role === "hr") navigate("/hr-dashboard");
    else if (role === "employee") navigate("/employee-dashboard");
    else if (role === "driver") navigate("/driver-dashboard");
    else navigate("/");
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setHasError(false);

    try {
      const res = await apiClient.post(`/api/auth/verify-2fa`, {
        verificationId,
        code: otpCode,
      });

      handleLoginSuccess(res.data.token);
    } catch (err) {
      setHasError(true);
      setIsSubmitting(false);
      if (!err.response) {
        alert(`Cannot reach backend at ${API_BASE_URL}. Start the Spring Boot app and try again.`);
        return;
      }
      alert(getApiErrorMessage(err, "Verification failed"));
    }
  };

  return (
    <div className="authPageWithRobot">
      <ThemeToggle className="authThemeToggle" />

      <LoginRobot
        emailLength={formData.identifier.length}
        focusField={focusField}
        isSubmitting={isSubmitting}
        hasError={hasError}
        themeFlip={themeFlip}
      />

      <div className="authCard">
        {!otpStep ? (
          <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>Sign in</h2>
            <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
              Access your dashboard in seconds.
            </div>
          </div>

          <Link className="authLink" to="/register">
            Create account
          </Link>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
          <label className="authLabel">Email, Username, or Phone</label>
          <input
            className="authInput"
            type="text"
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
            onFocus={() => setFocusField("email")}
            onBlur={() => setFocusField(null)}
            placeholder="you@company.com / username / +1234567890"
            required
          />

          <label className="authLabel" style={{ marginTop: 12 }}>Password</label>
          <input
            className="authInput"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            onFocus={() => setFocusField("password")}
            onBlur={() => setFocusField(null)}
            placeholder="••••••••"
            required
          />

          <button type="submit" className="authButton" style={{ marginTop: 16 }} disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Login"}
          </button>
        </form>

        <div style={{ marginTop: 14, fontSize: 13, color: "var(--muted)" }}>
          Don’t have an account? <Link className="authLink" to="/register">Register</Link>
        </div>          </>
        ) : (
          <>
            <h2 style={{ margin: 0 }}>Enter OTP</h2>
            <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
              {otpMessage}
            </div>

            <form onSubmit={handleOtpSubmit} style={{ marginTop: 16 }}>
              <label className="authLabel">Verification Code</label>
              <input
                className="authInput"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) => { setOtpCode(e.target.value); setHasError(false); }}
                onFocus={() => setFocusField("email")}
                onBlur={() => setFocusField(null)}
                placeholder="123456"
                autoFocus
                required
              />

              <button type="submit" className="authButton" style={{ marginTop: 16 }} disabled={isSubmitting}>
                {isSubmitting ? "Verifying…" : "Verify"}
              </button>
            </form>

            <button
              className="authLink"
              style={{ marginTop: 14, background: "none", border: "none", cursor: "pointer", fontSize: 13 }}
              onClick={() => { setOtpStep(false); setOtpCode(''); setHasError(false); setIsSubmitting(false); }}
            >
              ← Back to login
            </button>
          </>
        )}      </div>
    </div>
  );
}

export default Login;
