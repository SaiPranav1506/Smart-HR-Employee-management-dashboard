import React, { useEffect, useState } from "react";
import axios from "axios";
import { authStorage } from "../../auth/storage";

import { API_BASE_URL } from "../../api/client";

const ViewDrivers = () => {
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    const token = authStorage.getToken();

    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/view-drivers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDrivers(response.data);
    } catch (error) {
      console.error("Failed to fetch drivers", error);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <h2 className="hTitle">All registered drivers</h2>
        <div className="subtle" style={{ marginTop: 6 }}>Admin view of driver roster and availability.</div>

        <div style={{ height: 14 }} />

        <div className="card">
          <div className="cardInner">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Cab Type</th>
                  <th>Available?</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => (
                  <tr key={d.id}>
                    <td>{d.id}</td>
                    <td>{d.name}</td>
                    <td>{d.email}</td>
                    <td>{d.cabType}</td>
                    <td>
                      {d.available ? (
                        <span className="badge badgeGold">Yes</span>
                      ) : (
                        <span className="badge badgeCrimson">No</span>
                      )}
                    </td>
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

export default ViewDrivers;
