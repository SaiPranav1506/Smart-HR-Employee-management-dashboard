import React, { useEffect, useState } from "react";
import axios from "axios";
import TopNav from "../common/TopNav";
import { authStorage } from "../../auth/storage";
import LiveMouseBackground from "../common/LiveMouseBackground";
import { displayNameFromEmail } from "../common/displayName";

import { API_BASE_URL } from "../../api/client";

const DriverDashboard = () => {
  const [trips, setTrips] = useState([]);
  const [driver, setDriver] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchMyTrips();
    fetchProfile();
  }, []);

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

      <h3 style={{ marginTop: 18 }}>Assigned trips</h3>

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
