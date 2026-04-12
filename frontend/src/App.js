import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import io from "socket.io-client";

import { ToastProvider, useToast } from "./context/ToastContext";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

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
import NotFound from "./pages/NotFound";

// ✅ Connect to your backend socket server
const API_BASE = process.env.REACT_APP_API || "http://localhost:5000";
const socket = io.connect(API_BASE);

function AppContent() {
  const { showToast } = useToast();

  useEffect(() => {
    // ✅ GLOBAL LISTENER: Listen for Emergency SOS alerts from the server
    socket.on("receive_emergency_alert", (data) => {
      const userStr = localStorage.getItem("user");
      
      if (userStr) {
        const loggedInUser = JSON.parse(userStr);
        
        // ✅ Verification: Only trigger the alert for users with the "doctor" role
        if (loggedInUser.role === "doctor") {
          showToast(
            `🚨 EMERGENCY: ${data.patientName} needs help! Location: ${data.location || "Unknown"}`,
            "emergency"
          );
        }
      }
    });

    // Clean up the socket listener on unmount to prevent memory leaks
    return () => socket.off("receive_emergency_alert");
  }, [showToast]);

  return (
    <>
      <Navbar />
      <ScrollToTop />
      <Routes>
        {/* --- PUBLIC & GENERAL ROUTES --- */}
        <Route path="/" element={<div className="page-transition"><Landing /></div>} />
        <Route path="/login" element={<div className="page-transition"><Login /></div>} />
        <Route path="/register" element={<div className="page-transition"><Register /></div>} />
        
        {/* --- PROTECTED: Any logged-in user --- */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={["patient", "doctor", "admin"]}>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {/* --- AI & HEALTH TOOLS --- */}
        <Route path="/ai" element={<div className="page-transition"><AiChat /></div>} />
        <Route path="/diet" element={<div className="page-transition"><Diet /></div>} />
        <Route path="/meds" element={<div className="page-transition"><Meds /></div>} />
        
        {/* --- DOCTOR & CONSULTATION --- */}
        <Route path="/nearby-doctors" element={<div className="page-transition"><NearbyDoctors /></div>} />
        <Route path="/consult" element={<div className="page-transition"><Doctors /></div>} />
        <Route path="/queue" element={<div className="page-transition"><Queue /></div>} />
        <Route path="/emergency" element={<div className="page-transition"><Emergency /></div>} />
        
        {/* --- APPOINTMENT MANAGEMENT (Protected) --- */}
        <Route path="/patient-appointments" element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <div className="page-transition"><PatientAppointments /></div>
          </ProtectedRoute>
        } />
        <Route path="/doctor-appointments" element={
          <ProtectedRoute allowedRoles={["doctor"]}>
            <div className="page-transition"><DoctorAppointments /></div>
          </ProtectedRoute>
        } />
        
        {/* --- PROFESSIONAL PANELS (Protected) --- */}
        <Route path="/doctor-panel" element={
          <ProtectedRoute allowedRoles={["doctor"]}>
            <div className="page-transition"><DoctorPanel /></div>
          </ProtectedRoute>
        } />
        
        {/* --- ADMIN & VERIFICATION (Protected) --- */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <div className="page-transition"><AdminDash /></div>
          </ProtectedRoute>
        } />

        {/* --- PROFILE (Protected) --- */}
        <Route path="/my-profile" element={
          <ProtectedRoute allowedRoles={["doctor"]}>
            <div className="page-transition"><MyProfile /></div>
          </ProtectedRoute>
        } />

        {/* --- 404 CATCH-ALL --- */}
        <Route path="*" element={<div className="page-transition"><NotFound /></div>} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;