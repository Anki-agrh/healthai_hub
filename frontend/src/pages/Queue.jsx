import { useState, useEffect } from "react";
import io from "socket.io-client";


const API_BASE = process.env.REACT_APP_API || "https://healthai-hub.onrender.com";
const socket = io(API_BASE);

function Queue() {
  const [liveToken, setLiveToken] = useState(0);
  const [myAppointment, setMyAppointment] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("live");
  const [loading, setLoading] = useState(true);

  const [aiSummary, setAiSummary] = useState({});
  const [summarizing, setSummarizing] = useState(false);

  const [loggedInUser, setLoggedInUser] = useState(undefined);



  // ================= FETCH DATA =================
  const fetchHealthHubData = async () => {
    if (!loggedInUser?._id) return;
    const API_BASE = process.env.REACT_APP_API || "https://healthai-hub.onrender.com";
    try {
      // current appointment
      const apptRes = await fetch(`${API_BASE}/api/appointments/user/${loggedInUser._id}`);
      const apptData = await apptRes.json();

      if (apptData.success && apptData.appointment) {
        setMyAppointment(apptData.appointment);

        const liveRes = await fetch(`${API_BASE}/api/appointments/live-status/${apptData.appointment.doctorId}`);
        const liveData = await liveRes.json();
        if (liveData.success) setLiveToken(liveData.currentToken || 0);
      }

      // medical reports history
      const historyRes = await fetch(`${API_BASE}/api/patient/reports/${loggedInUser._id}`);
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

    const res = await fetch(`${API_BASE}/api/patient/upload-report`, {
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

  const getAiSummary = async (filename) => {
    setSummarizing(filename);
    try {
      const res = await fetch(`${API_BASE}/api/ai/analyze-existing-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename })
      });
      const data = await res.json();
      if (data.success) {
        setAiSummary(prev => ({ ...prev, [filename]: data.result }));
      } else {
        alert("AI could not summarize this file.");
      }
    } catch (err) {
      alert("AI Summary failed.");
    } finally {
      setSummarizing(false);
    }
  };

  if (loggedInUser === undefined)
    return <div className="loader">Checking Login...</div>;

if (loading)
  return <div className="loader">Syncing your Health Records...</div>;


  return (
    <div className="max-w-[700px] mx-auto my-[40px] p-[20px] overflow-hidden font-sans bg-slate-50 dark:bg-slate-900 transition-colors">
      <h2 className="text-center text-accent mb-[30px] text-3xl font-bold">Patient Health Dashboard</h2>

      <div className="flex justify-center gap-[10px] mb-[30px] border-b-2 border-slate-200 dark:border-slate-700 pb-[10px]">
        <button className={`bg-transparent border-none p-[10px_20px] text-[16px] font-semibold cursor-pointer transition-colors ${activeTab === "live" ? "text-accent border-b-[3px] border-accent" : "text-slate-500 dark:text-slate-400"}`} onClick={() => setActiveTab("live")}>Live Queue</button>
        <button className={`bg-transparent border-none p-[10px_20px] text-[16px] font-semibold cursor-pointer transition-colors ${activeTab === "history" ? "text-accent border-b-[3px] border-accent" : "text-slate-500 dark:text-slate-400"}`} onClick={() => setActiveTab("history")}>Medical History</button>
      </div>

      {/* ================= LIVE QUEUE ================= */}
      {activeTab === "live" ? (
        <div className="animate-fadeIn">
          {!myAppointment ? (
            <div className="text-center text-slate-400 p-[50px] font-medium">No active tokens for today.</div>
          ) : (
            <>
            <div className="flex flex-col items-center gap-[18px]">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-[15px] p-[40px] text-center w-full max-w-[520px] transition-transform shadow-md">
                <div className="mb-5">
                  <p className="text-[14px] text-slate-500 dark:text-slate-400 uppercase tracking-[1px] font-semibold">Currently Called</p>
                  <div className="text-[64px] font-extrabold text-accent my-[10px]">{liveToken}</div>
                </div>

                <div className="text-slate-800 dark:text-slate-100 text-lg">
                  <p className="mb-2">Your Token: <strong className="text-xl">{myAppointment.tokenNumber}</strong></p>

                  {liveToken === myAppointment.tokenNumber ? (
                    <div className="text-emerald-600 dark:text-emerald-400 font-bold p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">🟢 It's your turn! Please enter.</div>
                  ) : (
                    <p className="text-orange-500 font-semibold">
                      Estimated Wait: {(myAppointment.tokenNumber - liveToken) * 10} mins
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-[18px] w-full max-w-[520px] mx-auto text-center bg-blue-50/50 dark:bg-blue-900/10 border border-dashed border-blue-200 dark:border-blue-800 p-[22px_20px] rounded-[14px]">
                </div>
                <p className="mb-[12px] text-[14px] text-slate-700 dark:text-slate-300 font-medium">After your visit, upload prescription/report here:</p>

                <label className="inline-flex items-center justify-center gap-[8px] mt-[12px] p-[12px_22px] bg-gradient-to-br from-[#0a4db8] to-[#3b82f6] text-white font-semibold text-[14px] rounded-[10px] cursor-pointer transition-all shadow-[0_6px_16px_rgba(10,77,184,0.25)] hover:-translate-y-[2px] hover:shadow-[0_10px_25px_rgba(10,77,184,0.35)]">
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

        <div className="animate-fadeIn">
          {history.length === 0 ? (
            <div className="text-center text-slate-400 p-[50px] font-medium">No medical records uploaded yet.</div>
          ) : (
            <div className="flex flex-col gap-[15px]">
              {history.map((record, index) => (
                <div key={index} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[12px] p-[20px] text-left transition-all shadow-sm hover:-translate-y-[3px] hover:shadow-[0_5px_15px_rgba(0,0,0,0.1)] text-slate-800 dark:text-slate-100">
                  <div className="flex justify-between mb-[10px]">
                    <span className="text-[12px] text-slate-500 dark:text-slate-400 font-bold">{record.date}</span>
                  </div>

                  <h4 className="text-lg font-semibold">Doctor: {record.doctorId}</h4>

                  <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                    <a
                      href={`${API_BASE}/uploads/${record.file}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-[12px] p-[8px_14px] bg-blue-50 dark:bg-blue-900/30 rounded-[8px] no-underline text-accent font-semibold transition-colors hover:bg-accent hover:text-white"
                      style={{ flex: 1, textAlign: "center" }}
                    >
                      📄 View Record
                    </a>
                    <button 
                      onClick={() => getAiSummary(record.file)} 
                      disabled={summarizing === record.file}
                      className="inline-block mt-[12px] p-[8px_14px] bg-blue-50 dark:bg-blue-900/30 rounded-[8px] no-underline text-accent font-semibold transition-colors hover:bg-accent hover:text-white"
                      style={{ flex: 1, background: "#10b981" }}
                    >
                      {summarizing === record.file ? "🤖 Reading..." : "✨ AI Summarize"}
                    </button>
                  </div>

                  {aiSummary[record.file] && (
                    <div style={{ marginTop: "15px", padding: "12px", background: "#f8fafc", borderRadius: "8px", borderLeft: "4px solid #10b981", fontSize: "14px", color: "#334155" }}>
                      <strong>🤖 AI Layman Summary:</strong>
                      <div style={{ marginTop: "8px", whiteSpace: "pre-line" }}>{aiSummary[record.file]}</div>
                    </div>
                  )}
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

