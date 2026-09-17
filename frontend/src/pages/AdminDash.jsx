import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Redirect ke liye zaroori hai

const API = process.env.REACT_APP_API || "https://healthai-hub.onrender.com";

const AdminDash = () => {
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState("doctors");
  const navigate = useNavigate(); // ✅ Hook initialized

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

  useEffect(() => {
    // 🚨 ACCESS GUARD: Check if user is Admin
    const userStr = localStorage.getItem("user");
    
    if (!userStr) {
      // Agar user login nahi hai, bhej do login page pe
      navigate("/login"); 
      return;
    }

    const user = JSON.parse(userStr);
    if (user.role !== "admin") {
      // Agar logged in hai par role admin nahi hai, home bhej do
      alert("Unauthorized! Only Admins can enter here.");
      navigate("/"); 
      return;
    }

    // Agar sab theek hai, tabhi data fetch karo
    fetchPending();
    fetchReports();
  }, [navigate]);

  // --- DOCTOR ACTIONS (handleApprove, handleReject) remain same ---
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
        const res = await fetch(`${API}/api/admin/reject-doctor/${id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.success) {
          alert("Doctor Rejected!");
          setPendingDoctors((prev) => prev.filter((doc) => doc._id !== id));
        }
      } catch (err) { alert("Rejection failed."); }
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto my-[50px] px-[20px] font-sans">
      <h2 className="text-center mb-[40px] text-3xl font-bold text-slate-800 dark:text-slate-100">Admin Management Portal</h2>
      {/* ... Baki ka UI code jo aapne likha hai (Tabs and Grids) ... */}
      
      {/* Tab Navigation */}
      <div className="flex gap-[20px] mb-[20px]">
        <button 
          className={`p-[10px_20px] border-none cursor-pointer rounded-[5px] font-bold transition-colors ${activeTab === "doctors" ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"}`} 
          onClick={() => setActiveTab("doctors")}
        >
          Pending Doctors ({pendingDoctors.length})
        </button>
        <button 
          className={`p-[10px_20px] border-none cursor-pointer rounded-[5px] font-bold transition-colors ${activeTab === "reports" ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"}`} 
          onClick={() => setActiveTab("reports")}
        >
          User Reports ({reports.length})
        </button>
      </div>

      <hr />

      {/* Render logic starts here */}
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

      {/* Reports logic... same as yours */}
      {activeTab === "reports" && (
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(420px,1fr))] gap-[28px] items-start animate-fadeIn mt-5">
          {reports.length > 0 ? (
            reports.map((rep) => (
              <div key={rep._id} className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 p-[15px] rounded-[8px] mb-[15px] text-slate-800 dark:text-slate-200">
                <div className="flex justify-between items-center mb-[10px]">
                  <span className="text-[#d9534f] font-bold text-[1.1rem]">⚠️ {rep.reason}</span>
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
                <button className="mt-[10px] bg-black text-white w-full p-[8px] rounded-[4px] cursor-pointer hover:bg-slate-800" onClick={() => alert("Action coming soon!")}>Punish / Ban</button>
              </div>
            ))
          ) : (
            <p className="text-center p-[40px] bg-slate-50 dark:bg-slate-900 rounded-[12px] text-slate-400">No user reports filed yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDash;