import React, { useEffect, useState } from "react";
import axios from "axios";
import TopNav from "../common/TopNav";
import { authStorage } from "../../auth/storage";

const MyAssignments = () => {
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    const token = authStorage.getToken();
    const email = authStorage.getEmail();

    try {
      const res = await axios.get(
        `http://localhost:8080/api/hr/my-assignments?email=${email}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssignments(res.data);
    } catch (e) {
      console.error("Failed to fetch assignments", e);
    }
  };

  return (
    <>
      <TopNav
        title="HR • Assigned work 📋"
        links={[
          { to: "/hr-dashboard", label: "Dashboard 🏠" },
          { to: "/hr/book-cab", label: "Book cab 🚕" },
          { to: "/hr/my-bookings", label: "Bookings 📅" },
          { to: "/hr/assign-work", label: "Assign work 📝" },
          { to: "/hr/my-employees", label: "Employees 👥" },
        ]}
      />
      <div className="page">
        <div className="container">
        <h2 className="hTitle">My assigned work (HR) 📋</h2>

      {assignments.length === 0 ? (
        <p>No assignments yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Employee Email</th>
              <th>Title</th>
              <th>Description</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id}>
                <td>{a.employeeEmail}</td>
                <td>{a.title}</td>
                <td>{a.description}</td>
                <td>{a.status}</td>
                <td>{a.assignedDate}</td>
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

export default MyAssignments;
