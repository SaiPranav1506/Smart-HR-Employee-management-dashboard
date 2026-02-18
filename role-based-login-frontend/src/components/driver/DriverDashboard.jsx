import React, { useEffect, useState } from "react";
import axios from "axios";
import TopNav from "../common/TopNav";
import { authStorage } from "../../auth/storage";
import LiveMouseBackground from "../common/LiveMouseBackground";
import { displayNameFromEmail } from "../common/displayName";

import { API_BASE_URL } from "../../api/client";

const DriverDashboard = () => {
  const [trips, setTrips] = useState([]);
  const [requests, setRequests] = useState([]);
  const [driver, setDriver] = useState(null);
  const [busy, setBusy] = useState(false);

  const OPENWEATHER_API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;
  const DRIVER_LOCATION = "Hyderabad";

  // Widget for driver's current location (top right)
  const [driverLocationTemp, setDriverLocationTemp] = useState(null);
  const [driverLocationBusy, setDriverLocationBusy] = useState(false);

  // Search box for other cities
  const [cityInput, setCityInput] = useState("");
  const [temperatureC, setTemperatureC] = useState(null);
  const [weatherBusy, setWeatherBusy] = useState(false);
  const [weatherError, setWeatherError] = useState("");

  useEffect(() => {
    fetchMyTrips();
    fetchRideRequests();
    fetchProfile();
    fetchDriverLocationTemp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDriverLocationTemp = async () => {
    setDriverLocationBusy(true);
    try {
      const res = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
        params: {
          q: DRIVER_LOCATION,
          appid: OPENWEATHER_API_KEY,
          units: "metric",
        },
        timeout: 15000,
      });
      const t = res?.data?.main?.temp;
      if (typeof t === "number") {
        setDriverLocationTemp(t);
      }
    } catch (e) {
      console.error("Error fetching driver location weather", e);
      setDriverLocationTemp(null);
    } finally {
      setDriverLocationBusy(false);
    }
  };

  const fetchTemperature = async (city) => {
    const c = (city || "").trim();
    setWeatherError("");
    setTemperatureC(null);

    if (!c) return;
    if (!OPENWEATHER_API_KEY) {
      setWeatherError("Missing OpenWeather API key. Set REACT_APP_OPENWEATHER_API_KEY in role-based-login-frontend/.env and restart the frontend.");
      return;
    }

    setWeatherBusy(true);
    try {
      const res = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
        params: {
          q: c,
          appid: OPENWEATHER_API_KEY,
          units: "metric",
        },
        timeout: 15000,
      });
      const t = res?.data?.main?.temp;
      setTemperatureC(typeof t === "number" ? t : null);
      if (typeof t !== "number") {
        setWeatherError("Could not read temperature from OpenWeather response.");
      }
    } catch (e) {
      console.error("Error fetching weather", e);
      setWeatherError("Could not fetch temperature. Check city name and API key.");
    } finally {
      setWeatherBusy(false);
    }
  };

  const fetchProfile = async () => {
    const token = authStorage.getToken();
    const driverEmail = authStorage.getEmail();

    try {
      const res = await axios.get(`${API_BASE_URL}/api/driver/profile?email=${driverEmail}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDriver(res.data);
    } catch (e) {
      console.error("Error fetching driver profile", e);
    }
  };

  const fetchMyTrips = async () => {
    const token = authStorage.getToken();
    const driverEmail = authStorage.getEmail();

    try {
      const response = await axios.get(`${API_BASE_URL}/api/driver/mytrips?email=${driverEmail}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setTrips(response.data);
    } catch (error) {
      console.error("Error fetching driver trips", error);
    }
  };

  const fetchRideRequests = async () => {
    const token = authStorage.getToken();
    const driverEmail = authStorage.getEmail();

    try {
      const response = await axios.get(`${API_BASE_URL}/api/driver/ride-requests?email=${driverEmail}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setRequests(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching ride requests", error);
      setRequests([]);
    }
  };

  const acceptTrip = async (bookingId) => {
    const token = authStorage.getToken();
    const driverEmail = authStorage.getEmail();
    setBusy(true);
    try {
      await axios.put(`${API_BASE_URL}/api/driver/accept-trip/${bookingId}?email=${driverEmail}`, null, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchMyTrips();
      await fetchRideRequests();
      await fetchProfile();
    } catch (e) {
      console.error("Error accepting trip", e);
      alert("Could not accept trip. Please check availability and try again.");
    } finally {
      setBusy(false);
    }
  };

  const toggleAvailability = async () => {
    if (!driver) return;
    const token = authStorage.getToken();
    const driverEmail = authStorage.getEmail();

    setBusy(true);
    try {
      await axios.put(
        `${API_BASE_URL}/api/driver/availability?email=${driverEmail}&available=${!driver.available}`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchProfile();
    } catch (e) {
      console.error("Error toggling availability", e);
    } finally {
      setBusy(false);
    }
  };

  const completeTrip = async (bookingId) => {
    const token = authStorage.getToken();
    setBusy(true);
    try {
      await axios.put(`${API_BASE_URL}/api/driver/complete-trip/${bookingId}`, null, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchMyTrips();
      await fetchProfile();
    } catch (e) {
      console.error("Error completing trip", e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <TopNav title="Driver Dashboard" />
      <div className="page">
        <LiveMouseBackground />

        {/* Weather widget for driver's current location (top right) */}
        <div
          style={{
            position: "fixed",
            top: 80,
            right: 20,
            background: "rgba(30, 41, 59, 0.95)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            borderRadius: 8,
            padding: "12px 16px",
            zIndex: 99,
            minWidth: 200,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
          }}
        >
          <div style={{ fontSize: 12, color: "rgba(203, 213, 225, 0.7)", marginBottom: 4 }}>
            {DRIVER_LOCATION}
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, color: "rgb(148, 163, 184)" }}>
            {driverLocationBusy ? "..." : (driverLocationTemp != null ? `${Math.round(driverLocationTemp)}°C` : "—")}
          </div>
        </div>

        <div className="container">
          <section className="dashHero dashHeroDriver" aria-label="Driver dashboard introduction">
            <div className="dashHeroInner">
              <div className="dashHeroKicker">Driver Home</div>
              <h1 className="dashHeroTitle">Hello {displayNameFromEmail(authStorage.getEmail())}.</h1>
              <p className="dashHeroText">
                Thanks for keeping things moving. This page helps you stay on top of your shift: set availability, review
                assigned trips, and mark trips complete when finished so HR and employees see real-time status. Keep your
                availability accurate to avoid delays and missed assignments. Use the trip list below for pickup/drop,
                timings, and employee details, and use Chat from the top navigation for quick coordination or directions.
              </p>
              <div className="dashHeroActions">
                <a className="btnPrimary" href="#dash-options">View options</a>
              </div>
            </div>
          </section>

          <section id="dash-options" className="dashOptions" aria-label="Driver dashboard options">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <h2 className="hTitle" style={{ margin: 0 }}>Available options</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  className="badge"
                  style={{
                    borderColor: driver?.available ? "rgba(34, 197, 94, 0.35)" : "rgba(248, 113, 113, 0.35)",
                    color: driver?.available ? "rgba(187, 247, 208, 0.92)" : "rgba(254, 202, 202, 0.92)",
                    background: driver?.available ? "rgba(34, 197, 94, 0.10)" : "rgba(248, 113, 113, 0.10)",
                  }}
                >
                  {driver?.available ? "Available" : "Not Available"}
                </span>
                <button onClick={toggleAvailability} disabled={busy || !driver} className="btnGhost">
                  Toggle availability
                </button>
              </div>
            </div>

            {/* Search for other cities */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 14 }}>
              <label className="subtle" style={{ margin: 0 }} htmlFor="driver-city-input">Search City Temperature</label>
              <input
                id="driver-city-input"
                type="text"
                placeholder="Enter city name"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    fetchTemperature(cityInput);
                  }
                }}
                className="input"
                style={{ minWidth: 220 }}
              />
              <button
                onClick={() => fetchTemperature(cityInput)}
                disabled={weatherBusy || !cityInput.trim()}
                className="btnGhost"
              >
                Get Temperature
              </button>
            </div>

            {/* Display searched city temperature below search bar */}
            <div style={{ marginTop: 12 }}>
              {weatherBusy ? (
                <p className="subtle">Fetching temperature…</p>
              ) : temperatureC != null ? (
                <p className="subtle" style={{ margin: 0, color: "rgba(187, 247, 208, 0.92)" }}>
                  <strong>{cityInput}</strong> Temperature: {Math.round(temperatureC)}°C
                </p>
              ) : null}
            </div>
            {weatherError ? (
              <p className="subtle" style={{ marginTop: 4, color: "rgba(254, 202, 202, 0.92)" }}>
                {weatherError}
              </p>
            ) : null}

      <h3 style={{ marginTop: 18 }}>Assigned trips</h3>

      <h3 style={{ marginTop: 18 }}>Ride requests</h3>
            <p className="subtle" style={{ marginTop: 6 }}>
              Requests match your cab type. Toggle availability to accept.
            </p>

            {requests.length === 0 ? (
              <p className="subtle">No pending ride requests right now.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Employee</th>
                    <th>Pickup</th>
                    <th>Drop</th>
                    <th>Time</th>
                    <th>Cab Type</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.employeeName}</td>
                      <td>{r.pickup}</td>
                      <td>{r.dropLocation}</td>
                      <td>{r.pickupTime}</td>
                      <td>{r.cabType}</td>
                      <td>{r.status}</td>
                      <td>
                        <button
                          onClick={() => acceptTrip(r.id)}
                          disabled={busy || !driver?.available}
                          className="btnPrimary"
                        >
                          Accept
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {trips.length === 0 ? (
              <p className="subtle">No trips assigned today.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Employee</th>
                    <th>Pickup</th>
                    <th>Drop</th>
                    <th>Time</th>
                    <th>Cab Type</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map((trip) => (
                    <tr key={trip.id}>
                      <td>{trip.id}</td>
                      <td>{trip.employeeName}</td>
                      <td>{trip.pickup}</td>
                      <td>{trip.dropLocation}</td>
                      <td>{trip.pickupTime}</td>
                      <td>{trip.cabType}</td>
                      <td>{trip.status}</td>
                      <td>
                        {trip.status === "ASSIGNED" ? (
                          <button
                            onClick={() => completeTrip(trip.id)}
                            disabled={busy}
                            className="btnPrimary"
                          >
                            Complete
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

export default DriverDashboard;
