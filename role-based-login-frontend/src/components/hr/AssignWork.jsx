import React, { useState } from "react";
import axios from "axios";
import TopNav from "../common/TopNav";
import { authStorage } from "../../auth/storage";

import { API_BASE_URL } from "../../api/client";

const AssignWork = () => {
  const [form, setForm] = useState({
    employeeEmail: "",
    title: "",
    description: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hrEmail = authStorage.getEmail();
    const token = authStorage.getToken();

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/hr/assign-work`,
        {
          hrEmail,
          employeeEmail: form.employeeEmail,
          title: form.title,
          description: form.description,
          status: "ASSIGNED",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(res.data);
      setForm({ employeeEmail: "", title: "", description: "" });
    } catch (e2) {
      console.error("Assign work failed", e2);
      setMessage("Failed to assign work");
    }
  };

  return (
    <>
      <TopNav
        title="HR • Assign work 📝"
        links={[
          { to: "/hr-dashboard", label: "Dashboard 🏠" },
          { to: "/hr/book-cab", label: "Book cab 🚕" },
          { to: "/hr/my-bookings", label: "Bookings 📅" },
          { to: "/hr/my-assignments", label: "Assignments 📋" },
          { to: "/hr/my-employees", label: "Employees 👥" },
        ]}
      />
      <div className="page">
        <div className="container" style={{ maxWidth: 680 }}>
          <div className="card">
            <div className="cardInner">
        <h2 className="hTitle">Assign work</h2>

      <form onSubmit={handleSubmit}>
        <label>Employee Email:</label><br />
        <input
          type="email"
          name="employeeEmail"
          value={form.employeeEmail}
          onChange={handleChange}
          required
          className="input"
        />
        <br /><br />

        <label>Title:</label><br />
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          className="input"
        />
        <br /><br />

        <label>Description:</label><br />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={4}
          required
          className="textarea"
        />
        <br /><br />

        <button type="submit" className="btnPrimary" style={{ width: "100%" }}>
          Assign
        </button>
      </form>

      {message && (
        <p style={{ marginTop: 14, fontWeight: 900, color: "var(--gold)" }}>{message}</p>
      )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AssignWork;
