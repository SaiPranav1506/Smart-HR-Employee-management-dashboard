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
    email: '',
    password: ''
  });
  const [focusField, setFocusField] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);

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
      const res = await apiClient.post(`/api/auth/login`, formData);

      const token = res.data.token;

      // Start a fresh per-tab session
      authStorage.clear();

      const decoded = jwtDecode(token);
      authStorage.setSession({
        token,
        email: decoded.sub,
        role: String(decoded.role || "").toLowerCase(),
        username: decoded.username || "",
      });

      const role = (decoded.role || "").toLowerCase();

      // Redirect based on role
      if (role === "hr") navigate("/hr-dashboard");
      else if (role === "employee") navigate("/employee-dashboard");
      else if (role === "driver") navigate("/driver-dashboard");
      else navigate("/");

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

  return (
    <div className="authPageWithRobot">
      <ThemeToggle className="authThemeToggle" />

      <LoginRobot
        emailLength={formData.email.length}
        focusField={focusField}
        isSubmitting={isSubmitting}
        hasError={hasError}
        themeFlip={themeFlip}
      />

      <div className="authCard">
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
          <label className="authLabel">Email</label>
          <input
            className="authInput"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onFocus={() => setFocusField("email")}
            onBlur={() => setFocusField(null)}
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
        </div>
      </div>
    </div>
  );
}

export default Login;
