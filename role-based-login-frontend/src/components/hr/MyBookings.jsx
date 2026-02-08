import React, { useEffect, useState } from "react";
import axios from "axios";
import TopNav from "../common/TopNav";
import { authStorage } from "../../auth/storage";

import { API_BASE_URL } from "../../api/client";

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);

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
        <table className="table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Employee Email</th>
              <th>Pickup</th>
              <th>Drop</th>
              <th>Pickup Time</th>
              <th>Cab Type</th>
              <th>Driver</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td>{b.employeeName}</td>
                <td>{b.employeeEmail || "—"}</td>
                <td>{b.pickup}</td>
                <td>{b.dropLocation}</td>
                <td>{b.pickupTime}</td>
                <td>{b.cabType}</td>
                <td>{b.driverEmail || "Not Assigned"}</td>
                <td>{b.status}</td>
                <td>{b.bookingDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </div>
      </div>
    </>
  );
};

export default MyBookings;
