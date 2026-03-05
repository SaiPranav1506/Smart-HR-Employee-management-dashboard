import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, getApiErrorMessage } from "../../api/client";
import { authStorage } from "../../auth/storage";
import TopNav from '../common/TopNav';

function PersonalInfoPage() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return (
      <>
        <TopNav title="Personal Information" />
        <div className="page">
          <div className="container">
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
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
            <div className="card" style={{ borderLeft: '4px solid #ef4444', marginTop: 24 }}>
              <div style={{ color: '#ef4444', padding: 16 }}>
                <strong>Error:</strong> {error}
              </div>
            </div>
            <button 
              onClick={() => navigate(-1)}
              style={{
                marginTop: 16,
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              Go Back
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopNav title="Personal Information" />
      <div className="page">
        <div className="container" style={{ maxWidth: 700 }}>
          
          {/* Account Type Badge */}
          <div style={{ marginTop: 24, marginBottom: 24 }}>
            <span style={{
              display: 'inline-block',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {userInfo?.accountType || userInfo?.role}
            </span>
          </div>

          {/* Main Card */}
          <div className="card">
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ marginTop: 0, marginBottom: 16, color: '#111827', fontSize: 24, fontWeight: 700 }}>
                {userInfo?.username}
              </h2>
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
                
                {/* Basic Information */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>
                    EMAIL ADDRESS
                  </label>
                  <p style={{ margin: 0, fontSize: 14, color: '#111827' }}>{userInfo?.email}</p>
                </div>

                {/* Phone & Country */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>
                      PHONE NUMBER
                    </label>
                    <p style={{ margin: 0, fontSize: 14, color: '#111827' }}>
                      {userInfo?.phoneNumber || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>
                      COUNTRY
                    </label>
                    <p style={{ margin: 0, fontSize: 14, color: '#111827' }}>
                      {userInfo?.country} ({userInfo?.countryCode})
                    </p>
                  </div>
                </div>

                {/* Role Specific Information */}
                {userInfo?.role === 'employee' && userInfo?.hrEmail && (
                  <div style={{ marginBottom: 16, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
                    <label style={{ display: 'block', fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>
                      ASSIGNED HR
                    </label>
                    <p style={{ margin: 0, fontSize: 14, color: '#111827' }}>{userInfo?.hrEmail}</p>
                  </div>
                )}

                {userInfo?.role === 'driver' && (
                  <div style={{ marginBottom: 16, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>
                          CAB TYPE
                        </label>
                        <p style={{ margin: 0, fontSize: 14, color: '#111827' }}>
                          {userInfo?.cabType || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>
                          AVAILABILITY
                        </label>
                        <p style={{ 
                          margin: 0, 
                          fontSize: 14, 
                          color: userInfo?.available ? '#10b981' : '#ef4444',
                          fontWeight: 600
                        }}>
                          {userInfo?.available ? '✓ Available' : '✗ Not Available'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

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
            📱 Your phone number is used for OTP verification during ride bookings. Keep it updated for secure transactions.
          </div>

        </div>
      </div>
    </>
  );
}

export default PersonalInfoPage;
