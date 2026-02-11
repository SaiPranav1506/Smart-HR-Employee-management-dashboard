import React, { useMemo, useState } from "react";
import axios from "axios";
import TopNav from "../common/TopNav";
import { authStorage } from "../../auth/storage";
import { useLocation } from "react-router-dom";

import { API_BASE_URL } from "../../api/client";

const BookCab = () => {
  const location = useLocation();
  const prefill = useMemo(() => {
    const s = location && location.state ? location.state : {};
    return {
      employeeName: typeof s.employeeName === "string" ? s.employeeName : "",
      employeeEmail: typeof s.employeeEmail === "string" ? s.employeeEmail : "",
    };
  }, [location]);

  const makeInitialForm = () => ({
    employeeName: prefill.employeeName,
    employeeEmail: prefill.employeeEmail,
    pickup: "",
    dropLocation: "",
    pickupTime: "",
    cabType: "Cab",
  });

  const [form, setForm] = useState(() => makeInitialForm());

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleBook = async (e) => {
  e.preventDefault();

  const token = authStorage.getToken();
  const hrEmail = authStorage.getEmail();

  try {
    const response = await axios.post(`${API_BASE_URL}/api/hr/book`, {
      ...form,
      hrEmail: hrEmail, // ✅ Make sure this is passed
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    setMessage(response.data);
    setForm(makeInitialForm());
  } catch (error) {
    console.error("Booking failed", error);
    setMessage("Something went wrong. Try again.");
  }
};

  return (
    <>
      <TopNav
        title="HR • Book cab 🚖"
        links={[
          { to: "/hr-dashboard", label: "Dashboard 🏠" },
          { to: "/hr/my-bookings", label: "Bookings 📅" },
          { to: "/hr/assign-work", label: "Assign work 📝" },
          { to: "/hr/my-assignments", label: "Assignments 📋" },
          { to: "/hr/my-employees", label: "Employees 👥" },
        ]}
      />
      <div className="page">
        <div className="container" style={{ maxWidth: 680 }}>
          <div className="card">
            <div className="cardInner">
              <h2 className="hTitle">Book a cab for employee</h2>
              <div className="subtle" style={{ marginTop: 6 }}>Black & gold themed booking form.</div>
      <form onSubmit={handleBook}>
        <div style={{ marginTop: 14 }}>
        <input
          className="input"
          type="text"
          name="employeeName"
          placeholder="Employee Name"
          value={form.employeeName}
          onChange={handleChange}
          required
        />
        <div style={{ height: 12 }} />
        <input
          className="input"
          type="email"
          name="employeeEmail"
          placeholder="Employee Email"
          value={form.employeeEmail}
          onChange={handleChange}
          required
        />
        <div style={{ height: 12 }} />
        <input
          className="input"
          type="text"
          name="pickup"
          placeholder="Pickup Location"
          value={form.pickup}
          onChange={handleChange}
          required
        />
        <div style={{ height: 12 }} />
        <input
          className="input"
          type="text"
          name="dropLocation"
          placeholder="Drop Location"
          value={form.dropLocation}
          onChange={handleChange}
          required
        />
        <div style={{ height: 12 }} />
        <input
          className="input"
          type="time"
          name="pickupTime"
          value={form.pickupTime}
          onChange={handleChange}
          required
        />
        <div style={{ height: 12 }} />
        <select className="select" name="cabType" value={form.cabType} onChange={handleChange}>
          <option value="Cab">Cab</option>
          <option value="Van">Van</option>
        </select>
        <div style={{ height: 14 }} />
        <button type="submit" className="btnPrimary" style={{ width: "100%" }}>Book Now</button>
        </div>
      </form>

      {message && (
        <p style={{ marginTop: 14, color: "var(--gold)", fontWeight: 900 }}>
          {message}
        </p>
      )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BookCab;
