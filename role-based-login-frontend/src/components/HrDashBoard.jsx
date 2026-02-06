import { Link } from "react-router-dom";
import TopNav from "./common/TopNav";
import React from "react";
function HrDashBoard() {
  return (
  <>
    <TopNav
      title="HR Dashboard 🧑‍💼"
    />
    <div className="page">
      <div className="container" style={{ maxWidth: 900 }}>
        <h2 className="hTitle">HR Dashboard 🧑‍💼</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
        <div className="card">
          <div className="cardInner">
          <h3 style={{ marginTop: 0, color: "#d4af37", fontWeight: 900 }}>Cab booking 🚕</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link className="linkGold" to="/hr/book-cab">Book a cab/van 🚖</Link>
            <Link className="linkGold" to="/hr/my-bookings">View my bookings 📅</Link>
          </div>
          </div>
        </div>

        <div className="card">
          <div className="cardInner">
          <h3 style={{ marginTop: 0, color: "#d4af37", fontWeight: 900 }}>Work assignment 📝</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link className="linkGold" to="/hr/assign-work">Assign work to employee 🧾</Link>
            <Link className="linkGold" to="/hr/my-assignments">View assigned work 📋</Link>
            <Link className="linkGold" to="/hr/my-employees">View my employees 👥</Link>
          </div>
          </div>
        </div>
      </div>
      </div>
    </div>

  </>
  );
}
export default HrDashBoard;
