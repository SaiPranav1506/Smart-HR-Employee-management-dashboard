import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Login from "./components/Login";
import Register from "./components/Register";
import RequireRole from "./auth/RequireRole";
import MarketingLanding from "./components/MarketingLanding";

// Lazy-load heavier pages to keep Login/Register responsive on first load.
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
const DriverDashboard = lazy(() => import("./components/driver/DriverDashboard"));
const BookCab = lazy(() => import("./components/hr/BookCab"));
const AddDriver = lazy(() => import("./components/admin/AddDriver"));
const ViewDrivers = lazy(() => import("./components/admin/ViewDrivers"));
const MyBookings = lazy(() => import("./components/hr/MyBookings"));
const HrDashBoard = lazy(() => import("./components/HrDashBoard"));
const EmployeeDashboard = lazy(() => import("./components/employee/EmployeeDashboard"));
const AssignWork = lazy(() => import("./components/hr/AssignWork"));
const MyAssignments = lazy(() => import("./components/hr/MyAssignments"));
const MyEmployees = lazy(() => import("./components/hr/MyEmployees"));
const ChatPage = lazy(() => import("./components/chat/ChatPage"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="page">Loading…</div>}>
        <Routes>
          {/* Marketing landing */}
          <Route path="/marketing" element={<MarketingLanding />} />

          {/* Login & Register */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reg" element={<Register />} />
          <Route path="/register" element={<Register />} />

          {/* Admin Routes */}
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin/add-driver" element={<AddDriver />} />
          <Route path="/admin/view-drivers" element={<ViewDrivers />} />

          {/* HR Routes */}
          <Route path="/hr-dashboard" element={<RequireRole allowedRoles={["hr"]}><HrDashBoard /></RequireRole>} />
          <Route path="/hr/book-cab" element={<RequireRole allowedRoles={["hr"]}><BookCab /></RequireRole>} />
          <Route path="/hr/my-bookings" element={<RequireRole allowedRoles={["hr"]}><MyBookings /></RequireRole>} />
          <Route path="/hr/assign-work" element={<RequireRole allowedRoles={["hr"]}><AssignWork /></RequireRole>} />
          <Route path="/hr/my-assignments" element={<RequireRole allowedRoles={["hr"]}><MyAssignments /></RequireRole>} />
          <Route path="/hr/my-employees" element={<RequireRole allowedRoles={["hr"]}><MyEmployees /></RequireRole>} />

          {/* Employee Routes */}
          <Route path="/employee-dashboard" element={<RequireRole allowedRoles={["employee"]}><EmployeeDashboard /></RequireRole>} />

          {/* Driver Routes */}
          <Route path="/driver-dashboard" element={<RequireRole allowedRoles={["driver"]}><DriverDashboard /></RequireRole>} />
          {/* <Route path="/driver/complete-trip" element={<TripCompletion />} /> */}

          {/* Chat (available for all roles) */}
          <Route path="/chat" element={<RequireRole allowedRoles={["hr", "employee", "driver", "admin"]}><ChatPage /></RequireRole>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

