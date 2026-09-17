import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";

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
    <div className="min-h-[90vh] py-8 px-[5%] md:px-[4%] md:py-5 font-sans bg-primary-light dark:bg-primary-dark transition-colors duration-300 animate-fadeSlideIn">
      {role === "patient" && <PatientDashboard user={user} navigate={navigate} />}
      {role === "doctor" && <DoctorDashboard user={user} navigate={navigate} />}
      {role === "admin" && <AdminDashboard user={user} navigate={navigate} showToast={showToast} />}
      {!role && <p className="text-center text-slate-500 mt-10">No role found. Please log in.</p>}
    </div>
  );
}

/* ================= PATIENT DASHBOARD ================= */
function PatientDashboard({ user, navigate }) {
  const firstName = user.name ? user.name.split(" ")[0] : "User";

  const actions = [
    { icon: "🤖", title: "AI Health Assistant", desc: "Get instant symptom analysis with our AI-powered chatbot", path: "/ai", gradient: "from-blue-500 to-indigo-500", iconBg: "bg-blue-500/15" },
    { icon: "🥗", title: "AI Diet Planner", desc: "Get personalized nutrition plans tailored to your goals", path: "/diet", gradient: "from-emerald-500 to-emerald-600", iconBg: "bg-emerald-500/15" },
    { icon: "👨‍⚕️", title: "Consult Doctors", desc: "Book video/voice consultations with specialists", path: "/consult", gradient: "from-purple-500 to-purple-600", iconBg: "bg-purple-500/15" },
    { icon: "📍", title: "Nearby Healthcare", desc: "Find doctors and hospitals within 10km of you", path: "/nearby-doctors", gradient: "from-teal-500 to-teal-600", iconBg: "bg-teal-500/15" },
    { icon: "🎟️", title: "Live Queue / Records", desc: "Check your queue status and past medical records", path: "/queue", gradient: "from-amber-500 to-amber-600", iconBg: "bg-amber-500/15" },
    { icon: "💊", title: "Health Dashboard", desc: "Track water, meds, meditation & build healthy streaks", path: "/meds", gradient: "from-pink-500 to-pink-600", iconBg: "bg-pink-500/15" },
    { icon: "📋", title: "My Appointments", desc: "View and manage all your upcoming appointments", path: "/patient-appointments", gradient: "from-orange-500 to-orange-600", iconBg: "bg-orange-500/15" },
    { icon: "🚨", title: "Emergency SOS", desc: "One-tap alert to notify all nearby doctors instantly", path: "/emergency", gradient: "from-red-500 to-red-600", iconBg: "bg-red-500/15" },
  ];

  return (
    <>
      <div className="mb-9">
        <h1 className="text-[2.2rem] md:text-[1.6rem] font-extrabold text-slate-800 dark:text-slate-100 m-0 mb-2">
          Welcome back, <span className="bg-gradient-to-br from-accent to-indigo-500 bg-clip-text text-transparent">
            {firstName}
          </span> 👋
        </h1>
        <p className="text-[1.05rem] text-slate-500 dark:text-slate-400 m-0">Here's your health command center. What would you like to do today?</p>
      </div>

      <div className="flex gap-5 mb-8 flex-wrap md:flex-col">
        <div className="flex-1 min-w-[200px] bg-white dark:bg-slate-800 rounded-2xl p-5 md:p-6 flex items-center gap-4 border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(10,77,184,0.12)]">
          <div className="w-[52px] h-[52px] rounded-xl flex items-center justify-center text-2xl shrink-0 bg-blue-500/12">🩺</div>
          <div>
            <h3 className="m-0 text-2xl font-bold text-slate-800 dark:text-slate-100">AI Powered</h3>
            <p className="m-0 mt-0.5 text-sm text-slate-400">Symptom Analysis</p>
          </div>
        </div>
        <div className="flex-1 min-w-[200px] bg-white dark:bg-slate-800 rounded-2xl p-5 md:p-6 flex items-center gap-4 border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(10,77,184,0.12)]">
          <div className="w-[52px] h-[52px] rounded-xl flex items-center justify-center text-2xl shrink-0 bg-emerald-500/12">🔒</div>
          <div>
            <h3 className="m-0 text-2xl font-bold text-slate-800 dark:text-slate-100">Verified</h3>
            <p className="m-0 mt-0.5 text-sm text-slate-400">Certified Doctors</p>
          </div>
        </div>
        <div className="flex-1 min-w-[200px] bg-white dark:bg-slate-800 rounded-2xl p-5 md:p-6 flex items-center gap-4 border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(10,77,184,0.12)]">
          <div className="w-[52px] h-[52px] rounded-xl flex items-center justify-center text-2xl shrink-0 bg-purple-500/12">⚡</div>
          <div>
            <h3 className="m-0 text-2xl font-bold text-slate-800 dark:text-slate-100">Instant</h3>
            <p className="m-0 mt-0.5 text-sm text-slate-400">Consultations</p>
          </div>
        </div>
        <div className="flex-1 min-w-[200px] bg-white dark:bg-slate-800 rounded-2xl p-5 md:p-6 flex items-center gap-4 border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(10,77,184,0.12)]">
          <div className="w-[52px] h-[52px] rounded-xl flex items-center justify-center text-2xl shrink-0 bg-red-500/12">🚑</div>
          <div>
            <h3 className="m-0 text-2xl font-bold text-slate-800 dark:text-slate-100">24/7</h3>
            <p className="m-0 mt-0.5 text-sm text-slate-400">Emergency Ready</p>
          </div>
        </div>
      </div>

      <h2 className="text-[1.3rem] font-bold text-slate-800 dark:text-slate-100 mb-5">Quick Actions</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] md:grid-cols-1 gap-5">
        {actions.map((action, i) => (
          <div 
            key={i} 
            className="group bg-white dark:bg-slate-800 rounded-2xl p-7 pt-7 pb-7 border border-slate-200 dark:border-slate-700 cursor-pointer transition-all duration-300 relative overflow-hidden shadow-sm hover:-translate-y-1.5 hover:shadow-[0_12px_30px_rgba(10,77,184,0.15)] hover:border-accent"
            onClick={() => navigate(action.path)}
          >
            <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl opacity-0 transition-opacity duration-300 bg-gradient-to-r ${action.gradient} group-hover:opacity-100`}></div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-[1.6rem] mb-[18px] ${action.iconBg}`}>
              {action.icon}
            </div>
            <h3 className="text-[1.15rem] font-bold text-slate-800 dark:text-slate-100 m-0 mb-2">{action.title}</h3>
            <p className="text-[0.9rem] text-slate-500 dark:text-slate-400 m-0 leading-relaxed">{action.desc}</p>
            <span className="absolute bottom-5 right-5 text-[1.2rem] text-slate-400 transition-all duration-300 group-hover:text-accent group-hover:translate-x-1">→</span>
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
    { icon: "📋", title: "My Appointments", desc: "View and manage patient appointments", path: "/doctor-appointments", gradient: "from-orange-500 to-orange-600", iconBg: "bg-orange-500/15" },
    { icon: "⚙️", title: "Doctor Panel", desc: "Manage your availability, tokens & schedule", path: "/doctor-panel", gradient: "from-purple-500 to-purple-600", iconBg: "bg-purple-500/15" },
    { icon: "👤", title: "My Profile", desc: "Update your professional details and photo", path: "/my-profile", gradient: "from-blue-500 to-indigo-500", iconBg: "bg-blue-500/15" },
  ];

  return (
    <>
      <div className="mb-9">
        <h1 className="text-[2.2rem] md:text-[1.6rem] font-extrabold text-slate-800 dark:text-slate-100 m-0 mb-2">
          Hello, Dr. <span className="bg-gradient-to-br from-accent to-indigo-500 bg-clip-text text-transparent">
            {firstName}
          </span> 👋
        </h1>
        <p className="text-[1.05rem] text-slate-500 dark:text-slate-400 m-0">Manage your practice and connect with patients.</p>
      </div>

      <div className={`inline-block py-1.5 px-4 rounded-full text-[0.85rem] font-semibold mb-5 ${isApproved ? "bg-emerald-500/12 text-emerald-600" : "bg-amber-500/12 text-amber-600"}`}>
        {isApproved ? "✅ Account Verified" : "⏳ Pending Admin Approval"}
      </div>

      <h2 className="text-[1.3rem] font-bold text-slate-800 dark:text-slate-100 mb-5">Quick Actions</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] md:grid-cols-1 gap-5">
        {actions.map((action, i) => (
          <div 
            key={i} 
            className="group bg-white dark:bg-slate-800 rounded-2xl p-7 border border-slate-200 dark:border-slate-700 cursor-pointer transition-all duration-300 relative overflow-hidden shadow-sm hover:-translate-y-1.5 hover:shadow-[0_12px_30px_rgba(10,77,184,0.15)] hover:border-accent"
            onClick={() => navigate(action.path)}
          >
            <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl opacity-0 transition-opacity duration-300 bg-gradient-to-r ${action.gradient} group-hover:opacity-100`}></div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-[1.6rem] mb-[18px] ${action.iconBg}`}>
              {action.icon}
            </div>
            <h3 className="text-[1.15rem] font-bold text-slate-800 dark:text-slate-100 m-0 mb-2">{action.title}</h3>
            <p className="text-[0.9rem] text-slate-500 dark:text-slate-400 m-0 leading-relaxed">{action.desc}</p>
            <span className="absolute bottom-5 right-5 text-[1.2rem] text-slate-400 transition-all duration-300 group-hover:text-accent group-hover:translate-x-1">→</span>
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
      .then((data) => setDoctors(data.doctors || []))
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
        setDoctors(doctors.filter((doc) => doc._id !== doctorId));
      })
      .catch((err) => {
        showToast("Failed to approve doctor", "error");
        console.error(err);
      });
  };

  return (
    <>
      <div className="mb-9">
        <h1 className="text-[2.2rem] md:text-[1.6rem] font-extrabold text-slate-800 dark:text-slate-100 m-0 mb-2">
          Admin <span className="bg-gradient-to-br from-accent to-indigo-500 bg-clip-text text-transparent">Dashboard</span> 🛡️
        </h1>
        <p className="text-[1.05rem] text-slate-500 dark:text-slate-400 m-0">Manage platform operations, doctor approvals, and more.</p>
      </div>

      <div className="flex gap-5 mb-8 flex-wrap md:flex-col">
        <div className="flex-1 min-w-[200px] bg-white dark:bg-slate-800 rounded-2xl p-5 md:p-6 flex items-center gap-4 border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(10,77,184,0.12)]">
          <div className="w-[52px] h-[52px] rounded-xl flex items-center justify-center text-2xl shrink-0 bg-blue-500/12">👨‍⚕️</div>
          <div>
            <h3 className="m-0 text-2xl font-bold text-slate-800 dark:text-slate-100">{doctors.length}</h3>
            <p className="m-0 mt-0.5 text-sm text-slate-400">Pending Approvals</p>
          </div>
        </div>
      </div>

      <h2 className="text-[1.3rem] font-bold text-slate-800 dark:text-slate-100 mb-5">Pending Doctor Approvals</h2>

      {doctors.length === 0 && (
        <p className="text-slate-500 text-center py-10">
          ✅ No pending doctors. All caught up!
        </p>
      )}

      {doctors.map((doc) => (
        <div key={doc._id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 md:p-6 border border-slate-200 dark:border-slate-700 mb-4 flex items-center justify-between gap-5 transition-all duration-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
          <div>
            <h4 className="m-0 mb-1 text-[1.05rem] text-slate-800 dark:text-slate-100 font-bold">{doc.name}</h4>
            <p className="m-0 text-[0.85rem] text-slate-500">
              {doc.email} · Status: <span className="text-amber-500">{doc.status}</span>
            </p>
          </div>
          <button 
            className="py-2.5 px-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none rounded-xl font-semibold cursor-pointer transition-all duration-300 whitespace-nowrap hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
            onClick={() => approveDoctor(doc._id)}
          >
            ✅ Approve
          </button>
        </div>
      ))}

      <h2 className="text-[1.3rem] font-bold text-slate-800 dark:text-slate-100 mb-5 mt-8">Admin Actions</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] md:grid-cols-1 gap-5">
        <div 
          className="group bg-white dark:bg-slate-800 rounded-2xl p-7 border border-slate-200 dark:border-slate-700 cursor-pointer transition-all duration-300 relative overflow-hidden shadow-sm hover:-translate-y-1.5 hover:shadow-[0_12px_30px_rgba(10,77,184,0.15)] hover:border-accent" 
          onClick={() => navigate("/admin")}
        >
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl opacity-0 transition-opacity duration-300 bg-gradient-to-r from-blue-500 to-indigo-500 group-hover:opacity-100"></div>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-[1.6rem] mb-[18px] bg-blue-500/15">
            🛡️
          </div>
          <h3 className="text-[1.15rem] font-bold text-slate-800 dark:text-slate-100 m-0 mb-2">Full Admin Panel</h3>
          <p className="text-[0.9rem] text-slate-500 dark:text-slate-400 m-0 leading-relaxed">Access the complete admin management dashboard</p>
          <span className="absolute bottom-5 right-5 text-[1.2rem] text-slate-400 transition-all duration-300 group-hover:text-accent group-hover:translate-x-1">→</span>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
