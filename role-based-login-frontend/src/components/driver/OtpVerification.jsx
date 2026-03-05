// OTP Verification Component for Driver Dashboard
// This is a React component example for handling OTP verification in the driver's dashboard

import React, { useState, useEffect } from 'react';

/**
 * OtpVerificationModal Component
 * Shows when driver accepts a trip, asking them to enter OTP
 */
const OtpVerificationModal = ({ bookingId, employeeName, onVerified, onDismiss }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [otpStatus, setOtpStatus] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [verified, setVerified] = useState(false);

  // Fetch OTP status on mount
  useEffect(() => {
    fetchOtpStatus();
  }, [bookingId]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const fetchOtpStatus = async () => {
    try {
      const res = await fetch(`/api/otp/status?bookingId=${bookingId}`);
      const data = await res.json();
      if (data.success) {
        setOtpStatus(data);
        setAttempts(data.attempts);
        setVerified(data.verified);
        // Calculate remaining time
        const expiresAt = new Date(data.expiresAt);
        const now = new Date();
        const diff = Math.floor((expiresAt - now) / 1000);
        setTimeLeft(Math.max(0, diff));
      }
    } catch (err) {
      setError('Failed to fetch OTP status');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bookingId: bookingId.toString(), 
          enteredOtp: otp 
        })
      });

      const data = await res.json();

      if (data.success && data.verified) {
        setVerified(true);
        setError('');
        setTimeout(() => onVerified(), 1000); // Close modal after success
      } else {
        setError(data.message || 'OTP verification failed');
        setOtp(''); // Clear input
        fetchOtpStatus(); // Refresh status
      }
    } catch (err) {
      setError('Error verifying OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Note: You'll need to pass phoneNumber and employeeName from parent
      const phoneNumber = otpStatus?.driverEmail || ''; // This should come from context
      const res = await fetch('/api/otp/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bookingId: bookingId.toString(),
          phoneNumber, // Get from context/props
          employeeName
        })
      });

      const data = await res.json();
      if (data.success) {
        setError('');
        setOtp('');
        setTimeLeft(600); // Reset timer to 10 minutes
        fetchOtpStatus();
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('Error resending OTP');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (verified) {
    return (
      <div style={styles.modal}>
        <div style={styles.modalContent}>
          <div style={styles.successIcon}>✓</div>
          <h2>OTP Verified!</h2>
          <p>You can now start the trip with {employeeName}</p>
          <button style={styles.primaryBtn} onClick={onVerified}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h2>Enter Trip OTP</h2>
        <p>Employee {employeeName} will receive a verification code via SMS</p>
        
        <form onSubmit={handleVerifyOtp} style={styles.form}>
          <div style={styles.inputGroup}>
            <label>6-Digit OTP Code</label>
            <input
              type="text"
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              disabled={loading}
              style={styles.otpInput}
              autoFocus
            />
          </div>

          {error && <div style={styles.errorMsg}>{error}</div>}

          <div style={styles.timerSection}>
            <span style={styles.timerLabel}>Code expires in:</span>
            <span style={{...styles.timer, color: timeLeft < 60 ? '#ff6b6b' : '#666'}}>
              {formatTime(timeLeft)}
            </span>
          </div>

          <div style={styles.attemptsInfo}>
            Attempts remaining: {Math.max(0, 3 - attempts)}/3
          </div>

          <button
            type="submit"
            disabled={loading || !otp || timeLeft === 0}
            style={{
              ...styles.primaryBtn,
              opacity: (loading || !otp || timeLeft === 0) ? 0.6 : 1,
              cursor: (loading || !otp || timeLeft === 0) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>

          <button
            type="button"
            onClick={handleResendOtp}
            disabled={loading}
            style={styles.secondaryBtn}
          >
            Resend OTP
          </button>
        </form>

        <button
          onClick={onDismiss}
          style={styles.closeBtn}
          disabled={loading}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

/**
 * Trip Start Button Component
 * Shows start button only if OTP is verified
 */
const TripStartButton = ({ bookingId, driverToken, onTripStarted }) => {
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);

  useEffect(() => {
    checkOtpVerification();
    // Recheck every 5 seconds
    const interval = setInterval(checkOtpVerification, 5000);
    return () => clearInterval(interval);
  }, [bookingId]);

  const checkOtpVerification = async () => {
    try {
      const res = await fetch(`/api/otp/is-verified?bookingId=${bookingId}`);
      const data = await res.json();
      setOtpVerified(data.verified);
    } catch (err) {
      console.error('Error checking OTP status:', err);
    }
  };

  const handleStartTrip = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/driver/start-trip/${bookingId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${driverToken}` }
      });

      const data = await res.json();

      if (data.success) {
        onTripStarted();
      } else {
        if (data.message.includes('OTP')) {
          setShowOtpModal(true);
        } else {
          alert('Error: ' + data.message);
        }
      }
    } catch (err) {
      alert('Failed to start trip');
    } finally {
      setLoading(false);
    }
  };

  if (!otpVerified) {
    return (
      <div style={styles.warningBox}>
        <p>⚠️ Waiting for employee to verify OTP...</p>
        <p style={styles.smallText}>The trip will start once verified</p>
        {showOtpModal && (
          <OtpVerificationModal
            bookingId={bookingId}
            employeeName={bookingDetails?.employeeName || 'Employee'}
            onVerified={() => {
              setShowOtpModal(false);
              checkOtpVerification();
            }}
            onDismiss={() => setShowOtpModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleStartTrip}
      disabled={loading}
      style={{...styles.primaryBtn, ...{width: '100%', padding: '12px'}}}
    >
      {loading ? 'Starting Trip...' : '✓ Start Trip (OTP Verified)'}
    </button>
  );
};

/**
 * Usage in Driver Dashboard
 */
const DriverDashboardExample = () => {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [trips, setTrips] = useState([]);
  const driverEmail = 'driver@example.com'; // From JWT token

  const fetchAssignedTrips = async () => {
    try {
      const res = await fetch('/api/driver/assigned-trips', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setTrips(data);
    } catch (err) {
      console.error('Error fetching trips:', err);
    }
  };

  useEffect(() => {
    fetchAssignedTrips();
  }, []);

  return (
    <div style={styles.dashboard}>
      <h1>My Assigned Trips</h1>
      
      {selectedBooking ? (
        <div style={styles.tripDetail}>
          <button onClick={() => setSelectedBooking(null)}>← Back</button>
          <h2>Trip #{selectedBooking.id}</h2>
          <p><strong>Employee:</strong> {selectedBooking.employeeName}</p>
          <p><strong>Pickup:</strong> {selectedBooking.pickup}</p>
          <p><strong>Drop:</strong> {selectedBooking.dropLocation}</p>
          <p><strong>Pickup Time:</strong> {selectedBooking.pickupTime}</p>
          
          <div style={styles.actionSection}>
            <TripStartButton
              bookingId={selectedBooking.id}
              driverToken={localStorage.getItem('token')}
              onTripStarted={() => {
                alert('Trip started!');
                setSelectedBooking(null);
                fetchAssignedTrips();
              }}
            />
          </div>
        </div>
      ) : (
        <div style={styles.tripsList}>
          {trips.map(trip => (
            <div key={trip.id} style={styles.tripCard}>
              <h3>{trip.employeeName}</h3>
              <p>{trip.pickup} → {trip.dropLocation}</p>
              <p style={styles.smallText}>{trip.pickupTime}</p>
              <button
                onClick={() => setSelectedBooking(trip)}
                style={styles.primaryBtn}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    maxWidth: '400px',
    width: '90%',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    position: 'relative'
  },
  successIcon: {
    fontSize: '48px',
    textAlign: 'center',
    color: '#4CAF50',
    marginBottom: '20px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  otpInput: {
    padding: '12px',
    fontSize: '24px',
    letterSpacing: '8px',
    textAlign: 'center',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontFamily: 'monospace'
  },
  errorMsg: {
    color: '#d32f2f',
    fontSize: '14px',
    padding: '10px',
    backgroundColor: '#ffebee',
    borderRadius: '6px'
  },
  timerSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    backgroundColor: '#f5f5f5',
    borderRadius: '6px'
  },
  timerLabel: {
    fontSize: '14px',
    color: '#666'
  },
  timer: {
    fontSize: '18px',
    fontWeight: 'bold',
    fontFamily: 'monospace'
  },
  attemptsInfo: {
    fontSize: '14px',
    color: '#666',
    textAlign: 'center'
  },
  primaryBtn: {
    padding: '12px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  secondaryBtn: {
    padding: '10px',
    backgroundColor: '#f0f0f0',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  closeBtn: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer'
  },
  warningBox: {
    padding: '15px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '8px',
    color: '#856404',
    marginTop: '20px'
  },
  smallText: {
    fontSize: '12px',
    opacity: 0.8,
    margin: '5px 0 0 0'
  },
  dashboard: {
    padding: '20px'
  },
  tripsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '15px',
    marginTop: '20px'
  },
  tripCard: {
    padding: '15px',
    backgroundColor: '#f9f9f9',
    border: '1px solid #ddd',
    borderRadius: '8px'
  },
  tripDetail: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '8px',
    marginTop: '20px'
  },
  actionSection: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '8px'
  }
};

export { OtpVerificationModal, TripStartButton, DriverDashboardExample };
