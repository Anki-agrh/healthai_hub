import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import io from "socket.io-client";

import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AiChat from "./pages/AiChat"; 
import Diet from "./pages/Diet";
import Doctors from "./pages/Doctors";
import Queue from "./pages/Queue";
import Emergency from "./pages/Emergency";
import Meds from "./pages/Meds";
import PatientAppointments from "./pages/PatientAppointments";
import DoctorAppointments from "./pages/DoctorAppointments";
import NearbyDoctors from "./pages/NearbyDoctors";
import DoctorPanel from "./pages/DoctorPanel";
import AdminDash from "./pages/AdminDash";
import MyProfile from "./pages/MyProfile";

// ✅ Connect to your backend socket server
const socket = io.connect("http://localhost:5000");

function App() {
  useEffect(() => {
    // ✅ GLOBAL LISTENER: Listen for Emergency SOS alerts from the server
    socket.on("receive_emergency_alert", (data) => {
      const userStr = localStorage.getItem("user");
      
      if (userStr) {
        const loggedInUser = JSON.parse(userStr);
        
        // ✅ Verification: Only trigger the alert for users with the "doctor" role
        if (loggedInUser.role === "doctor") {
          // You can replace this standard alert with a custom Modal or Toast for a better UI
          alert(
            `🚨 CRITICAL EMERGENCY ALERT 🚨\n\n` +
            `Patient: ${data.patientName}\n` +
            `Location: ${data.location || "Not Provided"}\n` +
            `Message: ${data.message}\n` +
            `Time: ${data.time}`
          );
        }
      }
    });

    function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* ... existing routes ... */}
        
        {/* ✅ NEW: Add the Profile Route */}
        <Route path="/my-profile" element={<MyProfile />} />

      </Routes>
    </BrowserRouter>
  );
}

    // Clean up the socket listener on unmount to prevent memory leaks
    return () => socket.off("receive_emergency_alert");
  }, []);

  return (
    <BrowserRouter>
      {/* Navbar stays at the top across all pages */}
      <Navbar />

      <Routes>
        {/* --- PUBLIC & GENERAL ROUTES --- */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* --- AI & HEALTH TOOLS --- */}
        <Route path="/ai" element={<AiChat />} /> 
        <Route path="/diet" element={<Diet />} />
        <Route path="/meds" element={<Meds />} />
        
        {/* --- DOCTOR & CONSULTATION --- */}
        <Route path="/nearby-doctors" element={<NearbyDoctors />} />
        <Route path="/consult" element={<Doctors />} />
        <Route path="/queue" element={<Queue />} />
        <Route path="/emergency" element={<Emergency />} />
        
        {/* --- APPOINTMENT MANAGEMENT --- */}
        <Route path="/patient-appointments" element={<PatientAppointments />} />
        <Route path="/doctor-appointments" element={<DoctorAppointments />} />  
        
        {/* --- PROFESSIONAL PANELS --- */}
        <Route path="/doctor-panel" element={<DoctorPanel />} />
        
        {/* --- ADMIN & VERIFICATION --- */}
        <Route path="/admin" element={<AdminDash />} />

        {/* --- DOC PROFILE --- */}
        <Route path="/my-profile" element={<MyProfile />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;