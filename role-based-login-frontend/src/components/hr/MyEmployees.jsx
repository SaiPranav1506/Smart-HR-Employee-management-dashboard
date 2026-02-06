import React, { useEffect, useState } from "react";
import axios from "axios";
import TopNav from "../common/TopNav";
import { authStorage } from "../../auth/storage";

const MyEmployees = () => {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEmployees = async () => {
    const token = authStorage.getToken();
    const email = authStorage.getEmail();

    try {
      const res = await axios.get(
        `http://localhost:8080/api/hr/my-employees?email=${email}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEmployees(res.data || []);
    } catch (e) {
      console.error("Failed to fetch employees", e);
    }
  };

  return (
    <>
      <TopNav
        title="HR • My employees 👥"
        links={[
          { to: "/hr-dashboard", label: "Dashboard 🏠" },
          { to: "/hr/book-cab", label: "Book cab 🚕" },
          { to: "/hr/my-bookings", label: "Bookings 📅" },
          { to: "/hr/assign-work", label: "Assign work 📝" },
          { to: "/hr/my-assignments", label: "Assignments 📋" },
          { to: "/hr/my-employees", label: "Employees 👥" },
        ]}
      />

      <div className="page">
        <div className="container">
          <h2 className="hTitle">Employees under me (HR) 👥</h2>

          {employees.length === 0 ? (
            <p>No employees found yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.email}>
                    <td>{e.username || "—"}</td>
                    <td>{e.email}</td>
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

export default MyEmployees;
