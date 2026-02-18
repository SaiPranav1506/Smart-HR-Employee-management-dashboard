import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import TopNav from "./common/TopNav";
import LiveMouseBackground from "./common/LiveMouseBackground";
import { authStorage } from "../auth/storage";
import { displayNameFromEmail } from "./common/displayName";
import TripCommunication from "./driver/TripCommunication";
import { API_BASE_URL } from "../api/client";

function DriverDashBoard() {
  const name = displayNameFromEmail(authStorage.getEmail());
  const driverEmail = authStorage.getEmail();
  const token = authStorage.getToken();
  
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(false);

  const weatherDescriptions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Foggy",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
  };

  useEffect(() => {
    const fetchWeatherByDefault = async () => {
      try {
        setLoading(true);
        // Default location (New York) - replace with your preferred location
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current=temperature_2m,weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`,
          { signal: AbortSignal.timeout(5000) }
        );
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const current = data.current;
        
        console.log("Weather data fetched:", current);

        setWeather({
          temperature: current.temperature_2m,
          condition: weatherDescriptions[current.weather_code] || "Unknown",
          weatherCode: current.weather_code,
          tempMax: current.temperature_2m_max,
          tempMin: current.temperature_2m_min
        });
        setError(null);
      } catch (err) {
        console.error("Weather fetch error:", err);
        setError(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherByDefault();
  }, []);

  // Fetch assigned trips
  useEffect(() => {
    const fetchAssignedTrips = async () => {
      try {
        setLoadingTrips(true);
        const response = await axios.get(
          `${API_BASE_URL}/api/driver/assigned-trips`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setTrips(response.data || []);
      } catch (err) {
        console.error("Error fetching assigned trips:", err);
      } finally {
        setLoadingTrips(false);
      }
    };

    fetchAssignedTrips();
  }, [token]);

  const getWeatherEmoji = (code) => {
    if (code === 0) return "☀️";
    if (code <= 3) return "🌤️";
    if (code === 45 || code === 48) return "🌫️";
    if (code <= 55) return "🌧️";
    if (code <= 66) return "🌧️";
    if (code <= 86) return "❄️";
    if (code >= 95) return "⛈️";
    return "🌥️";
  };

  return (
    <>
      <TopNav title="Driver Dashboard" />
      <div className="page">
        <LiveMouseBackground />
        <div className="container" style={{ maxWidth: 900 }}>
          <h2 className="hTitle">Driver Dashboard</h2>
          <div className="subtle" style={{ marginTop: 8 }}>
            Hello {name}, hope your shift is going smoothly. Use this dashboard to view what’s assigned to you and to
            keep trip status accurate for HR and employees. The options below show what’s available in this screen.
            When more driver actions are enabled, they’ll appear here automatically.
          </div>

          <div style={{ height: 14 }} />
          {/* Weather Card */}
          <div className="card" style={{ backgroundColor: "rgba(255, 215, 0, 0.05)", borderLeft: "4px solid var(--gold)" }}>
            <div className="cardInner">
              <h3 style={{ marginTop: 0, color: "var(--gold)", fontWeight: 900 }}>Current Weather</h3>
              {loading ? (
                <div style={{ color: "#999" }}>Loading weather data...</div>
              ) : error ? (
                <div style={{ color: "#f44" }}>{error}</div>
              ) : weather ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "48px", marginBottom: "8px" }}>
                      {getWeatherEmoji(weather.weatherCode)}
                    </div>
                    <div style={{ fontSize: "14px", color: "#ccc", marginTop: "4px" }}>
                      {weather.condition}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "32px", fontWeight: "bold", color: "var(--gold)" }}>
                      {Math.round(weather.temperature)}°C
                    </div>
                    {weather.tempMax && weather.tempMin && (
                      <div style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>
                        High: {Math.round(weather.tempMax)}°C / Low: {Math.round(weather.tempMin)}°C
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div style={{ height: 14 }} />
          <div className="card">
            <div className="cardInner">
              <h3 style={{ marginTop: 0, color: "var(--gold)", fontWeight: 900 }}>Available options</h3>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link className="linkGold" to="/driver/complete-trip">Complete Trip</Link>
              </div>
            </div>
          </div>

          <div style={{ height: 14 }} />

          {/* Assigned Trips with Communication */}
          <div className="card" style={{ backgroundColor: "rgba(255, 215, 0, 0.02)" }}>
            <div className="cardInner">
              <h3 style={{ marginTop: 0, color: "var(--gold)", fontWeight: 900 }}>
                Assigned Trips ({trips.length})
              </h3>
              {loadingTrips ? (
                <div style={{ color: "#999" }}>Loading assigned trips...</div>
              ) : trips.length === 0 ? (
                <div style={{ color: "#999" }}>No trips currently assigned to you.</div>
              ) : (
                <div style={{ marginTop: "12px" }}>
                  {trips.map((trip) => (
                    <TripCommunication
                      key={trip.id}
                      tripId={trip.id}
                      employeeEmail={trip.employeeEmail}
                      employeeName={trip.employeeName}
                      pickup={trip.pickup}
                      dropLocation={trip.dropLocation}
                      pickupTime={trip.pickupTime}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
);
}
export default DriverDashBoard;
