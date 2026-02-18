import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { authStorage } from "../../auth/storage";
import { API_BASE_URL } from "../../api/client";

const TripCommunication = ({ tripId, employeeEmail, employeeName, pickup, dropLocation, pickupTime }) => {
  const token = authStorage.getToken();
  const driverEmail = authStorage.getEmail();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [messageType, setMessageType] = useState("GENERAL");
  const [expandedMessages, setExpandedMessages] = useState(false);

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

  useEffect(() => {
    loadMessages();
    // Poll for new messages every 5 seconds
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [loadMessages]);


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
