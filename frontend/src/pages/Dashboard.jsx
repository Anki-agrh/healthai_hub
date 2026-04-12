import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import "./Dashboard.css";

const API = process.env.REACT_APP_API || "https://healthai-hub.onrender.com";

function Dashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const { showToast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  })();

  return (
    <div className="dashboard-page page-transition">
      {role === "patient" && <PatientDashboard user={user} navigate={navigate} />}
      {role === "doctor" && <DoctorDashboard user={user} navigate={navigate} />}
      {role === "admin" && <AdminDashboard user={user} navigate={navigate} showToast={showToast} />}
      {!role && <p style={{ textAlign: "center", color: "#64748b", marginTop: "40px" }}>No role found. Please log in.</p>}
    </div>
  );
}

/* ================= PATIENT DASHBOARD ================= */
function PatientDashboard({ user, navigate }) {
  const firstName = user.name ? user.name.split(" ")[0] : "User";

  const actions = [
    { icon: "🤖", title: "AI Health Assistant", desc: "Get instant symptom analysis with our AI-powered chatbot", path: "/ai", cls: "ai-card", iconCls: "ai" },
    { icon: "🥗", title: "AI Diet Planner", desc: "Get personalized nutrition plans tailored to your goals", path: "/diet", cls: "diet-card", iconCls: "diet" },
    { icon: "👨‍⚕️", title: "Consult Doctors", desc: "Book video/voice consultations with specialists", path: "/consult", cls: "consult-card", iconCls: "consult" },
    { icon: "📍", title: "Nearby Healthcare", desc: "Find doctors and hospitals within 10km of you", path: "/nearby-doctors", cls: "nearby-card", iconCls: "nearby" },
    { icon: "🎟️", title: "Live Queue / Records", desc: "Check your queue status and past medical records", path: "/queue", cls: "queue-card", iconCls: "queue" },
    { icon: "💊", title: "Health Dashboard", desc: "Track water, meds, meditation & build healthy streaks", path: "/meds", cls: "meds-card", iconCls: "meds" },
    { icon: "📋", title: "My Appointments", desc: "View and manage all your upcoming appointments", path: "/patient-appointments", cls: "appointments-card", iconCls: "appointments" },
    { icon: "🚨", title: "Emergency SOS", desc: "One-tap alert to notify all nearby doctors instantly", path: "/emergency", cls: "emergency-card", iconCls: "emergency" },
  ];

  return (
    <>
      <div className="dash-welcome">
        <h1>Welcome back, <span>{firstName}</span> 👋</h1>
        <p>Here's your health command center. What would you like to do today?</p>
      </div>

      <div className="dash-stats-row">
        <div className="dash-stat-card">
          <div className="stat-icon-box blue">🩺</div>
          <div className="stat-info">
            <h3>AI Powered</h3>
            <p>Symptom Analysis</p>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="stat-icon-box green">🔒</div>
          <div className="stat-info">
            <h3>Verified</h3>
            <p>Certified Doctors</p>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="stat-icon-box purple">⚡</div>
          <div className="stat-info">
            <h3>Instant</h3>
            <p>Consultations</p>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="stat-icon-box red">🚑</div>
          <div className="stat-info">
            <h3>24/7</h3>
            <p>Emergency Ready</p>
          </div>
        </div>
      </div>

      <h2 className="dash-actions-title">Quick Actions</h2>
      <div className="dash-actions-grid">
        {actions.map((action, i) => (
          <div 
            key={i} 
            className={`dash-action-card ${action.cls}`}
            onClick={() => navigate(action.path)}
          >
            <div className={`card-icon ${action.iconCls}`}>{action.icon}</div>
            <h3>{action.title}</h3>
            <p>{action.desc}</p>
            <span className="card-arrow">→</span>
          </div>
        ))}
      </div>
    </>
  );
}

/* ================= DOCTOR DASHBOARD ================= */
function DoctorDashboard({ user, navigate }) {
  const firstName = user.name ? user.name.split(" ")[0] : "Doctor";
  const isApproved = user.status === "approved";

  const actions = [
    { icon: "📋", title: "My Appointments", desc: "View and manage patient appointments", path: "/doctor-appointments", cls: "appointments-card", iconCls: "appointments" },
    { icon: "⚙️", title: "Doctor Panel", desc: "Manage your availability, tokens & schedule", path: "/doctor-panel", cls: "consult-card", iconCls: "consult" },
    { icon: "👤", title: "My Profile", desc: "Update your professional details and photo", path: "/my-profile", cls: "ai-card", iconCls: "ai" },
  ];

  return (
    <>
      <div className="dash-welcome">
        <h1>Hello, Dr. <span>{firstName}</span> 👋</h1>
        <p>Manage your practice and connect with patients.</p>
      </div>

      <div className={`dash-pending-badge ${isApproved ? "approved" : ""}`}>
        {isApproved ? "✅ Account Verified" : "⏳ Pending Admin Approval"}
      </div>

      <h2 className="dash-actions-title">Quick Actions</h2>
      <div className="dash-actions-grid">
        {actions.map((action, i) => (
          <div 
            key={i} 
            className={`dash-action-card ${action.cls}`}
            onClick={() => navigate(action.path)}
          >
            <div className={`card-icon ${action.iconCls}`}>{action.icon}</div>
            <h3>{action.title}</h3>
            <p>{action.desc}</p>
            <span className="card-arrow">→</span>
          </div>
        ))}
      </div>
    </>
  );
}

/* ================= ADMIN DASHBOARD ================= */
function AdminDashboard({ user, navigate, showToast }) {
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctorId }),
    })
      .then((res) => res.json())
      .then((data) => {
        showToast(data.message || "Doctor approved!", "success");
        setDoctors(doctors.filter((doc) => doc.id !== doctorId));
      })
      .catch((err) => {
        showToast("Failed to approve doctor", "error");
        console.error(err);
      });
  };

  return (
    <>
      <div className="dash-welcome">
        <h1>Admin <span>Dashboard</span> 🛡️</h1>
        <p>Manage platform operations, doctor approvals, and more.</p>
      </div>

      <div className="dash-stats-row">
        <div className="dash-stat-card">
          <div className="stat-icon-box blue">👨‍⚕️</div>
          <div className="stat-info">
            <h3>{doctors.length}</h3>
            <p>Pending Approvals</p>
          </div>
        </div>
      </div>

      <h2 className="dash-actions-title">Pending Doctor Approvals</h2>

      {doctors.length === 0 && (
        <p style={{ color: "#64748b", textAlign: "center", padding: "40px" }}>
          ✅ No pending doctors. All caught up!
        </p>
      )}

      {doctors.map((doc) => (
        <div key={doc.id} className="admin-approval-card">
          <div className="approval-info">
            <h4>{doc.name}</h4>
            <p>{doc.email} · Status: {doc.status}</p>
          </div>
          <button className="approve-btn" onClick={() => approveDoctor(doc.id)}>
            ✅ Approve
          </button>
        </div>
      ))}

      <h2 className="dash-actions-title" style={{ marginTop: "30px" }}>Admin Actions</h2>
      <div className="dash-actions-grid">
        <div className="dash-action-card ai-card" onClick={() => navigate("/admin")}>
          <div className="card-icon ai">🛡️</div>
          <h3>Full Admin Panel</h3>
          <p>Access the complete admin management dashboard</p>
          <span className="card-arrow">→</span>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
