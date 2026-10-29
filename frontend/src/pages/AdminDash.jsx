import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_API || "https://healthai-hub.onrender.com";

const AdminDash = () => {
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [reports, setReports] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("doctors");
  const [purgeStatus, setPurgeStatus] = useState(null);
  const [purging, setPurging] = useState(false);
  const navigate = useNavigate();

  // --- DATA FETCHING ---
  const fetchPending = async () => {
    try {
      const res = await fetch(`${API}/api/admin/pending-doctors`);
      const data = await res.json();
      if (data.success) setPendingDoctors(data.doctors);
    } catch (err) { console.error("Fetch error:", err); }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API}/api/admin/reports`);
      const data = await res.json();
      if (data.success) setReports(data.reports);
    } catch (err) { console.error("Report Fetch error:", err); }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await fetch(`${API}/api/admin/all-users`);
      const data = await res.json();
      if (data.success) setAllUsers(data.users);
    } catch (err) { console.error("All-users fetch error:", err); }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) { navigate("/login"); return; }
    const user = JSON.parse(userStr);
    if (user.role !== "admin") {
      alert("Unauthorized! Only Admins can enter here.");
      navigate("/");
      return;
    }
    fetchPending();
    fetchReports();
    fetchAllUsers();
  }, [navigate]);

  // --- DOCTOR ACTIONS ---
  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${API}/api/admin/approve-doctor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId: id }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Doctor Approved!");
        setPendingDoctors((prev) => prev.filter((doc) => doc._id !== id));
      }
    } catch (err) { alert("Approval failed."); }
  };

  const handleReject = async (id) => {
    if (window.confirm("Are you sure you want to reject and delete this request?")) {
      try {
        const res = await fetch(`${API}/api/admin/reject-doctor/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          alert("Doctor Rejected!");
          setPendingDoctors((prev) => prev.filter((doc) => doc._id !== id));
        }
      } catch (err) { alert("Rejection failed."); }
    }
  };

  // --- PURGE TEST USERS ---
  const handlePurge = async () => {
    if (!window.confirm(
      "This will DELETE all patient accounts except 2023021011@mmut.ac.in and admin accounts.\n\nDoctors are ALWAYS preserved.\n\nContinue?"
    )) return;

    setPurging(true);
    setPurgeStatus(null);
    try {
      const res = await fetch(`${API}/api/admin/purge-test-users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ protectedEmails: ["2023021011@mmut.ac.in"] })
      });
      const data = await res.json();
      if (data.success) {
        setPurgeStatus({ type: "success", msg: data.message });
        fetchAllUsers();
      } else {
        setPurgeStatus({ type: "error", msg: data.message || "Purge failed." });
      }
    } catch (err) {
      setPurgeStatus({ type: "error", msg: "Network error. Check backend connection." });
    } finally {
      setPurging(false);
    }
  };

  const roleColor = (role) => {
    if (role === "admin") return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
    if (role === "doctor") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
  };

  return (
    <div className="max-w-[1000px] mx-auto my-[50px] px-[20px] font-sans">
      <h2 className="text-center mb-[40px] text-3xl font-bold text-slate-800 dark:text-slate-100">
        Admin Management Portal
      </h2>

      {/* Tab Navigation */}
      <div className="flex gap-[12px] mb-[24px] flex-wrap">
        {[
          { key: "doctors", label: `Pending Doctors (${pendingDoctors.length})` },
          { key: "reports", label: `User Reports (${reports.length})` },
          { key: "users", label: `All Users (${allUsers.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            className={`px-5 py-2.5 border-none cursor-pointer rounded-xl font-bold transition-colors text-sm ${
              activeTab === tab.key
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600"
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <hr className="border-slate-200 dark:border-slate-700 mb-6" />

      {/* Pending Doctors */}
      {activeTab === "doctors" && (
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(420px,1fr))] gap-[28px] items-start animate-fadeIn mt-5">
          {pendingDoctors.length > 0 ? (
            pendingDoctors.map((doc) => (
              <div key={doc._id} className="bg-white dark:bg-slate-800 rounded-[16px] border border-slate-200 dark:border-slate-700 shadow-[0_10px_25px_rgba(0,0,0,0.06)] p-[18px] md:p-[22px] transition-all hover:-translate-y-[3px] hover:shadow-[0_14px_32px_rgba(0,0,0,0.10)] block w-full">
                <div className="flex items-center gap-[18px] pb-[14px] border-b border-slate-100 dark:border-slate-700 mb-[16px]">
                  <img src={`${API}/uploads/${doc.image}`} alt="doctor" className="w-[90px] h-[90px] rounded-[14px] object-cover border-[2px] border-blue-100 dark:border-blue-900 shadow-[0_6px_14px_rgba(0,0,0,0.15)]" />
                  <div>
                    <h2 className="m-0 mb-1 text-slate-800 dark:text-slate-100 text-xl font-bold">{doc.name}</h2>
                    <p className="m-[2px_0] text-slate-500 dark:text-slate-400 text-[0.9rem]"><b>Email:</b> {doc.email}</p>
                    <p className="m-[2px_0] text-slate-500 dark:text-slate-400 text-[0.9rem]"><b>Specialization:</b> {doc.specialization}</p>
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-slate-700 border border-blue-100 dark:border-slate-600 rounded-[12px] p-[14px] my-[16px] text-[14px] leading-[1.6] text-slate-800 dark:text-slate-200">
                  <p className="m-0"><b>Degree:</b> {doc.degree}</p>
                  <p className="m-0"><b>Experience:</b> {doc.experience} Years</p>
                  <p className="m-0"><b>Hospital:</b> {doc.hospitalName} – {doc.city}</p>
                  <p className="m-0"><b>Phone:</b> {doc.phone}</p>
                </div>
                <div className="flex gap-2 mb-3 flex-wrap">
                  {doc.aadhaarCard && (
                    <a href={`${API}/uploads/${doc.aadhaarCard}`} target="_blank" rel="noreferrer"
                      className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                      View Aadhaar
                    </a>
                  )}
                  {doc.medicalLicense && (
                    <a href={`${API}/uploads/${doc.medicalLicense}`} target="_blank" rel="noreferrer"
                      className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                      View License
                    </a>
                  )}
                  {doc.degreeCertificate && (
                    <a href={`${API}/uploads/${doc.degreeCertificate}`} target="_blank" rel="noreferrer"
                      className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                      View Degree
                    </a>
                  )}
                </div>
                <div className="flex gap-[10px] mt-[18px] justify-end">
                  <button className="bg-[#00d293] hover:bg-[#00b37e] text-white border-none p-[12px_25px] rounded-[8px] font-bold cursor-pointer transition-transform hover:-translate-y-[2px]" onClick={() => handleApprove(doc._id)}>Approve</button>
                  <button className="bg-[#ff4d4d] hover:bg-[#cc0000] text-white border-none p-[12px_25px] rounded-[8px] font-bold cursor-pointer transition-transform hover:-translate-y-[2px]" onClick={() => handleReject(doc._id)}>Reject</button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center p-[40px] bg-slate-50 dark:bg-slate-900 rounded-[12px] text-slate-400">All quiet! No pending doctor registrations.</p>
          )}
        </div>
      )}

      {/* User Reports */}
      {activeTab === "reports" && (
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(420px,1fr))] gap-[28px] items-start animate-fadeIn mt-5">
          {reports.length > 0 ? (
            reports.map((rep) => (
              <div key={rep._id} className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 p-[15px] rounded-[8px] mb-[15px] text-slate-800 dark:text-slate-200">
                <div className="flex justify-between items-center mb-[10px]">
                  <span className="text-[#d9534f] font-bold text-[1.1rem]">&#9888;&#65039; {rep.reason}</span>
                  <span className="text-slate-500 text-sm">{new Date(rep.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <p><strong>Room ID:</strong> {rep.roomId}</p>
                  <p><strong>Reporter:</strong> {rep.reporterId?.name || "Unknown"}</p>
                  <details className="mt-[10px] bg-slate-100 dark:bg-slate-800 p-[10px] rounded-[5px] cursor-pointer">
                    <summary>View Chat Transcript</summary>
                    <div className="max-h-[150px] overflow-y-auto text-[0.9rem] mt-[5px] bg-white dark:bg-slate-900 p-2 rounded">
                      {rep.chatTranscript?.map((msg, i) => (
                        <div key={i} className="mb-1">
                          <strong>{msg.sender}:</strong> {msg.message}
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
                <button className="mt-[10px] bg-black text-white w-full p-[8px] rounded-[4px] cursor-pointer hover:bg-slate-800" onClick={() => alert("Action coming soon!")}>Review / Ban</button>
              </div>
            ))
          ) : (
            <p className="text-center p-[40px] bg-slate-50 dark:bg-slate-900 rounded-[12px] text-slate-400">No user reports filed yet.</p>
          )}
        </div>
      )}

      {/* All Users & DB Cleanup */}
      {activeTab === "users" && (
        <div className="space-y-6 animate-fadeIn mt-5">
          {/* Danger Zone: Purge */}
          <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-800 rounded-2xl p-6">
            <h3 className="text-red-700 dark:text-red-400 font-black text-lg mb-1">Database Cleanup</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Remove all <strong>test patient accounts</strong> from the database. The following are <strong>always preserved</strong>:
            </p>
            <ul className="text-sm text-slate-700 dark:text-slate-300 mb-4 list-disc list-inside space-y-1">
              <li>All doctors (approved & pending)</li>
              <li>All admin accounts</li>
              <li><code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs">2023021011@mmut.ac.in</code></li>
            </ul>

            {purgeStatus && (
              <div className={`p-3 rounded-xl mb-4 text-sm font-semibold ${
                purgeStatus.type === "success"
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300"
                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300"
              }`}>
                {purgeStatus.msg}
              </div>
            )}

            <button
              onClick={handlePurge}
              disabled={purging}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black rounded-xl transition-all cursor-pointer shadow-md shadow-red-500/20"
            >
              {purging ? "Purging..." : "Purge Test Accounts"}
            </button>
          </div>

          {/* User List */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">All Registered Users ({allUsers.length})</h3>
              <button onClick={fetchAllUsers} className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer">
                Refresh
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[500px] overflow-y-auto">
              {allUsers.map(u => (
                <div key={u._id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{u.name}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold ${roleColor(u.role)}`}>
                    {u.role.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDash;