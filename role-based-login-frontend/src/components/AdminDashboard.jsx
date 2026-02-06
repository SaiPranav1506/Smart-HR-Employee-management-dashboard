import React from "react";
import { Link } from "react-router-dom";
import TopNav from "./common/TopNav";
import LiveMouseBackground from "./common/LiveMouseBackground";
import { authStorage } from "../auth/storage";
import { displayNameFromEmail } from "./common/displayName";

function AdminDashboard() {
  const name = displayNameFromEmail(authStorage.getEmail());
  return (
    <>
      <TopNav title="Admin Dashboard" />
      <div className="page">
        <LiveMouseBackground />
        <div className="container" style={{ maxWidth: 900 }}>
          <h2 className="hTitle">Admin Dashboard</h2>
          <div className="subtle" style={{ marginTop: 8 }}>
            Hello {name}, welcome to the admin workspace. From here you can manage driver accounts and keep operational
            data clean for HR and employees. Use the options below to add new drivers, review the driver list, and
            validate records quickly. If you need to coordinate with HR or drivers, Chat is always available in the top
            navigation.
          </div>

          <div style={{ height: 14 }} />

          <div className="card">
            <div className="cardInner">
              <h3 style={{ marginTop: 0, color: "var(--gold)", fontWeight: 900 }}>Driver management</h3>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link className="linkGold" to="/admin/add-driver">Add driver</Link>
                <Link className="linkGold" to="/admin/view-drivers">View drivers</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminDashboard;
