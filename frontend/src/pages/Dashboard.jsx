import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
const API = process.env.REACT_APP_API;


function Dashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1>Dashboard</h1>

      {role === "patient" && <PatientDashboard />}
      {role === "doctor" && <DoctorDashboard />}
      {role === "admin" && <AdminDashboard />}

      {!role && <p>No role found</p>}
    </div>
  );
}

/* ================= PATIENT ================= */
function PatientDashboard() {
  return (
    <div>
      <h2>🧑 Patient Dashboard</h2>
      <ul>
        <li>🤖 AI Symptom Checker</li>
        <li>🥗 Diet Planner</li>
        <li>👨‍⚕️ Consult Doctor</li>
        <li>🎫 Queue Status</li>
        <li>💊 Medicine Reminders</li>
      </ul>
    </div>
  );
}

/* ================= DOCTOR ================= */
function DoctorDashboard() {
  return (
    <div>
      <h2>👨‍⚕️ Doctor Dashboard</h2>
      <p>Waiting for admin approval (if pending)</p>
      <ul>
        <li>📋 View Appointments</li>
        <li>💬 Patient Chats</li>
      </ul>
    </div>
  );
}

/* ================= ADMIN ================= */
function AdminDashboard() {
  console.log("ADMIN DASHBOARD LOADED");
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/admin/pending-doctors`)
      .then((res) => res.json())
      .then((data) => setDoctors(data))
      .catch((err) => console.error(err));
  }, []);

  const approveDoctor = (doctorId) => {
    fetch(`${API}/api/admin/approve-doctor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ doctorId }),
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message);
        setDoctors(doctors.filter((doc) => doc.id !== doctorId));
      })
      .catch((err) => console.error(err));
  };

  return (
    <div>
      <h2>👮 Admin Dashboard</h2>
      <h3>Pending Doctor Approvals</h3>

      {doctors.length === 0 && <p>No pending doctors</p>}

      {doctors.map((doc) => (
        <div key={doc.id} style={styles.card}>
          <p><strong>Name:</strong> {doc.name}</p>
          <p><strong>Email:</strong> {doc.email}</p>
          <p><strong>Status:</strong> {doc.status}</p>

          <button
            style={styles.button}
            onClick={() => approveDoctor(doc.id)}
          >
            Approve Doctor
          </button>
        </div>
      ))}
    </div>
  );
}

const styles = {
  card: {
    border: "1px solid #ccc",
    padding: "15px",
    borderRadius: "6px",
    marginBottom: "12px",
  },
  button: {
    padding: "8px 12px",
    backgroundColor: "#0a4db8",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
};

export default Dashboard;
