import { useState, useEffect } from "react";
import io from "socket.io-client";
import "./Queue.css";

const socket = io.connect("http://localhost:5000");

function Queue() {
  const [liveToken, setLiveToken] = useState(0);
  const [myAppointment, setMyAppointment] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("live");
  const [loading, setLoading] = useState(true);

  const [loggedInUser, setLoggedInUser] = useState(undefined);



  // ================= FETCH DATA =================
  const fetchHealthHubData = async () => {
    if (!loggedInUser?._id) return;

    try {
      // current appointment
      const apptRes = await fetch(`http://localhost:5000/api/appointments/user/${loggedInUser._id}`);
      const apptData = await apptRes.json();

      if (apptData.success && apptData.appointment) {
        setMyAppointment(apptData.appointment);

        const liveRes = await fetch(`http://localhost:5000/api/appointments/live-status/${apptData.appointment.doctorId}`);
        const liveData = await liveRes.json();
        if (liveData.success) setLiveToken(liveData.currentToken || 0);
      }

      // medical reports history
      const historyRes = await fetch(`http://localhost:5000/api/patient/reports/${loggedInUser._id}`);
      const historyData = await historyRes.json();
      if (historyData.success) setHistory(historyData.reports);

    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  const userStr = localStorage.getItem("user");

  if (!userStr) {
    window.location.replace("/login");
    return;
  }

  setLoggedInUser(JSON.parse(userStr));
}, []);


  // initial load + polling
  useEffect(() => {
  if (!loggedInUser?._id) return;

  fetchHealthHubData();

  const interval = setInterval(() => {
    fetchHealthHubData();
  }, 30000);

  return () => clearInterval(interval);

}, [loggedInUser?._id]);


  // realtime queue update
  useEffect(() => {
    if (!loggedInUser?._id) return;

    socket.on("queue_updated", (data) => {
      if (myAppointment && data.doctorId === myAppointment.doctorId) {
        setLiveToken(data.newLiveToken);
        new Audio('/notification-beep.mp3').play().catch(() => {});
      }
    });

    return () => socket.off("queue_updated");
  }, [myAppointment, loggedInUser]);

  // ================= UPLOAD REPORT =================
  const uploadReport = async (file, appointment) => {
    if (!file || !appointment) return;

    const formData = new FormData();
    formData.append("report", file);
    formData.append("patientId", loggedInUser._id);
    formData.append("doctorId", appointment.doctorId);
    formData.append("appointmentId", appointment._id);
    formData.append("date", appointment.date);

    const res = await fetch("http://localhost:5000/api/patient/upload-report", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (data.success) {
      alert("Report Uploaded Successfully");
      fetchHealthHubData();
      setActiveTab("history"); // auto switch to history
    } else {
      alert("Upload failed");
    }
  };

  if (loggedInUser === undefined)
  return <div className="loader">Checking Login...</div>;

if (loading)
  return <div className="loader">Syncing your Health Records...</div>;


  return (
    <div className="queue-container">
      <h2 className="main-heading">Patient Health Dashboard</h2>

      <div className="tab-menu">
        <button className={activeTab === "live" ? "active" : ""} onClick={() => setActiveTab("live")}>Live Queue</button>
        <button className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")}>Medical History</button>
      </div>

      {/* ================= LIVE QUEUE ================= */}
      {activeTab === "live" ? (
        <div className="tab-content fade-in">
          {!myAppointment ? (
            <div className="no-data">No active tokens for today.</div>
          ) : (
            <>
            <div className="queue-section">
              <div className="status-box cuboidal-card">
                <div className="token-display">
                  <p>Currently Called</p>
                  <div className="token-number">{liveToken}</div>
                </div>

                <div className="user-token-details">
                  <p>Your Token: <strong>{myAppointment.tokenNumber}</strong></p>

                  {liveToken === myAppointment.tokenNumber ? (
                    <div className="alert success">🟢 It's your turn! Please enter.</div>
                  ) : (
                    <p className="wait-time">
                      Estimated Wait: {(myAppointment.tokenNumber - liveToken) * 10} mins
                    </p>
                  )}
                </div>
              </div>

              <div className="queue-footer">
                </div>
                <p>After your visit, upload prescription/report here:</p>

                <label className="upload-btn">
                  📷 Upload Medical Report
                  <input
                    type="file"
                    hidden
                    onChange={(e) => uploadReport(e.target.files[0], myAppointment)}
                  />
                </label>
              </div>
            </>
          )}
        </div>
      ) : (

      /* ================= MEDICAL HISTORY ================= */

        <div className="tab-content fade-in">
          {history.length === 0 ? (
            <div className="no-data">No medical records uploaded yet.</div>
          ) : (
            <div className="history-list">
              {history.map((record, index) => (
                <div key={index} className="history-card cuboidal-card">
                  <div className="history-header">
                    <span className="date-tag">{record.date}</span>
                  </div>

                  <h4>Doctor: {record.doctorId}</h4>

                  <a
                    href={`http://localhost:5000/uploads/${record.file}`}
                    target="_blank"
                    rel="noreferrer"
                    className="view-report-btn"
                  >
                    📄 View Uploaded Report
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Queue;

