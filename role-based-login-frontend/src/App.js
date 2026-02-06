import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Login from "./components/Login";
import Register from "./components/Register";
import AdminDashboard from "./components/AdminDashboard";
import DriverDashboard from "./components/driver/DriverDashboard";
import BookCab from "./components/hr/BookCab";
import AddDriver from "./components/admin/AddDriver";
import ViewDrivers from "./components/admin/ViewDrivers";
import MyBookings from "./components/hr/MyBookings";
import HrDashBoard from "./components/HrDashBoard";
import EmployeeDashboard from "./components/employee/EmployeeDashboard";
import AssignWork from "./components/hr/AssignWork";
import MyAssignments from "./components/hr/MyAssignments";
import MyEmployees from "./components/hr/MyEmployees";
import RequireRole from "./auth/RequireRole";
import ChatPage from "./components/chat/ChatPage";
import MarketingLanding from "./components/MarketingLanding";

 // optional

function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;

