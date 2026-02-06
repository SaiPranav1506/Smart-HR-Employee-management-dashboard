import React, { useEffect, useState } from "react";
import axios from "axios";
import TopNav from "../common/TopNav";
import { authStorage } from "../../auth/storage";
import LiveMouseBackground from "../common/LiveMouseBackground";
import { displayNameFromEmail } from "../common/displayName";

const EmployeeDashboard = () => {
  const [work, setWork] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const token = authStorage.getToken();
    const email = authStorage.getEmail();

    try {
      const [workRes, bookingRes] = await Promise.all([
        axios.get(`http://localhost:8080/api/employee/my-work?email=${email}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`http://localhost:8080/api/employee/my-bookings?email=${email}`, {
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
        `http://localhost:8080/api/employee/complete-work?assignmentId=${assignmentId}&employeeEmail=${encodeURIComponent(email)}`,
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
            <table className="table">
              <thead>
                <tr>
                  <th>Pickup</th>
                  <th>Drop</th>
                  <th>Time</th>
                  <th>Cab Type</th>
                  <th>Driver</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td>{b.pickup}</td>
                    <td>{b.dropLocation}</td>
                    <td>{b.pickupTime}</td>
                    <td>{b.cabType}</td>
                    <td>{b.driverEmail || "Not Assigned"}</td>
                    <td>{b.status}</td>
                    <td>{b.bookingDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
