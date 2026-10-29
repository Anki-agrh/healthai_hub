import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { Upload, FileText, Sparkles, CheckCircle2, Clock, User, Calendar, Activity, Eye, RefreshCw } from "lucide-react";

const API_BASE = process.env.REACT_APP_API || "https://healthai-hub.onrender.com";
const socket = io(API_BASE);

// Realistic sample records shown when user has not yet uploaded files
const DEMO_RECORDS = [
  {
    _id: "demo-1",
    doctorId: "Dr. Sarah Jenkins (Cardiology)",
    title: "Comprehensive Lipid & Cardiac Biomarker Panel",
    date: "2026-10-15",
    file: "demo_cardio_panel.pdf",
    isDemo: true,
    summary: "Cholesterol: 182 mg/dL (Normal). HDL: 54 mg/dL, LDL: 108 mg/dL. Troponin levels negative. Overall cardiac risk score is low. Maintain current aerobic exercise and low-saturated-fat diet."
  },
  {
    _id: "demo-2",
    doctorId: "Dr. Marcus Vance (Neurology)",
    title: "Cranial MRI & EEG Screening Summary",
    date: "2026-09-28",
    file: "demo_mri_eeg.pdf",
    isDemo: true,
    summary: "No intracranial lesions, acute ischemia, or mass effect. Brain parenchyma and ventricles unremarkable. Recommended follow-up in 12 months for routine tension-headache management."
  }
];

function Queue() {
  const [liveToken, setLiveToken] = useState(0);
  const [myAppointment, setMyAppointment] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("history"); // Default to history tab as requested
  const [loading, setLoading] = useState(true);

  const [aiSummary, setAiSummary] = useState({});
  const [summarizing, setSummarizing] = useState(null);

  const [loggedInUser, setLoggedInUser] = useState(undefined);

  // New Upload Form State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [reportTitle, setReportTitle] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // ================= FETCH DATA =================
  const fetchHealthHubData = async () => {
    if (!loggedInUser?._id) return;
    try {
      // Current appointment
      const apptRes = await fetch(`${API_BASE}/api/appointments/user/${loggedInUser._id}`);
      const apptData = await apptRes.json();

      if (apptData.success && apptData.appointment) {
        setMyAppointment(apptData.appointment);

        const liveRes = await fetch(`${API_BASE}/api/appointments/live-status/${apptData.appointment.doctorId}`);
        const liveData = await liveRes.json();
        if (liveData.success) setLiveToken(liveData.currentToken || 0);
      }

      // Medical reports history
      const historyRes = await fetch(`${API_BASE}/api/patient/reports/${loggedInUser._id}`);
      const historyData = await historyRes.json();
      if (historyData.success && historyData.reports) {
        setHistory(historyData.reports);
      }
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

  useEffect(() => {
    if (!loggedInUser?._id) return;
    fetchHealthHubData();
    const interval = setInterval(fetchHealthHubData, 30000);
    return () => clearInterval(interval);
  }, [loggedInUser?._id]);

  // Realtime queue update
  useEffect(() => {
    if (!loggedInUser?._id) return;
    socket.on("queue_updated", (data) => {
      if (myAppointment && data.doctorId === myAppointment.doctorId) {
        setLiveToken(data.newLiveToken);
        new Audio("/notification-beep.mp3").play().catch(() => {});
      }
    });
    return () => socket.off("queue_updated");
  }, [myAppointment, loggedInUser]);

  // ================= DIRECT UPLOAD REPORT =================
  const handleDirectUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      alert("Please select a file to upload (PDF, JPG, PNG)");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("report", uploadFile);
    formData.append("patientId", loggedInUser._id);
    formData.append("doctorName", doctorName.trim() || "General Practice / Self-Upload");
    formData.append("reportTitle", reportTitle.trim() || uploadFile.name);
    formData.append("appointmentId", myAppointment?._id || "Direct-Upload");
    formData.append("date", reportDate);

    try {
      const res = await fetch(`${API_BASE}/api/patient/upload-report`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        setUploadSuccess(true);
        setTimeout(() => {
          setUploadSuccess(false);
          setShowUploadModal(false);
          setUploadFile(null);
          setReportTitle("");
          setDoctorName("");
        }, 1200);
        fetchHealthHubData();
      } else {
        alert("Upload failed. Please try again.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Network error while uploading report.");
    } finally {
      setUploading(false);
    }
  };

  const getAiSummary = async (record) => {
    if (record.isDemo) {
      setAiSummary(prev => ({ ...prev, [record._id]: record.summary }));
      return;
    }

    setSummarizing(record.file);
    try {
      const res = await fetch(`${API_BASE}/api/ai/analyze-existing-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: record.file })
      });
      const data = await res.json();
      if (data.success) {
        setAiSummary(prev => ({ ...prev, [record.file]: data.result }));
      } else {
        alert("AI could not summarize this file. Please check backend connection.");
      }
    } catch (err) {
      alert("AI Summary request failed.");
    } finally {
      setSummarizing(null);
    }
  };

  if (loggedInUser === undefined) return (
    <div className="min-h-[60vh] flex items-center justify-center text-slate-500 font-medium">
      <RefreshCw className="animate-spin mr-2 text-accent" /> Checking authentication...
    </div>
  );

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center text-slate-500 font-medium">
      <RefreshCw className="animate-spin mr-2 text-accent" /> Syncing your Medical Records...
    </div>
  );

  const displayRecords = history.length > 0 ? history : DEMO_RECORDS;

  return (
    <div className="max-w-[1000px] mx-auto my-8 px-4 font-sans">
      
      {/* Top Header */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent mb-2">
          <Activity size={14} /> Comprehensive Patient Portal
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Medical Records & Queue Hub
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review your medical history, upload prescriptions, or track your live appointment queue.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-3 mb-8 border-b border-slate-200 dark:border-slate-700 pb-2">
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "history"
              ? "bg-accent text-white shadow-md shadow-accent/25"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <FileText size={16} /> Medical History & Reports
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-white/20">
            {displayRecords.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("live")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "live"
              ? "bg-accent text-white shadow-md shadow-accent/25"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Clock size={16} /> Live Token Queue
          {myAppointment && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* ================= TAB 1: MEDICAL HISTORY ================= */}
      {activeTab === "history" && (
        <div className="space-y-6">

          {/* Action Banner with Upload Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 border border-blue-100 dark:border-slate-700 shadow-sm gap-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Your Health Vault
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload test results, X-rays, or prescriptions for automatic AI summaries.
              </p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent/90 transition-all shadow-md shadow-accent/20 cursor-pointer shrink-0"
            >
              <Upload size={16} /> Upload New Report
            </button>
          </div>

          {/* Upload Modal */}
          {showUploadModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
              <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-[500px] p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative animate-fadeIn">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xl font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  ✕
                </button>

                <div className="text-center mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mx-auto mb-2">
                    <Upload size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Upload Medical Document</h3>
                  <p className="text-xs text-slate-500">PDF, JPG, or PNG up to 15MB</p>
                </div>

                {uploadSuccess ? (
                  <div className="text-center py-8">
                    <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-2 animate-bounce" />
                    <p className="text-base font-bold text-slate-800 dark:text-white">Report Uploaded Successfully!</p>
                    <p className="text-xs text-slate-500">Syncing to your patient record...</p>
                  </div>
                ) : (
                  <form onSubmit={handleDirectUpload} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Report Title / Test Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Complete Blood Count (CBC) or ECG"
                        value={reportTitle}
                        onChange={(e) => setReportTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Doctor / Diagnostic Center
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Sarah Jenkins or City Diagnostics"
                        value={doctorName}
                        onChange={(e) => setDoctorName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Report Date
                      </label>
                      <input
                        type="date"
                        value={reportDate}
                        onChange={(e) => setReportDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Attach File *
                      </label>
                      <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center cursor-pointer hover:border-accent transition-colors bg-slate-50/50 dark:bg-slate-900/50">
                        <input
                          type="file"
                          id="file-input"
                          required
                          className="hidden"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => setUploadFile(e.target.files[0])}
                        />
                        <label htmlFor="file-input" className="cursor-pointer">
                          <FileText size={24} className="mx-auto text-slate-400 mb-1" />
                          <p className="text-xs font-semibold text-accent">
                            {uploadFile ? uploadFile.name : "Click to browse file from device"}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Supports PDF, PNG, JPG</p>
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={uploading}
                      className="w-full py-3 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent/90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-accent/25"
                    >
                      {uploading ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" /> Uploading & Processing...
                        </>
                      ) : (
                        <>
                          <Upload size={16} /> Save to Medical Records
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Records Grid */}
          <div className="grid grid-cols-1 gap-4">
            {displayRecords.map((record, index) => {
              const fileKey = record.file || record._id;
              const hasSummary = aiSummary[fileKey] || (record.isDemo && aiSummary[record._id]);
              const isBeingSummarized = summarizing === record.file;

              return (
                <div
                  key={record._id || index}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all text-slate-800 dark:text-slate-100"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                          {record.title || (record.file ? record.file.replace(/^report-\d+-/, '') : "Diagnostic Laboratory Report")}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <User size={13} className="text-slate-400" />
                            {record.doctorId || "Specialist Examination"}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar size={13} className="text-slate-400" />
                            {record.date}
                          </span>
                          {record.isDemo && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              Verified Sample
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                      {!record.isDemo ? (
                        <a
                          href={`${API_BASE}/uploads/${record.file}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors"
                        >
                          <Eye size={14} /> View File
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 px-2 py-1 bg-slate-50 dark:bg-slate-900 rounded-lg">
                          Encrypted Document
                        </span>
                      )}

                      <button
                        onClick={() => getAiSummary(record)}
                        disabled={isBeingSummarized}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all cursor-pointer"
                      >
                        {isBeingSummarized ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" /> AI Reading...
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} /> {hasSummary ? "Refresh AI Insight" : "Explain with AI"}
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* AI Explanation Box */}
                  {hasSummary && (
                    <div className="mt-3 p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-xs text-slate-700 dark:text-slate-300 animate-fadeIn">
                      <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                        <Sparkles size={14} /> AI Layman Explanation:
                      </div>
                      <p className="leading-relaxed whitespace-pre-line pl-5">
                        {hasSummary}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 2: LIVE QUEUE ================= */}
      {activeTab === "live" && (
        <div className="animate-fadeIn max-w-[560px] mx-auto">
          {!myAppointment ? (
            <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <Clock size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">No Active Token Today</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                You don't have an active consultation booked for today. Visit the Specialists tab to book an appointment.
              </p>
              <a
                href="/consult"
                className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent/90 shadow-md shadow-accent/20 transition-all"
              >
                Book Appointment
              </a>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm text-center">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent">
                Token Status: Active
              </span>

              <div className="my-6">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Currently Called</p>
                <div className="text-6xl font-black text-accent my-2 tracking-tight">
                  #{liveToken || 0}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700/80 mb-5">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Your Assigned Token: <strong className="text-lg text-accent">#{myAppointment.tokenNumber}</strong>
                </p>

                {liveToken === myAppointment.tokenNumber ? (
                  <div className="mt-2 text-emerald-600 dark:text-emerald-400 font-bold p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-xs flex items-center justify-center gap-1.5 animate-pulse">
                    <CheckCircle2 size={16} /> It's your turn! Please proceed into the clinic.
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    Estimated Wait: {Math.max(0, (myAppointment.tokenNumber - liveToken) * 10)} mins
                  </p>
                )}
              </div>

              <button
                onClick={() => setShowUploadModal(true)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-accent to-blue-600 text-white font-bold text-xs hover:opacity-95 shadow-md shadow-accent/20 transition-all flex items-center justify-center gap-2"
              >
                <Upload size={14} /> Upload Prescription for this Visit
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Queue;
