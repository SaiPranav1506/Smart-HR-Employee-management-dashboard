import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { authStorage } from "../../auth/storage";
import { API_BASE_URL } from "../../api/client";
import TopNav from "../common/TopNav";
import LiveMouseBackground from "../common/LiveMouseBackground";

function CompleteTrip() {
  const navigate = useNavigate();
  const token = authStorage.getToken();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(null);

  const fetchInProgressTrips = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/driver/assigned-trips`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // Filter for IN_PROGRESS status
      const inProgressTrips = response.data.filter(trip => trip.status === "IN_PROGRESS");
      setTrips(inProgressTrips);
    } catch (err) {
      console.error("Error fetching trips:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInProgressTrips();
  }, [fetchInProgressTrips]);

  const completeTrip = async (bookingId) => {
    try {
      setCompleting(bookingId);
      const response = await axios.put(
        `${API_BASE_URL}/api/driver/complete-trip/${bookingId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (response.data || response.status === 200) {
        alert("Trip completed successfully!");
        await fetchInProgressTrips();
        // If no more trips, go back to dashboard
        if (trips.filter(t => t.id !== bookingId).length === 0) {
          navigate("/driver-dashboard");
        }
      }
    } catch (err) {
      console.error("Error completing trip:", err);
      alert("Failed to complete trip. Please try again.");
    } finally {
      setCompleting(null);
    }
  };

  return (
    <>
      <TopNav title="Complete Trip" />
      <div className="page">
        <LiveMouseBackground />
        <div className="container" style={{ maxWidth: 900 }}>
          <h2 className="hTitle">Complete Your Trips</h2>
          <div className="subtle" style={{ marginTop: 8 }}>
            View all your active trips and mark them as completed when you reach the destination.
          </div>

          <div style={{ height: 20 }} />

          {loading ? (
            <div style={{ color: "#999", textAlign: "center", paddingTop: "20px" }}>
              Loading trips...
            </div>
          ) : trips.length === 0 ? (
            <div className="card">
              <div className="cardInner">
                <div style={{ color: "#999", textAlign: "center", padding: "20px" }}>
                  <p>No trips in progress. All done! 🎉</p>
                  <button
                    onClick={() => navigate("/driver-dashboard")}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "var(--gold)",
                      color: "#000",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      marginTop: "10px",
                    }}
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </div>
          ) : (
            trips.map((trip) => (
              <div key={trip.id} className="card" style={{ backgroundColor: "rgba(76, 175, 80, 0.05)", borderLeft: "4px solid #4caf50" }}>
                <div className="cardInner">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <h4 style={{ marginTop: 0, marginBottom: "8px", color: "var(--gold)" }}>
                        Trip #{trip.id}
                      </h4>
                      <div style={{ fontSize: "14px", color: "#ddd", lineHeight: "1.6" }}>
                        <div><strong>Employee:</strong> {trip.employeeName} ({trip.employeeEmail})</div>
                        <div><strong>Pickup:</strong> {trip.pickup}</div>
                        <div><strong>Drop:</strong> {trip.dropLocation}</div>
                        <div style={{ marginTop: "8px" }}>
                          <span style={{
                            display: "inline-block",
                            padding: "4px 12px",
                            backgroundColor: "#4caf50",
                            color: "#fff",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}>
                            ✓ In Progress
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => completeTrip(trip.id)}
                      disabled={completing === trip.id}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "#4caf50",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: completing === trip.id ? "not-allowed" : "pointer",
                        fontWeight: "bold",
                        opacity: completing === trip.id ? 0.6 : 1,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {completing === trip.id ? "Completing..." : "✓ Complete Trip"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          <div style={{ height: 20 }} />
          <button
            onClick={() => navigate("/driver-dashboard")}
            style={{
              padding: "10px 20px",
              backgroundColor: "rgba(255, 215, 0, 0.2)",
              color: "var(--gold)",
              border: "1px solid var(--gold)",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </>
  );
}

export default CompleteTrip;
