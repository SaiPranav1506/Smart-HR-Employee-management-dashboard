import React, { useEffect, useState } from "react";
import axios from "axios";
import TopNav from "../common/TopNav";
import { authStorage } from "../../auth/storage";
import SendDirections from "../employee/SendDirections";

import { API_BASE_URL } from "../../api/client";

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [expandedBooking, setExpandedBooking] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const token = authStorage.getToken();
    const email = authStorage.getEmail();
    console.log("HR Email from localStorage:", email);

    try {
      const res = await axios.get(`${API_BASE_URL}/api/hr/mybookings?email=${email}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBookings(res.data);
    } catch (err) {
      console.error("Failed to fetch HR bookings", err);
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
      <TopNav
        title="HR • My bookings 📅"
        links={[
          { to: "/hr-dashboard", label: "Dashboard 🏠" },
          { to: "/hr/book-cab", label: "Book cab 🚕" },
          { to: "/hr/assign-work", label: "Assign work 📝" },
          { to: "/hr/my-assignments", label: "Assignments 📋" },
          { to: "/hr/my-employees", label: "Employees 👥" },
        ]}
      />
      <div className="page">
        <div className="container">
        <h2 className="hTitle">My cab bookings</h2>

      {bookings.length === 0 ? (
        <p>No bookings yet.</p>
      ) : (
        bookings.map((b) => (
          <div
            key={b.id}
            className="card"
            style={{ marginBottom: "16px" }}
          >
            <div
              className="cardInner"
              style={{
                cursor: "pointer",
                backgroundColor: b.driverEmail ? "rgba(100, 200, 255, 0.02)" : "rgba(255, 100, 100, 0.02)"
              }}
              onClick={() => setExpandedBooking(expandedBooking === b.id ? null : b.id)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ marginTop: 0, marginBottom: "8px", color: "var(--gold)" }}>
                    {b.employeeName} - {b.pickup} → {b.dropLocation}
                  </h3>
                  <div style={{ fontSize: "13px", color: "#ccc", lineHeight: "1.6" }}>
                    <div>📧 {b.employeeEmail || "—"}</div>
                    <div>🚕 {b.cabType} • ⏰ {b.pickupTime} • 📅 {b.bookingDate}</div>
                    <div>
                      🚗 Driver: <strong style={{ color: b.driverEmail ? "var(--gold)" : "#ff6b6b" }}>
                        {b.driverEmail || "Not Assigned"}
                      </strong>
                    </div>
                    <div>
                      📊 Status: <strong style={{ color: getStatusColor(b.status) }}>
                        {b.status}
                      </strong>
                    </div>
                  </div>
                </div>
                <span style={{ color: "var(--gold)", fontSize: "24px" }}>
                  {expandedBooking === b.id ? "▼" : "▶"}
                </span>
              </div>

              {expandedBooking === b.id && b.driverEmail && (
                <div style={{ marginTop: "16px", borderTop: "1px solid rgba(255, 215, 0, 0.2)", paddingTop: "16px" }}>
                  <SendDirections
                    tripId={b.id}
                    driverEmail={b.driverEmail}
                    driverName={b.driverEmail}
                    employeeEmail={b.employeeEmail}
                    pickup={b.pickup}
                    dropLocation={b.dropLocation}
                  />
                </div>
              )}

              {expandedBooking === b.id && !b.driverEmail && (
                <div style={{ marginTop: "16px", color: "#ff6b6b", fontSize: "13px" }}>
                  ⚠️ No driver assigned yet. Messaging will be available after driver assignment.
                </div>
              )}
            </div>
          </div>
        ))
      )}
      </div>
      </div>
    </>
  );
};

export default MyBookings;
