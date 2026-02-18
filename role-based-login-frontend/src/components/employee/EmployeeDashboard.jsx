import React, { useEffect, useState } from "react";
import axios from "axios";
import TopNav from "../common/TopNav";
import { authStorage } from "../../auth/storage";
import LiveMouseBackground from "../common/LiveMouseBackground";
import { displayNameFromEmail } from "../common/displayName";
import SendDirections from "./SendDirections";

import { API_BASE_URL } from "../../api/client";

const EmployeeDashboard = () => {
  const [work, setWork] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [expandedBooking, setExpandedBooking] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const token = authStorage.getToken();
    const email = authStorage.getEmail();

    try {
      const [workRes, bookingRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/employee/my-work?email=${email}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/api/employee/my-bookings?email=${email}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setWork(workRes.data);
      setBookings(bookingRes.data);
    } catch (e) {
      console.error("Failed to load employee dashboard", e);
    }
  };

  const completeWork = async (assignmentId) => {
    const token = authStorage.getToken();
    const email = authStorage.getEmail();

    setBusyId(assignmentId);
    try {
      await axios.put(
        `${API_BASE_URL}/api/employee/complete-work?assignmentId=${assignmentId}&employeeEmail=${encodeURIComponent(email)}`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchAll();
    } catch (e) {
      console.error("Failed to complete work", e);
      alert("Failed to complete work");
    } finally {
      setBusyId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "ASSIGNED":
        return "var(--gold)";
      case "COMPLETED":
        return "#4ade80";
      case "CANCELLED":
        return "#ff6b6b";
      case "REQUESTED":
        return "#3b82f6";
      default:
        return "#ccc";
    }
  };

  return (
    <>
      <TopNav title="Employee Dashboard" />
      <div className="page">
        <LiveMouseBackground />
        <div className="container">
          <section className="dashHero dashHeroEmployee" aria-label="Employee dashboard introduction">
            <div className="dashHeroInner">
              <div className="dashHeroKicker">Employee Home</div>
              <h1 className="dashHeroTitle">Hello {displayNameFromEmail(authStorage.getEmail())}.</h1>
              <p className="dashHeroText">
                Welcome back. This page is designed to keep your day organized: review assigned work, complete tasks with
                a single click, and track cab bookings with driver and status updates. Use the options below to take the
                next action quickly — no hunting through multiple pages. If something is unclear (task details, timing,
                pickup changes, or directions), use Chat from the top bar to reach HR or coordinate with a driver while
                keeping context in one place.
              </p>
              <div className="dashHeroActions">
                <a className="btnPrimary" href="#dash-options">View options</a>
              </div>
            </div>
          </section>

        <section id="dash-options" className="dashOptions" aria-label="Employee dashboard options">
        <h2 className="hTitle">Available options</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 18, marginTop: 12 }}>
        <div className="card">
          <div className="cardInner">
          <h3 style={{ marginTop: 0, color: "var(--gold)", fontWeight: 900 }}>My assigned work</h3>
          {work.length === 0 ? (
            <p className="subtle">No work assigned yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Assigned Date</th>
                  <th>Assigned By</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {work.map((w) => (
                  <tr key={w.id}>
                    <td>{w.title}</td>
                    <td>{w.description}</td>
                    <td>{w.status}</td>
                    <td>{w.assignedDate}</td>
                    <td>{w.hrEmail}</td>
                    <td>
                      {String(w.status || "").toUpperCase() === "DONE" ? (
                        "—"
                      ) : (
                        <button
                          onClick={() => completeWork(w.id)}
                          disabled={busyId === w.id}
                          className="btnPrimary"
                        >
                          {busyId === w.id ? "Completing..." : "Complete"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          </div>
        </div>

        <div className="card">
          <div className="cardInner">
          <h3 style={{ marginTop: 0, color: "var(--gold)", fontWeight: 900 }}>My cab bookings</h3>
          {bookings.length === 0 ? (
            <p className="subtle">No bookings yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {bookings.map((b) => (
                <div
                  key={b.id}
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.2)",
                    border: "1px solid rgba(255, 215, 0, 0.2)",
                    borderRadius: "6px",
                    padding: "12px",
                    cursor: "pointer",
                  }}
                  onClick={() => setExpandedBooking(expandedBooking === b.id ? null : b.id)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h4 style={{ marginTop: 0, marginBottom: "6px", color: "var(--gold)" }}>
                        {b.pickup} → {b.dropLocation}
                      </h4>
                      <div style={{ fontSize: "12px", color: "#ccc", lineHeight: "1.5" }}>
                        <div>⏰ {b.pickupTime} • 🚕 {b.cabType} • 📅 {b.bookingDate}</div>
                        <div>
                          🚗 <strong style={{ color: b.driverEmail ? "var(--gold)" : "#ff6b6b" }}>
                            {b.driverEmail || "Not Assigned"}
                          </strong>
                        </div>
                        <div>
                          📊 <strong style={{ color: getStatusColor(b.status) }}>
                            {b.status}
                          </strong>
                        </div>
                      </div>
                    </div>
                    <span style={{ color: "var(--gold)", fontSize: "20px" }}>
                      {expandedBooking === b.id ? "▼" : "▶"}
                    </span>
                  </div>

                  {expandedBooking === b.id && b.driverEmail && (
                    <div style={{ marginTop: "12px", borderTop: "1px solid rgba(255, 215, 0, 0.2)", paddingTop: "12px" }}>
                      <SendDirections
                        tripId={b.id}
                        driverEmail={b.driverEmail}
                        driverName={b.driverEmail}
                        employeeEmail={authStorage.getEmail()}
                        pickup={b.pickup}
                        dropLocation={b.dropLocation}
                      />
                    </div>
                  )}

                  {expandedBooking === b.id && !b.driverEmail && (
                    <div style={{ marginTop: "12px", color: "#ff6b6b", fontSize: "12px" }}>
                      ⚠️ No driver assigned yet. You'll be able to send directions once a driver is assigned.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      </div>
      </section>
      </div>
      </div>
    </>
  );
};

export default EmployeeDashboard;
