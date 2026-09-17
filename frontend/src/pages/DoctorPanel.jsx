import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { AlertTriangle, MapPin, Phone, Flag, Mic, Square, Send, X, Circle, Bot } from "lucide-react";

const API_BASE = process.env.REACT_APP_API || "https://healthai-hub.onrender.com";
const socket = io(API_BASE);

function DoctorPanel() {

  useEffect(() => {
  const user = JSON.parse(localStorage.getItem("user"));
  
  // 🚨 STRICT: Sirf doctor allow hai. Admin aur Patient dono blocked hain.
  if (!user || user.role !== "doctor") {
    alert("Access Denied! This panel is strictly for Doctors.");
    window.location.href = "/"; // Redirect to Home
  }
}, []);
  const [activeRoom, setActiveRoom] = useState("");
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [isPatientTyping, setIsPatientTyping] = useState(false);
  const [doctorName, setDoctorName] = useState("Doctor");
  const [doctorInfo, setDoctorInfo] = useState(null);
  const chatEndRef = useRef(null);

  // --- UI STATES ---
  const [appointmentsCount, setAppointmentsCount] = useState(0); 
  const [emergencyAlert, setEmergencyAlert] = useState(null);

  // --- AUDIO STATES ---
  const [isRecording, setIsRecording] = useState(false);
  const [audioPreview, setAudioPreview] = useState(null);
  const [recordedBase64, setRecordedBase64] = useState(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPatientTyping]);

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    
    if (loggedInUser && loggedInUser._id) {
      setDoctorInfo(loggedInUser);
      const roomId = `${loggedInUser._id}-consult`;
      setActiveRoom(roomId);
      setDoctorName(loggedInUser.name || "Doctor");
      
      socket.emit("join_consultation", roomId);

      socket.on("queue_updated", (data) => {
        if (data.doctorId === loggedInUser._id) {
          // Sync the count and the current token
          setAppointmentsCount(data.remainingCount);
          setDoctorInfo(prev => ({ ...prev, currentLiveToken: data.newLiveToken }));
        }
      });

      socket.on("receive_message", (data) => {
        if (data.sender === "Patient" || data.sender === "System") {
          setMessages((prev) => [...prev, data]);
        }
      });

      socket.on("display_typing", (data) => {
        setIsPatientTyping(data.typing);
      });

      socket.on("receive_emergency_alert", (data) => {
        setEmergencyAlert(data);
        // Optional: Play a sound when alert is received
        // new Audio('/emergency_siren.mp3').play();
      });

      fetchDoctorData(loggedInUser._id);
    }

    return () => {
      socket.off("receive_message");
      socket.off("display_typing");
      socket.off("receive_emergency_alert");
      socket.off("queue_updated");
    };
  }, []);

  const fetchDoctorData = async (docId) => {
    const API_BASE = process.env.REACT_APP_API || "https://healthai-hub.onrender.com";
    try {
      const res = await fetch(`${API_BASE}/api/doctors/approved`);
      const data = await res.json();
      const myDoc = data.doctors.find(d => d._id === docId);
      if (myDoc) setAppointmentsCount(myDoc.queueLength || 0); 
    } catch (err) { console.log(err); }
  };

  const handleReportClick = async () => {
    const reason = prompt("Enter reason for reporting this patient:");
    if (!reason) return;
    const reportData = {
      reporterId: doctorInfo._id,
      reportedUserId: activeRoom.split('-')[0],
      roomId: activeRoom,
      reason: reason,
      chatTranscript: messages 
    };
    try {
      const res = await fetch(`${process.env.REACT_APP_API}/api/reports/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData)
      });
      if (res.ok) alert("Report submitted.");
    } catch (err) { alert("Reporting failed."); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.current.push(e.data); };
      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
        setAudioPreview(URL.createObjectURL(audioBlob));
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => setRecordedBase64(reader.result);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) { alert("Microphone access denied."); }
  };

  const stopRecording = () => {
    if (mediaRecorder.current?.state !== "inactive") mediaRecorder.current.stop();
    setIsRecording(false);
  };

  const handleConfirmSendAudio = () => {
    if (recordedBase64) {
      const msgData = {
        roomId: activeRoom,
        sender: doctorName,
        message: "🎤 Voice Note",
        audio: recordedBase64,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      socket.emit("send_message", msgData);
      setMessages((prev) => [...prev, msgData]);
      setAudioPreview(null); setRecordedBase64(null);
    }
  };

  const sendReply = () => {
    if (reply.trim() === "" || !activeRoom) return;
    const msgData = {
      roomId: activeRoom, sender: doctorName, message: reply,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    socket.emit("send_message", msgData);
    setMessages((prev) => [...prev, msgData]);
    setReply("");
  };

  const handleNextPatient = () => {
    if (doctorInfo?._id) {
      socket.emit("call_next_patient", { doctorId: doctorInfo._id });
      setAppointmentsCount((prev) => (prev > 0 ? prev - 1 : 0));
      alert("Next patient called!");
    }
  };

  return (
    <div className="h-[92vh] bg-[#f0f2f5] dark:bg-slate-900 p-5 overflow-hidden font-sans flex flex-col gap-4">
      {/* 🚨 UPDATED EMERGENCY BANNER */}
      {emergencyAlert && (
        <div className="bg-[#ff4d4f] text-white p-3 md:p-6 flex justify-between items-center rounded-xl mb-4 shadow-[0_4px_15px_rgba(255,77,79,0.3)] animate-[pulse-border_1.5s_infinite] z-[1000]" style={{
            background: '#fff1f2',
            border: '4px solid #be123c',
            margin: '20px',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 10px 25px rgba(190, 18, 60, 0.2)'
        }}>
          <div className="flex gap-5 items-center" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <span className="animate-[blinker_1s_linear_infinite] text-[20px] flex items-center" style={{ display: 'flex', alignItems: 'center' }}><AlertTriangle size={40} color="#be123c" /></span>
            <div>
              <h3 style={{ color: '#9f1239', margin: 0 }}>CRITICAL EMERGENCY ALERT</h3>
              <p style={{ margin: '5px 0', fontSize: '1.1rem' }}>
                <strong>Patient:</strong> {emergencyAlert.patientName} <br />
                <strong>Contact:</strong> <span style={{color: '#be123c', fontWeight: 'bold'}}>{emergencyAlert.patientPhone}</span> <br />
                <strong>Location:</strong> {emergencyAlert.locationLink !== "Location Unknown" ? (
    <a 
      href={emergencyAlert.locationLink} 
      target="_blank" 
      rel="noopener noreferrer"
      style={{ color: '#2563eb', fontWeight: 'bold', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
    >
      <MapPin size={16} /> Open in Google Maps
    </a>
  ) : (
    <span style={{color: 'gray'}}>Not Shared</span>
  )}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => window.open(`tel:${emergencyAlert.patientPhone}`)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              <Phone size={18} /> CALL NOW
            </button>
            <button 
              onClick={() => setEmergencyAlert(null)}
              style={{ padding: '12px 24px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="flex h-full gap-5">
        
        {/* --- LEFT COLUMN: APPOINTMENT TABLE --- */}
        <div className="flex-[1.1] flex flex-col h-[calc(100%-80px)]">
          <div className="bg-white dark:bg-slate-800 rounded-2xl h-full p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] flex flex-col border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-5 border-b-2 border-slate-100 dark:border-slate-700 pb-4">
              <h3>Today's Appointments</h3>
              <span className="bg-indigo-50 dark:bg-indigo-900/30 text-[#0a4db8] dark:text-indigo-400 px-3 py-1 rounded-full text-[0.85rem] font-bold">{appointmentsCount} Patients</span>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl text-center mb-5 border border-slate-200 dark:border-slate-700">
              <p>Current Token: <strong>{doctorInfo?.currentLiveToken || 0}</strong></p>
              <button className="w-full p-4 bg-[#0a4db8] text-white rounded-xl font-bold border-none cursor-pointer transition-all hover:bg-[#083d91] hover:-translate-y-0.5 shadow-[0_4px_12px_rgba(10,77,184,0.2)]" onClick={handleNextPatient}>
                  CALL NEXT PATIENT
              </button>
            </div>

            <div className="mt-2.5 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 flex-1">
              <table className="w-full border-collapse text-left bg-white dark:bg-slate-800">
                <thead>
                  <tr>
                    <th className="bg-slate-50 dark:bg-slate-800 p-3 text-[0.8rem] text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b-2 border-slate-200 dark:border-slate-700 sticky top-0">Token</th>
                    <th className="bg-slate-50 dark:bg-slate-800 p-3 text-[0.8rem] text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b-2 border-slate-200 dark:border-slate-700 sticky top-0">Patient</th>
                    <th className="bg-slate-50 dark:bg-slate-800 p-3 text-[0.8rem] text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b-2 border-slate-200 dark:border-slate-700 sticky top-0">Issue</th>
                    <th className="bg-slate-50 dark:bg-slate-800 p-3 text-[0.8rem] text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b-2 border-slate-200 dark:border-slate-700 sticky top-0">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-[#0a4db8]">
                    <td className="p-[15px] border-b border-slate-100 dark:border-slate-700 text-[0.9rem] text-slate-800 dark:text-slate-100"><strong>#1</strong></td>
                    <td className="p-[15px] border-b border-slate-100 dark:border-slate-700 text-[0.9rem] text-slate-800 dark:text-slate-100">Ankita</td>
                    <td className="p-[15px] border-b border-slate-100 dark:border-slate-700 text-[0.9rem] text-slate-800 dark:text-slate-100">Fever/Headache</td>
                    <td className="p-[15px] border-b border-slate-100 dark:border-slate-700 text-[0.9rem] text-slate-800 dark:text-slate-100"><span className="px-2.5 py-1 rounded-md text-[0.75rem] font-semibold bg-green-100 text-green-700">Live Now</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: CHAT INTERFACE --- */}
        <div className="flex-[2] flex flex-col h-[calc(100%-80px)]">
          <div className="flex bg-white dark:bg-slate-800 rounded-2xl h-full overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-slate-200 dark:border-slate-700">
            <div className="w-[320px] border-r border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col">
              <h4 className="p-[15px_20px] m-0 text-slate-500 dark:text-slate-400 text-[0.85rem] uppercase font-semibold">Patient Chats</h4>
              <div className="p-[15px_20px] flex items-center gap-3 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-[#0a4db8]">
                <div className="w-10 h-10 bg-[#0a4db8] text-white rounded-full flex items-center justify-center font-bold shrink-0">A</div>
                <div className="flex flex-col">
                  <p className="font-semibold text-[0.95rem] text-slate-800 dark:text-slate-100 m-0">Ankita</p>
                  <p className="text-[0.8rem] text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px] m-0">Fever and...</p>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900">
              <header className="p-[15px_25px] bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-1.5" style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                  <strong>Ankita</strong> <Circle size={10} fill="#22c55e" color="#22c55e" /> <span style={{fontSize: '12px', color: '#64748b'}}>Online</span>
                </div>
                <button className="bg-transparent text-slate-400 border border-slate-200 dark:border-slate-600 px-3.5 py-1.5 rounded-lg text-[0.8rem] font-medium cursor-pointer transition-all hover:text-red-500 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/30" onClick={handleReportClick} style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                  <Flag size={14} /> Report
                </button>
              </header>

              <div className="flex-1 p-[25px] overflow-y-auto bg-[#eef2f7] dark:bg-slate-900/50 flex flex-col gap-3">
                {/* AI Brief Banner */}
                {messages.find(m => m.isAiBrief) && (
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl border border-blue-200 dark:border-blue-800 flex gap-3 animate-slideDown mb-2 text-sm text-blue-900 dark:text-blue-100">
                    <span className="shrink-0"><Bot size={20} color="var(--accent, #0a4db8)" /></span>
                    <p><strong>Pre-Consultation Summary:</strong> {messages.find(m => m.isAiBrief).message.replace("System Auto-Brief: ", "")}</p>
                  </div>
                )}

                {messages.filter(m => !m.isAiBrief).map((m, i) => (
                  <div key={i} className={`flex w-full ${m.sender === doctorName ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[70%] p-3 rounded-2xl text-[0.95rem] shadow-sm relative">
                      {m.audio ? <audio controls src={m.audio} /> : <p>{m.message}</p>}
                      <span className="block text-[0.7rem] mt-1 opacity-70 text-right">{m.time}</span>
                    </div>
                  </div>
                ))}
                {isPatientTyping && <div className="text-slate-400 text-sm animate-pulse ml-2">Patient is typing...</div>}
                <div ref={chatEndRef} />
              </div>

              {/* ✅ Audio Preview with Discard Option */}
              {audioPreview && (
                <div className="bg-white dark:bg-slate-800 p-[15px_25px] border-t border-slate-200 dark:border-slate-700 flex items-center gap-4 animate-slideUp shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
                  <button className="bg-red-100 text-red-500 border-none w-9 h-9 rounded-full cursor-pointer flex items-center justify-center text-lg transition-colors hover:bg-red-200" onClick={() => {setAudioPreview(null); setRecordedBase64(null);}} title="Discard Recording"><X size={18} /></button>
                  <audio src={audioPreview} controls style={{flex: 1, height: '35px'}} />
                  <button className="bg-[#0a4db8] text-white border-none w-[45px] h-[45px] rounded-full cursor-pointer flex items-center justify-center transition-colors hover:bg-[#083d91] shrink-0" onClick={handleConfirmSendAudio}><Send size={18} /></button>
                </div>
              )}

              <div className="p-5 bg-white dark:bg-slate-800 flex gap-3 items-center border-t border-slate-100 dark:border-slate-700">
                <input 
                  value={reply} 
                  onChange={(e) => setReply(e.target.value)} 
                  className="flex-1 p-[14px_20px] border border-slate-200 dark:border-slate-600 rounded-full outline-none bg-slate-50 dark:bg-slate-900 text-[0.95rem] text-slate-800 dark:text-slate-100 focus:border-[#0a4db8] transition-colors" placeholder="Type medical advice..." 
                  onKeyDown={(e) => e.key === 'Enter' && sendReply()} 
                />
                <button className={`bg-slate-100 dark:bg-slate-700 border-none text-[20px] cursor-pointer p-2.5 rounded-full transition-all flex items-center justify-center shrink-0 ${isRecording ? "bg-red-100 text-red-500 animate-pulse" : "text-slate-600 dark:text-slate-300"}`} onClick={isRecording ? stopRecording : startRecording}>
                  {isRecording ? <Square size={20} fill="currentColor" color="#ef4444" /> : <Mic size={20} />}
                </button>
                <button onClick={sendReply} className="bg-[#0a4db8] text-white border-none w-[45px] h-[45px] rounded-full cursor-pointer flex items-center justify-center transition-colors hover:bg-[#083d91] shrink-0"><Send size={18} /></button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default DoctorPanel;