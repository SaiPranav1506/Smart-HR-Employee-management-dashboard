import { Link } from "react-router-dom";
import TopNav from "./common/TopNav";
import React from "react";
import { authStorage } from "../auth/storage";
import LiveMouseBackground from "./common/LiveMouseBackground";
import { displayNameFromEmail } from "./common/displayName";
function HrDashBoard() {
  const name = displayNameFromEmail(authStorage.getEmail());
  return (
  <>
    <TopNav
      title="HR Dashboard 🧑‍💼"
    />
    <div className="page">
      <LiveMouseBackground />
      <div className="container" style={{ maxWidth: 900 }}>
        <section className="dashHero dashHeroHr" aria-label="HR dashboard introduction">
          <div className="dashHeroInner">
            <div className="dashHeroKicker">HR Workspace</div>
            <h1 className="dashHeroTitle">Hello {name}.</h1>
            <p className="dashHeroText">
              Hope your day is going well. This home page helps you run daily operations without friction: book cabs for
              employees, track booking status and driver assignment, and keep work moving with clear task assignments.
              Use the tools below to review what’s pending, follow up only when needed, and keep records consistent.
              For quick coordination (questions from employees, directions for drivers, or status confirmations), use
              Chat from the top bar — it keeps conversations tied to real actions.
            </p>
            <div className="dashHeroActions">
              <a className="btnPrimary" href="#dash-options">View options</a>
            </div>
          </div>
        </section>

      <section id="dash-options" className="dashOptions" aria-label="HR dashboard options">
      <h2 className="hTitle">Available options</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14, marginTop: 12 }}>
        <div className="card">
          <div className="cardInner">
          <h3 style={{ marginTop: 0, color: "var(--gold)", fontWeight: 900 }}>Cab booking 🚕</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link className="linkGold" to="/hr/book-cab">Book a cab/van 🚖</Link>
            <Link className="linkGold" to="/hr/my-bookings">View my bookings 📅</Link>
          </div>
          </div>
        </div>

        <div className="card">
          <div className="cardInner">
          <h3 style={{ marginTop: 0, color: "var(--gold)", fontWeight: 900 }}>Work assignment 📝</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link className="linkGold" to="/hr/assign-work">Assign work to employee 🧾</Link>
            <Link className="linkGold" to="/hr/my-assignments">View assigned work 📋</Link>
            <Link className="linkGold" to="/hr/my-employees">View my employees 👥</Link>
          </div>
          </div>
        </div>
      </div>
      </section>
      </div>
    </div>

  </>
  );
}
export default HrDashBoard;
