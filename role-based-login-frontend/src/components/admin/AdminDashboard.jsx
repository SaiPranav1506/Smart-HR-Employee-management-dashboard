import React, { useEffect, useState } from "react";
import axios from "axios";
import { authStorage } from "../../auth/storage";

import { API_BASE_URL } from "../../api/client";

const AdminDashboard = () => {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const token = authStorage.getToken();

    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/bookings`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setBookings(response.data);
    } catch (error) {
      console.error("Failed to fetch bookings", error);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <h2 className="hTitle">All cab bookings</h2>
        <div className="subtle" style={{ marginTop: 6 }}>Admin booking ledger across all roles.</div>

        <div style={{ height: 14 }} />

        <div className="card">
          <div className="cardInner">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee</th>
                  <th>Pickup</th>
                  <th>Drop</th>
                  <th>Time</th>
                  <th>Cab Type</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>HR Email</th>
                  <th>Driver Email</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.id}</td>
                    <td>{booking.employeeName}</td>
                    <td>{booking.pickup}</td>
                    <td>{booking.dropLocation}</td>
                    <td>{booking.pickupTime}</td>
                    <td>{booking.cabType}</td>
                    <td>{booking.bookingDate}</td>
                    <td>{booking.status}</td>
                    <td>{booking.hrEmail}</td>
                    <td>{booking.driverEmail || "Not Assigned"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
