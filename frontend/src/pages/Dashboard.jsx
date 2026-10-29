import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { 
  Activity, Heart, ArrowRight, Sparkles, CheckCircle2, ChevronRight, Stethoscope,
  Zap, Bot, Utensils, MapPin, Ticket, Calendar, AlertTriangle, ShieldCheck, BarChart2
} from "lucide-react";

function Dashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const { showToast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user")) || {}; }
    catch { return {}; }
  })();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1280px] mx-auto">
        {role === "patient" && <PatientDashboard user={user} navigate={navigate} />}
        {role === "doctor" && <DoctorDashboard user={user} navigate={navigate} />}
        {role === "admin" && <AdminDashboard user={user} navigate={navigate} showToast={showToast} />}
        {!role && (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-slate-500 dark:text-slate-400 font-semibold">No active session found.</p>
            <button 
              onClick={() => navigate("/login")}
              className="mt-3 px-6 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-accent/20"
            >
              Log In to HealthAI Hub
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= PATIENT DASHBOARD ================= */
function PatientDashboard({ user, navigate }) {
  const firstName = user.name ? user.name.split(" ")[0] : "Patient";
  const [time, setTime] = useState(new Date());
  const [healthScore] = useState(() => Number(localStorage.getItem("health_points")) ? Math.min(96, 75 + Math.floor(Number(localStorage.getItem("health_points")) / 15)) : 88);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const greeting = time.getHours() < 12 ? 'Good Morning' : time.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  const actions = [
    { icon: <Zap size={20} className="text-blue-500" />, title: "Vitals & Drug Safety", desc: "Live cardiac stream, drug interaction checker & biological age", path: "/meds", tag: "Live", bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
    { icon: <Bot size={20} className="text-indigo-500" />, title: "AI Health Assistant", desc: "3D interactive anatomy pinpointing + symptom analysis", path: "/ai", tag: "AI", bg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20" },
    { icon: <Utensils size={20} className="text-emerald-500" />, title: "Smart Diet Planner", desc: "Macro & TDEE calculator, food scanner & 7-day meal plan", path: "/diet", tag: "Nutrition", bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
    { icon: <Stethoscope size={20} className="text-purple-500" />, title: "Specialist Consultation", desc: "Verified doctors with instant video rooms & queue bypass", path: "/consult", tag: "Video", bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
    { icon: <MapPin size={20} className="text-teal-500" />, title: "Nearby Healthcare Locator", desc: "Interactive facility map, wait-time intelligence & zone heatmap", path: "/nearby-doctors", tag: "GPS", bg: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20" },
    { icon: <Ticket size={20} className="text-amber-500" />, title: "Queue & Medical Records", desc: "Real-time clinic token queue + direct medical report vault", path: "/queue", tag: "Vault", bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
    { icon: <Calendar size={20} className="text-orange-500" />, title: "My Appointments", desc: "View scheduled visits and direct video consultation rooms", path: "/patient-appointments", tag: "Visits", bg: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" },
    { icon: <AlertTriangle size={20} className="text-red-500" />, title: "Emergency SOS Panic", desc: "One-tap emergency broadcast alert to all nearby doctors", path: "/emergency", tag: "SOS", bg: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" },
  ];

  const stats = [
    { label: "Clinical Health Score", value: `${healthScore}/100`, sub: "Optimal range", icon: <Heart size={20} className="text-red-500" /> },
    { label: "Active Vitals Stream", value: "72 BPM", sub: "Sinus Rhythm", icon: <Activity size={20} className="text-blue-500" /> },
    { label: "Med Adherence Streak", value: "6 Days", sub: "Consistent", icon: <CheckCircle2 size={20} className="text-emerald-500" /> },
    { label: "Biological Age Bonus", value: "-1.8 Yrs", sub: "Epigenetic reserve", icon: <Sparkles size={20} className="text-purple-500" /> },
  ];

  return (
    <div className="space-y-6">
      
      {/* Hero Welcome Card - Clean Light Theme */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 dark:bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-accent/10 text-accent mb-3">
              {greeting}, {firstName}
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Patient Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              {time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {' · '}
              <span className="text-accent font-semibold">
                {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </p>
          </div>

          {/* Quick Score Meter */}
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/80 shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-2xl flex items-center justify-center">
              {healthScore}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Health Status</div>
              <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">Optimal Wellness</div>
              <div className="text-[11px] text-slate-400">Based on recent vitals & habits</div>
            </div>
          </div>
        </div>
      </div>

      {/* Vitals Summary Strip (Clickable directly to Tracker) */}
      <div 
        onClick={() => navigate('/meds')}
        className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 border border-blue-200/80 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-accent transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center shrink-0 shadow-md shadow-accent/20">
            <Activity size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-accent uppercase tracking-wider">Live Biometrics Hub</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                Connected
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium mt-0.5">
              Resting HR: <strong className="text-slate-900 dark:text-white">72 BPM</strong> · SpO2: <strong className="text-slate-900 dark:text-white">98%</strong> · BP: <strong className="text-slate-900 dark:text-white">118/76</strong> · Biological Age: <strong className="text-emerald-600 dark:text-emerald-400">22.8 Yrs</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-accent group-hover:translate-x-1 transition-transform self-end sm:self-auto">
          <span>Open Full Vitals & Shinchan Tracker</span>
          <ArrowRight size={14} />
        </div>
      </div>

      {/* Key Metric Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{s.label}</span>
              {s.icon}
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{s.value}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3">
          Health Hub Modules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action, i) => (
            <div
              key={i}
              onClick={() => navigate(action.path)}
              className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xl">
                    {action.icon}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${action.bg}`}>
                    {action.tag}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-accent transition-colors">
                  {action.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {action.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-400 group-hover:text-accent font-semibold transition-colors">
                <span>Launch Feature</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

/* ================= DOCTOR DASHBOARD ================= */
function DoctorDashboard({ user, navigate }) {
  const firstName = user.name ? user.name.split(" ")[0] : "Doctor";
  const isApproved = user.status === "approved";

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-accent/10 text-accent mb-2">
              <Stethoscope size={13} /> Specialist Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Dr. {firstName}'s Practice Suite
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Review live consultation queues, manage patient appointments, and handle SOS calls.
            </p>
          </div>

          <span className={`px-3 py-1.5 rounded-full text-xs font-bold self-start sm:self-auto ${
            isApproved 
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
          }`}>
            {isApproved ? "Verified Practitioner" : "Approval Pending"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => navigate("/doctor-appointments")}
          className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md cursor-pointer transition-all"
        >
          <Calendar size={28} className="text-accent mb-2" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Patient Appointments</h3>
          <p className="text-xs text-slate-500 mt-1">Review scheduled video visits and live clinic queues.</p>
        </div>

        <div 
          onClick={() => navigate("/doctor-panel")}
          className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md cursor-pointer transition-all"
        >
          <Stethoscope size={28} className="text-accent mb-2" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Doctor Practice Console</h3>
          <p className="text-xs text-slate-500 mt-1">Update hospital affiliation, specialty, and consulting hours.</p>
        </div>

        <div 
          onClick={() => navigate("/emergency")}
          className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md cursor-pointer transition-all"
        >
          <AlertTriangle size={28} className="text-red-500 mb-2" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Emergency SOS Responder</h3>
          <p className="text-xs text-slate-500 mt-1">Receive live panic alerts dispatched from patients in your zone.</p>
        </div>
      </div>
    </div>
  );
}

/* ================= ADMIN DASHBOARD ================= */
function AdminDashboard({ user, navigate }) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          System Administration Hub
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Verify physician medical licenses, monitor system safety logs, and oversee consultations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div 
          onClick={() => navigate("/admin")}
          className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md cursor-pointer transition-all"
        >
          <ShieldCheck size={28} className="text-accent mb-2" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Doctor Verification Console</h3>
          <p className="text-xs text-slate-500 mt-1">Approve, reject, or request documents from newly registered medical professionals.</p>
        </div>

        <div 
          onClick={() => navigate("/queue")}
          className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md cursor-pointer transition-all"
        >
          <BarChart2 size={28} className="text-accent mb-2" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Hospital Queue Metrics</h3>
          <p className="text-xs text-slate-500 mt-1">Inspect facility token throughput and tele-consultation room statuses.</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
