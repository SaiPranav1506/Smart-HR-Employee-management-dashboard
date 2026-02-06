import React, { useState } from "react";
import axios from "axios";
import { authStorage } from "../../auth/storage";

const AddDriver = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    cabType: "Cab",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = authStorage.getToken();

    try {
      const res = await axios.post("http://localhost:8080/api/admin/add-driver", form, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessage(res.data); // Success message from backend
      setForm({ name: "", email: "", cabType: "Cab" }); // Reset form
    } catch (error) {
      console.error("Driver add failed", error);
      setMessage("Failed to add driver");
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 680 }}>
        <div className="card">
          <div className="cardInner">
            <h2 className="hTitle">Add new driver</h2>
            <div className="subtle" style={{ marginTop: 6 }}>Create a driver record for cab assignment.</div>

            <div style={{ height: 14 }} />

            <form onSubmit={handleSubmit}>
              <input
                className="input"
                name="name"
                placeholder="Driver Name"
                value={form.name}
                onChange={handleChange}
                required
              />
              <div style={{ height: 12 }} />
              <input
                className="input"
                name="email"
                placeholder="Driver Email"
                value={form.email}
                onChange={handleChange}
                required
              />
              <div style={{ height: 12 }} />
              <select className="select" name="cabType" value={form.cabType} onChange={handleChange}>
                <option value="Cab">Cab</option>
                <option value="Van">Van</option>
              </select>
              <div style={{ height: 14 }} />
              <button type="submit" className="btnPrimary" style={{ width: "100%" }}>Add Driver</button>
            </form>

            {message && (
              <p style={{ marginTop: 14, fontWeight: 900, color: "var(--gold)" }}>{message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddDriver;
