import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { authStorage } from "../../auth/storage";
import { API_BASE_URL } from "../../api/client";
import { useNavigate } from "react-router-dom";

const TripCommunication = ({ tripId, employeeEmail, employeeName, pickup, dropLocation, pickupTime, onOtpVerified }) => {
  const navigate = useNavigate();
  const token = authStorage.getToken();
  const driverEmail = authStorage.getEmail();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [messageType, setMessageType] = useState("GENERAL");
  const [expandedMessages, setExpandedMessages] = useState(false);
  
  // OTP states
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/chat/trip/${tripId}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessages(response.data || []);
      setError(null);
    } catch (err) {
      console.error("Error loading messages:", err);
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [tripId, token]);

  // Check if OTP is verified
  const checkOtpStatus = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/driver/otp-status/${tripId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.otpVerified) {
        setOtpVerified(true);
        setShowOtpVerification(false);
      } else {
        setShowOtpVerification(true);
      }
    } catch (err) {
      console.error("Error checking OTP status:", err);
      setShowOtpVerification(true);
    }
  }, [tripId, token]);

  useEffect(() => {
    loadMessages();
    // Poll for new messages every 5 seconds
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  // Check OTP verification status on component mount
  useEffect(() => {
    checkOtpStatus();
  }, [checkOtpStatus]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);


  const sendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) {
      alert("Please enter a message");
      return;
    }

    try {
      setSending(true);
      const payload = {
        senderEmail: driverEmail,
        senderRole: "driver",
        receiverEmail: employeeEmail,
        receiverRole: "employee",
        subject: `Trip Update for ${pickup}`,
        content: newMessage,
        messageType: messageType,
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/chat/trip/${tripId}/send`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessages([...messages, response.data]);
      setNewMessage("");
      setError(null);
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/chat/trip/${tripId}/message/${messageId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      loadMessages();
    } catch (err) {
      console.error("Error marking message as read:", err);
    }
  };

  // Verify OTP code
  const verifyOtpCode = async (e) => {
    e.preventDefault();
    
    if (!otpCode || otpCode.length !== 6) {
      setOtpError("OTP must be 6 digits");
      return;
    }

    try {
      setOtpLoading(true);
      setOtpError(null);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/driver/verify-otp/${tripId}`,
        { otpCode },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setOtpVerified(true);
        setShowOtpVerification(false);
        setOtpCode("");
        setOtpAttempts(0);
        if (onOtpVerified) {
          onOtpVerified();
        }
      }
    } catch (err) {
      console.error("Error verifying OTP:", err);
      const errorMsg = err.response?.data?.message || "Failed to verify OTP";
      setOtpError(errorMsg);
      setOtpAttempts(otpAttempts + 1);
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend OTP
  const resendOTP = async () => {
    try {
      setOtpLoading(true);
      setOtpError(null);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/driver/resend-otp/${tripId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setOtpCode("");
        setOtpAttempts(0);
        setResendCooldown(30);
        setOtpError("OTP resent successfully. Check your phone.");
      }
    } catch (err) {
      console.error("Error resending OTP:", err);
      const errorMsg = err.response?.data?.message || "Failed to resend OTP";
      setOtpError(errorMsg);
    } finally {
      setOtpLoading(false);
    }
  };

  // Start trip after OTP verification
  const startTrip = async () => {
    if (!otpVerified) {
      setOtpError("Please verify OTP first");
      return;
    }

    try {
      setOtpLoading(true);
      const response = await axios.put(
        `${API_BASE_URL}/api/driver/start-trip/${tripId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert("Trip started successfully!");
        // Redirect to complete trip page
        navigate("/driver/complete-trip");
      }
    } catch (err) {
      console.error("Error starting trip:", err);
      const errorMsg = err.response?.data?.message || "Failed to start trip";
      setOtpError(errorMsg);
    } finally {
      setOtpLoading(false);
    }
  };

  const unreadCount = messages.filter((m) => !m.readFlag && m.receiverEmail === driverEmail).length;

  return (
    <div style={{
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      border: "1px solid rgba(255, 215, 0, 0.2)",
      borderRadius: "8px",
      padding: "16px",
      marginBottom: "16px",
    }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          padding: "8px",
          backgroundColor: "rgba(255, 215, 0, 0.05)",
          borderRadius: "4px",
          marginBottom: "12px",
        }}
        onClick={() => setExpandedMessages(!expandedMessages)}
      >
        <div>
          <h4 style={{ marginTop: 0, marginBottom: "4px", color: "var(--gold)" }}>
            {employeeName} - {pickup} → {dropLocation}
          </h4>
          <div style={{ fontSize: "12px", color: "#999" }}>
            Pickup: {pickupTime}
            {unreadCount > 0 && (
              <span style={{ marginLeft: "8px", color: "#ff6b6b", fontWeight: "bold" }}>
                ({unreadCount} unread)
              </span>
            )}
          </div>
        </div>
        <span style={{ color: "var(--gold)", fontSize: "18px" }}>
          {expandedMessages ? "▼" : "▶"}
        </span>
      </div>

      {expandedMessages && (
        <div>
          {/* OTP Verification Section */}
          {showOtpVerification && !otpVerified && (
            <div style={{
              backgroundColor: "rgba(255, 215, 0, 0.1)",
              border: "2px solid var(--gold)",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "16px",
            }}>
              <h4 style={{ marginTop: 0, color: "var(--gold)", textAlign: "center" }}>
                🔐 OTP Verification Required
              </h4>
              <p style={{ color: "#ddd", textAlign: "center", fontSize: "14px", marginBottom: "12px" }}>
                Enter the 6-digit OTP sent to your phone to start the trip
              </p>
              
              <form onSubmit={verifyOtpCode} style={{ display: "flex", gap: "8px", flexDirection: "column", alignItems: "center" }}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter 6-digit OTP"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength="6"
                  disabled={otpLoading}
                  style={{
                    width: "200px",
                    padding: "12px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    border: "2px solid var(--gold)",
                    color: "#ddd",
                    textAlign: "center",
                    fontSize: "18px",
                    letterSpacing: "4px",
                    fontWeight: "bold",
                  }}
                />

                <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                  <button
                    type="submit"
                    disabled={otpLoading || otpCode.length !== 6}
                    style={{
                      flex: 1,
                      padding: "10px",
                      backgroundColor: "var(--gold)",
                      color: "#000",
                      border: "none",
                      borderRadius: "4px",
                      cursor: otpLoading || otpCode.length !== 6 ? "not-allowed" : "pointer",
                      fontWeight: "bold",
                      opacity: otpLoading || otpCode.length !== 6 ? 0.6 : 1,
                    }}
                  >
                    {otpLoading ? "Verifying..." : "Verify OTP"}
                  </button>

                  <button
                    type="button"
                    onClick={resendOTP}
                    disabled={otpLoading || resendCooldown > 0}
                    style={{
                      flex: 1,
                      padding: "10px",
                      backgroundColor: "rgba(255, 215, 0, 0.2)",
                      color: "var(--gold)",
                      border: "1px solid var(--gold)",
                      borderRadius: "4px",
                      cursor: otpLoading || resendCooldown > 0 ? "not-allowed" : "pointer",
                      fontWeight: "bold",
                      opacity: otpLoading || resendCooldown > 0 ? 0.6 : 1,
                    }}
                  >
                    {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend"}
                  </button>
                </div>

                {otpError && (
                  <div style={{
                    color: otpError.includes("resent successfully") ? "#4caf50" : "#ff6b6b",
                    fontSize: "13px",
                    marginTop: "8px",
                    width: "100%",
                    textAlign: "center",
                  }}>
                    {otpError}
                  </div>
                )}

                {otpAttempts > 0 && otpAttempts < 3 && (
                  <div style={{
                    color: "#ffa500",
                    fontSize: "12px",
                    marginTop: "8px",
                  }}>
                    Attempts: {otpAttempts}/3
                  </div>
                )}
              </form>
            </div>
          )}

          {/* OTP Verified Badge */}
          {otpVerified && (
            <div style={{
              backgroundColor: "rgba(76, 175, 80, 0.1)",
              border: "2px solid #4caf50",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "16px",
              textAlign: "center",
            }}>
              <span style={{ color: "#4caf50", fontWeight: "bold" }}>✓ OTP Verified</span>
              <button
                onClick={startTrip}
                disabled={otpLoading}
                style={{
                  marginLeft: "12px",
                  padding: "8px 16px",
                  backgroundColor: "#4caf50",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: otpLoading ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                  opacity: otpLoading ? 0.6 : 1,
                }}
              >
                {otpLoading ? "Starting..." : "▶ Start Trip"}
              </button>
            </div>
          )}

          {/* Messages List */}
          <div
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              borderRadius: "4px",
              padding: "12px",
              maxHeight: "300px",
              overflowY: "auto",
              marginBottom: "12px",
              minHeight: "100px",
            }}
          >
            {loading ? (
              <div style={{ color: "#999", textAlign: "center" }}>Loading messages...</div>
            ) : messages.length === 0 ? (
              <div style={{ color: "#999", textAlign: "center" }}>No messages yet</div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    padding: "8px",
                    marginBottom: "8px",
                    backgroundColor:
                      msg.senderEmail === driverEmail
                        ? "rgba(255, 215, 0, 0.1)"
                        : "rgba(100, 200, 255, 0.1)",
                    borderLeft:
                      msg.senderEmail === driverEmail
                        ? "3px solid var(--gold)"
                        : "3px solid #64c8ff",
                    borderRadius: "4px",
                    cursor: !msg.readFlag && msg.receiverEmail === driverEmail ? "pointer" : "default",
                  }}
                  onClick={() => {
                    if (!msg.readFlag && msg.receiverEmail === driverEmail) {
                      markAsRead(msg.id);
                    }
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <strong style={{ color: msg.senderEmail === driverEmail ? "var(--gold)" : "#64c8ff" }}>
                      {msg.senderEmail === driverEmail ? "You" : msg.senderEmail}
                    </strong>
                    <span style={{ color: "#999" }}>{new Date(msg.createdAt).toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: "13px", marginTop: "4px", color: "#ddd", wordWrap: "break-word" }}>
                    {msg.content}
                  </div>
                  {!msg.readFlag && msg.receiverEmail === driverEmail && (
                    <div style={{ fontSize: "11px", color: "#ff6b6b", marginTop: "4px" }}>
                      ● Unread
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Send Message */}
          <form onSubmit={sendMessage} style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <select
              value={messageType}
              onChange={(e) => setMessageType(e.target.value)}
              style={{
                flex: "0 0 120px",
                padding: "8px",
                borderRadius: "4px",
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                borderLeft: "2px solid var(--gold)",
                color: "#ddd",
                cursor: "pointer",
              }}
            >
              <option value="GENERAL">General</option>
              <option value="TRIP_UPDATE">Trip Update</option>
              <option value="DIRECTION_REQUEST">Need Direction</option>
              <option value="DELAY_ALERT">Delay Alert</option>
            </select>

            <input
              type="text"
              placeholder="Send direction or message to employee..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending}
              style={{
                flex: 1,
                minWidth: "200px",
                padding: "8px 12px",
                borderRadius: "4px",
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(255, 215, 0, 0.3)",
                color: "#ddd",
              }}
            />

            <button
              type="submit"
              disabled={sending}
              style={{
                padding: "8px 16px",
                backgroundColor: "var(--gold)",
                color: "#000",
                border: "none",
                borderRadius: "4px",
                cursor: sending ? "not-allowed" : "pointer",
                fontWeight: "bold",
                opacity: sending ? 0.6 : 1,
              }}
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </form>

          {error && (
            <div style={{ color: "#ff6b6b", marginTop: "8px", fontSize: "12px" }}>
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TripCommunication;
