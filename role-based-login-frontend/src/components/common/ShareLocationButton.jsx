import React, { useState, useEffect } from "react";
import axios from "axios";
import { authStorage } from "../../auth/storage";
import { API_BASE_URL } from "../../api/client";

const ShareLocationButton = () => {
  const [sharing, setSharing] = useState(false);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const token = authStorage.getToken();

  // Request geolocation permission and send location to server
  const shareLocation = async () => {
    setSharing(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setSharing(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });

          // Send location to backend
          const response = await axios.post(
            `${API_BASE_URL}/api/driver/location/update`,
            {
              latitude: latitude,
              longitude: longitude,
              address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          setLastUpdate(new Date().toLocaleTimeString());
          console.log("Location shared:", response.data);
        } catch (err) {
          console.error("Error sharing location:", err);
          setError("Failed to share location. Please try again.");
        } finally {
          setSharing(false);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError(
          err.code === 1
            ? "Location permission denied. Enable in settings."
            : "Unable to get your location. Please check your device settings."
        );
        setSharing(false);
      }
    );
  };

  // Auto-share location every 30 seconds when on active booking
  useEffect(() => {
    // Optional: Uncomment to auto-share location periodically
    // const interval = setInterval(shareLocation, 30000);
    // return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        padding: "12px",
        backgroundColor: "rgba(0, 200, 100, 0.1)",
        border: "1px solid rgba(0, 200, 100, 0.3)",
        borderRadius: "6px",
        marginBottom: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          onClick={shareLocation}
          disabled={sharing}
          style={{
            padding: "10px 16px",
            backgroundColor: sharing ? "#666" : "#00c864",
            color: "#000",
            border: "none",
            borderRadius: "4px",
            cursor: sharing ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: "13px",
          }}
        >
          {sharing ? "📍 Sharing..." : "📍 Share Location"}
        </button>

        <div style={{ flex: 1 }}>
          {lastUpdate && (
            <div style={{ color: "#00c864", fontSize: "12px" }}>
              ✓ Location updated at {lastUpdate}
            </div>
          )}
          {location && (
            <div style={{ color: "#999", fontSize: "11px" }}>
              {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </div>
          )}
          {error && (
            <div style={{ color: "#ff6b6b", fontSize: "12px" }}>
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>

      <div style={{ fontSize: "11px", color: "#999", marginTop: "8px" }}>
        💡 Employees can see your location on the map during active bookings. Share your location
        for better coordination.
      </div>
    </div>
  );
};

export default ShareLocationButton;
