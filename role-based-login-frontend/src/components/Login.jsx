import React, { useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

import { Link } from 'react-router-dom';

import { authStorage } from "../auth/storage";

import { useNavigate } from 'react-router-dom';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

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
      const res = await axios.post('http://localhost:8080/api/auth/login', formData);

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
      
      alert(err.response?.data || "Login failed");
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

        <div style={{ marginTop: 14, fontSize: 13, color: "#6b7280" }}>
          Don’t have an account? <Link className="authLink" to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
