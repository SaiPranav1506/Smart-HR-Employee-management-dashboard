import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, getApiErrorMessage } from "../../api/client";
import { authStorage } from "../../auth/storage";
import TopNav from '../common/TopNav';
import FileUploadSection from '../common/FileUploadSection';

function PersonalInfoPage() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = authStorage.getToken();
      const res = await apiClient.get('/api/profile/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserInfo(res.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load personal information'));
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    setEditForm({
      username: userInfo?.username || '',
      phoneNumber: userInfo?.phoneNumber || '',
      country: userInfo?.country || '',
      cabType: userInfo?.cabType || '',
    });
    setSaveMsg(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setSaveMsg(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const token = authStorage.getToken();
      const res = await apiClient.put('/api/profile/me', editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserInfo(res.data);
      setEditing(false);
      setSaveMsg("Profile updated successfully!");
      // Update session username if changed
      if (editForm.username && editForm.username !== authStorage.getUsername()) {
        sessionStorage.setItem("username", editForm.username);
      }
    } catch (err) {
      setSaveMsg(getApiErrorMessage(err, 'Failed to update profile'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <TopNav title="Personal Information" />
        <div className="page">
          <div className="container">
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
              <p>Loading your information...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <TopNav title="Personal Information" />
        <div className="page">
          <div className="container">
            <div className="card" style={{ borderLeft: '4px solid var(--error, #ef4444)', marginTop: 24 }}>
              <div style={{ color: 'var(--error, #ef4444)', padding: 16 }}>
                <strong>Error:</strong> {error}
              </div>
            </div>
            <button 
              onClick={() => navigate(-1)}
              className="btnPrimary"
              style={{ marginTop: 16 }}
            >
              Go Back
            </button>
          </div>
        </div>
      </>
    );
  }

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid var(--border)',
    borderRadius: 4,
    backgroundColor: 'var(--input-bg)',
    color: 'var(--input-text)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <>
      <TopNav title="Personal Information" />
      <div className="page">
        <div className="container" style={{ maxWidth: 700 }}>
          
          {/* Account Type Badge */}
          <div style={{ marginTop: 24, marginBottom: 24 }}>
            <span className="badge badgeGold">
              {userInfo?.accountType || userInfo?.role}
            </span>
          </div>

          {/* Save message */}
          {saveMsg && (
            <div style={{
              padding: '8px 12px',
              marginBottom: 12,
              backgroundColor: saveMsg.includes('success') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${saveMsg.includes('success') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              borderRadius: 6,
              color: saveMsg.includes('success') ? 'var(--success, #10b981)' : 'var(--error, #ef4444)',
              fontSize: 13,
            }}>
              {saveMsg}
            </div>
          )}

          {/* Main Card */}
          <div className="card">
            <div className="cardInner">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ marginTop: 0, marginBottom: 0, color: 'var(--text-strong)', fontSize: 24, fontWeight: 700 }}>
                  {editing ? 'Edit Profile' : userInfo?.username}
                </h2>
                {!editing && (
                  <button
                    onClick={startEditing}
                    style={{
                      padding: '6px 14px',
                      backgroundColor: 'var(--gold)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                
                {editing ? (
                  /* ── Edit Form ── */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>
                        USERNAME
                      </label>
                      <input
                        style={inputStyle}
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>
                        EMAIL ADDRESS (cannot be changed)
                      </label>
                      <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>{userInfo?.email}</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>
                          PHONE NUMBER
                        </label>
                        <input
                          style={inputStyle}
                          value={editForm.phoneNumber}
                          onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>
                          COUNTRY
                        </label>
                        <select
                          style={inputStyle}
                          value={editForm.country}
                          onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                        >
                          <option value="USA">USA</option>
                          <option value="India">India</option>
                          <option value="UK">UK</option>
                          <option value="Canada">Canada</option>
                        </select>
                      </div>
                    </div>

                    {userInfo?.role === 'driver' && (
                      <div>
                        <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>
                          CAB TYPE
                        </label>
                        <select
                          style={inputStyle}
                          value={editForm.cabType}
                          onChange={(e) => setEditForm({ ...editForm, cabType: e.target.value })}
                        >
                          <option value="Cab">Cab</option>
                          <option value="Van">Van</option>
                          <option value="SUV">SUV</option>
                          <option value="Sedan">Sedan</option>
                        </select>
                      </div>
                    )}

                    {userInfo?.role === 'employee' && userInfo?.hrEmail && (
                      <div>
                        <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>
                          ASSIGNED HR (cannot be changed)
                        </label>
                        <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>{userInfo?.hrEmail}</p>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btnPrimary"
                        style={{ flex: 1 }}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={saving}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Read-only view ── */
                  <>
                    {/* Basic Information */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>
                        EMAIL ADDRESS
                      </label>
                      <p style={{ margin: 0, fontSize: 14, color: 'var(--text)' }}>{userInfo?.email}</p>
                    </div>

                    {/* Phone & Country */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>
                          PHONE NUMBER
                        </label>
                        <p style={{ margin: 0, fontSize: 14, color: 'var(--text)' }}>
                          {userInfo?.phoneNumber || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>
                          COUNTRY
                        </label>
                        <p style={{ margin: 0, fontSize: 14, color: 'var(--text)' }}>
                          {userInfo?.country} ({userInfo?.countryCode})
                        </p>
                      </div>
                    </div>

                    {/* Role Specific Information */}
                    {userInfo?.role === 'employee' && userInfo?.hrEmail && (
                      <div style={{ marginBottom: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                        <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>
                          ASSIGNED HR
                        </label>
                        <p style={{ margin: 0, fontSize: 14, color: 'var(--text)' }}>{userInfo?.hrEmail}</p>
                      </div>
                    )}

                    {userInfo?.role === 'driver' && (
                      <div style={{ marginBottom: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>
                              CAB TYPE
                            </label>
                            <p style={{ margin: 0, fontSize: 14, color: 'var(--text)' }}>
                              {userInfo?.cabType || 'Not specified'}
                            </p>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>
                              AVAILABILITY
                            </label>
                            <p style={{ 
                              margin: 0, 
                              fontSize: 14, 
                              color: userInfo?.available ? 'var(--success, #10b981)' : 'var(--error, #ef4444)',
                              fontWeight: 600
                            }}>
                              {userInfo?.available ? '✓ Available' : '✗ Not Available'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

              </div>
            </div>
          </div>

          {/* File Upload Section */}
          <FileUploadSection />

          {/* Actions */}
          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <button 
              onClick={() => navigate(-1)}
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#e5e7eb'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            >
              Go Back
            </button>
            <button 
              onClick={fetchUserInfo}
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
            >
              Refresh
            </button>
          </div>

          {/* Info Message */}
          <div style={{
            marginTop: 24,
            padding: 12,
            backgroundColor: '#f0f9ff',
            border: '1px solid #bfdbfe',
            borderRadius: '4px',
            fontSize: 12,
            color: '#1e40af'
          }}>
            📱 Your phone number is used for OTP verification during ride bookings. Click "Edit" to update your details.
          </div>

        </div>
      </div>
    </>
  );
}

export default PersonalInfoPage;
