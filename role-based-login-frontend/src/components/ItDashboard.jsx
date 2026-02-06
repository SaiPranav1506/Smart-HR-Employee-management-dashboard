import React from "react";
import TopNav from "./common/TopNav";
import LiveMouseBackground from "./common/LiveMouseBackground";
import { authStorage } from "../auth/storage";
import { displayNameFromEmail } from "./common/displayName";

function ItDashboard() {
  const name = displayNameFromEmail(authStorage.getEmail());
  return (
    <>
      <TopNav title="IT Dashboard" />
      <div className="page">
        <LiveMouseBackground />
        <div className="container" style={{ maxWidth: 900 }}>
          <h2 className="hTitle">IT Dashboard</h2>
          <div className="subtle" style={{ marginTop: 8 }}>
            Hello {name}, welcome to IT operations. This area is intended for support tasks like reviewing access,
            checking role permissions, and helping users who can’t sign in or see updates. Keep the platform reliable by
            validating configuration and responding to issues quickly. Options will appear below as IT modules are added.
          </div>

          <div style={{ height: 14 }} />

          <div className="card">
            <div className="cardInner">
              <h3 style={{ marginTop: 0, color: "var(--gold)", fontWeight: 900 }}>Available options</h3>
              <div className="subtle">No IT actions are configured in this build yet.</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ItDashboard;
