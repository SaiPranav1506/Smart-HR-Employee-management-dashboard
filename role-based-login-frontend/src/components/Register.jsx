import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { apiClient, getApiErrorMessage } from "../api/client";
import ThemeToggle from "./common/ThemeToggle";

const SUPPORTED_COUNTRIES = {
  USA: { code: '+1', placeholder: '+1 (555) 123-4567' },
  India: { code: '+91', placeholder: '+91 98765 43210' },
  UK: { code: '+44', placeholder: '+44 20 7946 0958' },
  Canada: { code: '+1', placeholder: '+1 (555) 123-4567' },
};

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'employee',
    hrEmail: '',
    cabType: 'Cab',
    available: true,
    phoneNumber: '',
    country: 'USA',
  });

  const [phoneValidation, setPhoneValidation] = useState({
    isValid: null,
    message: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear phone validation when country changes
    if (name === 'country') {
      setPhoneValidation({ isValid: null, message: '' });
    }
  };

  const validatePhoneOnSubmit = (country, phone) => {
    if (!phone || !phone.trim()) {
      return { isValid: false, message: 'Phone number is required' };
    }

    // Client-side validation - just check basic format
    const digitsOnly = phone.replace(/[^0-9+]/g, '');
    
    // Check if it starts with + and has country code
    if (!digitsOnly.includes('+')) {
      return { isValid: false, message: 'Phone number must include country code (e.g., +1, +91)' };
    }

    // Check length (10-15 digits is typical for international numbers)
    if (digitsOnly.length < 12 || digitsOnly.length > 15) {
      return { isValid: false, message: 'Phone number format seems incorrect' };
    }

    return { isValid: true, message: 'Valid format ✓' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate phone and country
    if (!formData.phoneNumber || !formData.phoneNumber.trim()) {
      alert('Phone number is required');
      return;
    }

    if (!formData.country) {
      alert('Country is required');
      return;
    }

    // Validate phone format
    const validation = validatePhoneOnSubmit(formData.country, formData.phoneNumber);
    if (!validation.isValid) {
      alert('Invalid phone number: ' + validation.message + '\n\nExpected format: ' + SUPPORTED_COUNTRIES[formData.country]?.placeholder);
      return;
    }

    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phoneNumber: formData.phoneNumber,
        country: formData.country,
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
      <ThemeToggle className="authThemeToggle" />
      <div className="authCard">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>Create account</h2>
            <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
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

          <label className="authLabel" style={{ marginTop: 12 }}>Country</label>
          <select className="authSelect" name="country" value={formData.country} onChange={handleChange} required>
            <option value="USA">United States (+1)</option>
            <option value="India">India (+91)</option>
            <option value="UK">United Kingdom (+44)</option>
            <option value="Canada">Canada (+1)</option>
          </select>

          <label className="authLabel" style={{ marginTop: 12 }}>Phone Number</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="authInput"
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder={SUPPORTED_COUNTRIES[formData.country]?.placeholder || '+1 (555) 123-4567'}
              required
              style={{ flex: 1 }}
            />
          </div>
          {formData.phoneNumber && (
            <div style={{
              marginTop: 6,
              fontSize: 12,
              color: phoneValidation.isValid ? 'var(--success)' : phoneValidation.isValid === false ? 'var(--error)' : 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span>{phoneValidation.message || `Format: ${SUPPORTED_COUNTRIES[formData.country]?.placeholder}`}</span>
            </div>
          )}
          {!formData.phoneNumber && (
            <div style={{
              marginTop: 6,
              fontSize: 12,
              color: 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span>Format: {SUPPORTED_COUNTRIES[formData.country]?.placeholder} (Country: {SUPPORTED_COUNTRIES[formData.country]?.code})</span>
            </div>
          )}

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

        <div style={{ marginTop: 14, fontSize: 13, color: "var(--muted)" }}>
          Already have an account? <Link className="authLink" to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
