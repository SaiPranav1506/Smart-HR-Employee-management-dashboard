import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { authStorage } from "./storage";

const RequireRole = ({ allowedRoles, children }) => {
  const token = authStorage.getToken();
  if (!token) return <Navigate to="/login" replace />;

  try {
    const decoded = jwtDecode(token);
    const role = String(decoded.role || "").toLowerCase();

    if (!allowedRoles.includes(role)) {
      // Redirect to correct home for that token
      if (role === "hr") return <Navigate to="/hr-dashboard" replace />;
      if (role === "employee") return <Navigate to="/employee-dashboard" replace />;
      if (role === "driver") return <Navigate to="/driver-dashboard" replace />;
      return <Navigate to="/login" replace />;
    }

    return children;
  } catch (e) {
    authStorage.clear();
    return <Navigate to="/login" replace />;
  }
};

export default RequireRole;
