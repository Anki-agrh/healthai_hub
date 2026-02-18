import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Redirect ke liye zaroori hai
import "./AdminDash.css";
const API = process.env.REACT_APP_API;

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
    <div className="admin-container">
      <h2 className="admin-title">Admin Management Portal</h2>
      {/* ... Baki ka UI code jo aapne likha hai (Tabs and Grids) ... */}
      
      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button 
          className={activeTab === "doctors" ? "active-tab" : ""} 
          onClick={() => setActiveTab("doctors")}
        >
          Pending Doctors ({pendingDoctors.length})
        </button>
        <button 
          className={activeTab === "reports" ? "active-tab" : ""} 
          onClick={() => setActiveTab("reports")}
        >
          User Reports ({reports.length})
        </button>
      </div>

      <hr />

      {/* Render logic starts here */}
      {activeTab === "doctors" && (
        <div className="admin-grid fade-in">
          {pendingDoctors.length > 0 ? (
            pendingDoctors.map((doc) => (
              <div key={doc._id} className="admin-card verify-card">
                <div className="verify-header">
                  <img src={`${API}/uploads/${doc.image}`} alt="doctor" className="verify-photo" />
                  <div>
                    <h2>{doc.name}</h2>
                    <p><b>Email:</b> {doc.email}</p>
                    <p><b>Specialization:</b> {doc.specialization}</p>
                  </div>
                </div>
                <div className="verify-section">
                  <p><b>Degree:</b> {doc.degree}</p>
                  <p><b>Experience:</b> {doc.experience} Years</p>
                </div>
                <div className="admin-actions">
                  <button className="approve-btn" onClick={() => handleApprove(doc._id)}>Approve</button>
                  <button className="reject-btn" onClick={() => handleReject(doc._id)}>Reject</button>
                </div>
              </div>
            ))
          ) : (
            <p className="no-data">All quiet! No pending doctor registrations.</p>
          )}
        </div>
      )}

      {/* Reports logic... same as yours */}
      {activeTab === "reports" && (
        <div className="admin-grid fade-in">
          {reports.length > 0 ? (
            reports.map((rep) => (
              <div key={rep._id} className="report-card">
                <div className="report-header">
                  <span className="report-reason">⚠️ {rep.reason}</span>
                  <span className="report-date">{new Date(rep.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="report-body">
                  <p><strong>Room ID:</strong> {rep.roomId}</p>
                  <p><strong>Reporter:</strong> {rep.reporterId?.name || "Unknown"}</p>
                  <details className="transcript-details">
                    <summary>View Chat Transcript</summary>
                    <div className="transcript-box">
                      {rep.chatTranscript?.map((msg, i) => (
                        <div key={i} className="transcript-msg">
                          <strong>{msg.sender}:</strong> {msg.message}
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
                <button className="ban-btn" onClick={() => alert("Action coming soon!")}>Punish / Ban</button>
              </div>
            ))
          ) : (
            <p className="no-data">No user reports filed yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDash;