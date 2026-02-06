import React from "react";
import { Link } from "react-router-dom";
import TopNav from "./common/TopNav";
import LiveMouseBackground from "./common/LiveMouseBackground";
import { authStorage } from "../auth/storage";
import { displayNameFromEmail } from "./common/displayName";
function DriverDashBoard() {
  const name = displayNameFromEmail(authStorage.getEmail());
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

          <div className="card">
            <div className="cardInner">
              <h3 style={{ marginTop: 0, color: "var(--gold)", fontWeight: 900 }}>Available options</h3>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link className="linkGold" to="/driver/complete-trip">Complete Trip</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
);
}
export default DriverDashBoard;
