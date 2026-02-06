import React, { useEffect, useState } from "react";
import axios from "axios";
import TopNav from "../common/TopNav";
import { authStorage } from "../../auth/storage";

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
      const res = await axios.get(`http://localhost:8080/api/driver/profile?email=${driverEmail}`, {
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
      const response = await axios.get(`http://localhost:8080/api/driver/mytrips?email=${driverEmail}`, {
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
        `http://localhost:8080/api/driver/availability?email=${driverEmail}&available=${!driver.available}`,
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
      await axios.put(`http://localhost:8080/api/driver/complete-trip/${bookingId}`, null, {
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
      <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>My Driver Dashboard</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ padding: "6px 10px", borderRadius: 999, background: driver?.available ? "#DCFCE7" : "#FEE2E2", color: "#111827", fontWeight: 600 }}>
            {driver?.available ? "Available" : "Not Available"}
          </span>
          <button onClick={toggleAvailability} disabled={busy || !driver} className="btnGhost">
            Toggle availability
          </button>
        </div>
      </div>

      <h3 style={{ marginTop: 18 }}>Assigned trips</h3>

      {trips.length === 0 ? (
        <p>No trips assigned today.</p>
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
      </div>
      </div>
    </>
  );
};

export default DriverDashboard;
