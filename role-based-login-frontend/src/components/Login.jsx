import React, { useState } from 'react';
import { jwtDecode } from 'jwt-decode';

import { Link } from 'react-router-dom';

import { authStorage } from "../auth/storage";

import { useNavigate } from 'react-router-dom';

import { apiClient, API_BASE_URL, getApiErrorMessage } from "../api/client";

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [twoFactorStep, setTwoFactorStep] = useState(false);
  const [verificationId, setVerificationId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await apiClient.post(`/api/auth/login`, formData);

      // 2FA flow: backend returns a verificationId (usually with HTTP 202)
      if (res.data?.twoFactorRequired && res.data?.verificationId) {
        setTwoFactorStep(true);
        setVerificationId(res.data.verificationId);
        alert(res.data?.message || "Verification code sent to your email");
        return;
      }

      const token = res.data.token;
      
      console.log(token)
      // Start a fresh per-tab session
      authStorage.clear();

      const decoded = jwtDecode(token);
      authStorage.setSession({
        token,
        email: decoded.sub,
        role: String(decoded.role || "").toLowerCase(),
      });

      const role = (decoded.role || "").toLowerCase();
console.log(decoded)
      // Redirect based on role
      if (role === "hr") navigate("/hr-dashboard");
      else if (role === "employee") navigate("/employee-dashboard");
      else if (role === "driver") navigate("/driver-dashboard");
      else navigate("/");

    } catch (err) {
      if (!err.response) {
        alert(`Cannot reach backend at ${API_BASE_URL}. Start the Spring Boot app and try again.`);
        return;
      }
      alert(getApiErrorMessage(err, "Login failed"));
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post(`/api/auth/verify-2fa`, {
        verificationId,
        code: verificationCode,
      });

      const token = res.data.token;
      authStorage.clear();

      const decoded = jwtDecode(token);
      authStorage.setSession({
        token,
        email: decoded.sub,
        role: String(decoded.role || "").toLowerCase(),
      });

      const role = (decoded.role || "").toLowerCase();
      if (role === "hr") navigate("/hr-dashboard");
      else if (role === "employee") navigate("/employee-dashboard");
      else if (role === "driver") navigate("/driver-dashboard");
      else navigate("/");
    } catch (err) {
      alert(getApiErrorMessage(err, "Verification failed"));
    }
  };

  return (
    <div className="authPage">
      <div className="authCard">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>Sign in</h2>
            <div style={{ marginTop: 6, color: "#6b7280", fontSize: 13 }}>
              Access your dashboard in seconds.
            </div>
          </div>

          <Link className="authLink" to="/register">
            Create account
          </Link>
        </div>

        {!twoFactorStep ? (
          <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
            <label className="authLabel">Email</label>
            <input
              className="authInput"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@company.com"
              required
            />

            <label className="authLabel" style={{ marginTop: 12 }}>Password</label>
            <input
              className="authInput"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />

            <button type="submit" className="authButton" style={{ marginTop: 16 }}>
              Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} style={{ marginTop: 16 }}>
            <label className="authLabel">Verification code</label>
            <input
              className="authInput"
              type="text"
              inputMode="numeric"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="6-digit code"
              required
            />

            <button type="submit" className="authButton" style={{ marginTop: 16 }}>
              Verify
            </button>

            <button
              type="button"
              className="authButton"
              style={{ marginTop: 10, background: "transparent" }}
              onClick={() => {
                setTwoFactorStep(false);
                setVerificationId('');
                setVerificationCode('');
              }}
            >
              Back
            </button>
          </form>
        )}

        <div style={{ marginTop: 14, fontSize: 13, color: "#6b7280" }}>
          Don’t have an account? <Link className="authLink" to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
