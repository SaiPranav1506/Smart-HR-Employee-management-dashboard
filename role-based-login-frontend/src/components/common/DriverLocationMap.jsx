import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import { authStorage } from "../../auth/storage";
import { API_BASE_URL } from "../../api/client";
import "leaflet/dist/leaflet.css";

// Custom icon for driver marker
const driverIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom icon for pickup marker
const pickupIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom icon for dropoff marker
const dropoffIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DriverLocationMap = ({ driverEmail, pickupLocation, dropLocation }) => {
  const [driverLocation, setDriverLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = authStorage.getToken();

  // Fetch driver's current location
  const fetchDriverLocation = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/driver/location/${driverEmail}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDriverLocation(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching driver location:", err);
      setError("Unable to fetch driver location. Driver may not have shared location yet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverLocation();
    // Refresh location every 10 seconds
    const interval = setInterval(fetchDriverLocation, 10000);
    return () => clearInterval(interval);
  }, [driverEmail, token]);

  if (loading) {
    return (
      <div style={{ padding: "12px", textAlign: "center", color: "var(--muted)" }}>
        Loading driver location...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "12px", color: "var(--error, #ff6b6b)", fontSize: "12px" }}>
        📍 {error}
      </div>
    );
  }

  if (!driverLocation || !driverLocation.latitude) {
    return (
      <div style={{ padding: "12px", color: "var(--muted)", fontSize: "12px" }}>
        📍 Driver location not available yet
      </div>
    );
  }

  // Center map on driver location
  const mapCenter = [driverLocation.latitude, driverLocation.longitude];
  const lastUpdate = new Date(driverLocation.lastUpdate).toLocaleTimeString();

  return (
    <div style={{ marginTop: "12px", borderRadius: "6px", overflow: "hidden" }}>
      <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px" }}>
        Last updated: {lastUpdate}
      </div>
      <MapContainer
        center={mapCenter}
        zoom={15}
        style={{ height: "300px", width: "100%", borderRadius: "6px" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Driver location marker */}
        <Marker position={mapCenter} icon={driverIcon}>
          <Popup>
            <strong>{driverLocation.driverName}</strong>
            <br />
            Current Location
            <br />
            <small>{driverLocation.latitude.toFixed(4)}, {driverLocation.longitude.toFixed(4)}</small>
          </Popup>
        </Marker>

        {/* Accuracy circle around driver */}
        <Circle center={mapCenter} radius={100} color="red" fillOpacity={0.1} />

        {/* Pickup location (if available - using approximate coordinates) */}
        {pickupLocation && pickupLocation !== "Unknown" && (
          <Marker position={[driverLocation.latitude + 0.01, driverLocation.longitude + 0.01]} icon={pickupIcon}>
            <Popup>
              <strong>🟢 Pickup</strong>
              <br />
              {pickupLocation}
            </Popup>
          </Marker>
        )}

        {/* Drop-off location (if available - using approximate coordinates) */}
        {dropLocation && dropLocation !== "Unknown" && (
          <Marker position={[driverLocation.latitude - 0.01, driverLocation.longitude - 0.01]} icon={dropoffIcon}>
            <Popup>
              <strong>🔵 Drop-off</strong>
              <br />
              {dropLocation}
            </Popup>
          </Marker>
        )}
      </MapContainer>

      <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "8px", fontStyle: "italic" }}>
        ℹ️ Map updates automatically. Red marker shows driver's current location.
      </div>
    </div>
  );
};

export default DriverLocationMap;
