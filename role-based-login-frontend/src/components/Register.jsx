import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { apiClient, getApiErrorMessage } from "../api/client";

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'employee',
    hrEmail: '',
    cabType: 'Cab',
    available: true,
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      if (formData.role === 'employee') {
        payload.hrEmail = formData.hrEmail;
      }

      if (formData.role === 'driver') {
        payload.cabType = formData.cabType;
        payload.available = formData.available;
      }

      const res = await apiClient.post(`/api/auth/register`, payload);
      alert(res.data); // or show some success message
    } catch (err) 
    {
      alert(getApiErrorMessage(err, 'Error registering user'));
    }
  };

  return (
    <div className="authPage">
      <div className="authCard">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>Create account</h2>
            <div style={{ marginTop: 6, color: "#6b7280", fontSize: 13 }}>
              Choose your role to open the right dashboard.
            </div>
          </div>
          <Link className="authLink" to="/login">Sign in</Link>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
          <label className="authLabel">Username</label>
          <input
            className="authInput"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Your name"
            required
          />

          <label className="authLabel" style={{ marginTop: 12 }}>Email</label>
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

          <label className="authLabel" style={{ marginTop: 12 }}>Role</label>
          <select className="authSelect" name="role" value={formData.role} onChange={handleChange}>
            <option value="hr">HR</option>
            <option value="employee">Employee</option>
            <option value="driver">Driver</option>
          </select>

          {formData.role === 'employee' && (
            <>
              <label className="authLabel" style={{ marginTop: 12 }}>HR Email</label>
              <input
                className="authInput"
                type="email"
                name="hrEmail"
                value={formData.hrEmail}
                onChange={handleChange}
                placeholder="hr@company.com"
                required
              />
            </>
          )}

          {formData.role === 'driver' && (
            <div className="authGrid" style={{ marginTop: 12 }}>
              <div>
                <label className="authLabel">Cab Type</label>
                <select className="authSelect" name="cabType" value={formData.cabType} onChange={handleChange}>
                  <option value="Cab">Cab</option>
                  <option value="Van">Van</option>
                </select>
              </div>

              <div>
                <label className="authLabel">Availability</label>
                <select
                  className="authSelect"
                  name="available"
                  value={String(formData.available)}
                  onChange={(e) => setFormData({ ...formData, available: e.target.value === 'true' })}
                >
                  <option value="true">Available</option>
                  <option value="false">Not Available</option>
                </select>
              </div>
            </div>
          )}

          <button type="submit" className="authButton" style={{ marginTop: 16 }}>
            Register
          </button>
        </form>

        <div style={{ marginTop: 14, fontSize: 13, color: "#6b7280" }}>
          Already have an account? <Link className="authLink" to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
