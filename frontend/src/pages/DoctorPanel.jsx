import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./DoctorPanel.css";

const socket = io.connect("http://localhost:5000");

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
        if (data.sender === "Patient") {
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
    try {
      const res = await fetch(`http://localhost:5000/api/doctors/approved`);
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
      const res = await fetch("http://localhost:5000/api/reports/submit", {
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
    <div className="pro-panel-layout">
      {/* 🚨 UPDATED EMERGENCY BANNER */}
      {emergencyAlert && (
        <div className="emergency-notification-banner" style={{
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
          <div className="banner-content" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <span className="blink-icon" style={{ fontSize: '2.5rem' }}>🚨</span>
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
      style={{ color: '#2563eb', fontWeight: 'bold', textDecoration: 'underline' }}
    >
      📍 Open in Google Maps
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
              style={{ padding: '12px 24px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              📞 CALL NOW
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

      <div className="main-command-center">
        
        {/* --- LEFT COLUMN: APPOINTMENT TABLE --- */}
        <div className="column-left appointments-section">
          <div className="section-card">
            <div className="card-header-pro">
              <h3>Today's Appointments</h3>
              <span className="count-badge">{appointmentsCount} Patients</span>
            </div>
            
            <div className="queue-action-box">
              <p>Current Token: <strong>{doctorInfo?.currentLiveToken || 0}</strong></p>
              <button className="next-btn-pro" onClick={handleNextPatient}>
                  CALL NEXT PATIENT
              </button>
            </div>

            <div className="appointment-table-container">
              <table className="appt-table">
                <thead>
                  <tr>
                    <th>Token</th>
                    <th>Patient</th>
                    <th>Issue</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="active-row">
                    <td><strong>#1</strong></td>
                    <td>Ankita</td>
                    <td>Fever/Headache</td>
                    <td><span className="status-tag live">Live Now</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: CHAT INTERFACE --- */}
        <div className="column-right chat-section">
          <div className="chat-container-pro">
            <div className="chat-sidebar-pro">
              <h4>Patient Chats</h4>
              <div className="chat-patient-item active">
                <div className="avatar">A</div>
                <div className="chat-meta">
                  <p className="chat-name">Ankita</p>
                  <p className="chat-preview">Fever and...</p>
                </div>
              </div>
            </div>

            <div className="chat-window-pro">
              <header className="chat-header-pro">
                <div className="patient-status">
                  <strong>Ankita</strong> 🟢 <span style={{fontSize: '12px', color: '#64748b'}}>Online</span>
                </div>
                <button className="report-btn-subtle" onClick={handleReportClick}>
                  🚫 Report
                </button>
              </header>

              <div className="message-list-pro">
                {messages.map((m, i) => (
                  <div key={i} className={`msg-row ${m.sender === doctorName ? "right" : "left"}`}>
                    <div className="msg-bubble-pro">
                      {m.audio ? <audio controls src={m.audio} /> : <p>{m.message}</p>}
                      <span className="msg-time">{m.time}</span>
                    </div>
                  </div>
                ))}
                {isPatientTyping && <div className="typing-indicator">Patient is typing...</div>}
                <div ref={chatEndRef} />
              </div>

              {/* ✅ Audio Preview with Discard Option */}
              {audioPreview && (
                <div className="audio-preview-overlay">
                  <button className="delete-mic-btn" onClick={() => {setAudioPreview(null); setRecordedBase64(null);}} title="Discard Recording">✕</button>
                  <audio src={audioPreview} controls style={{flex: 1, height: '35px'}} />
                  <button className="pro-send-btn" onClick={handleConfirmSendAudio}>➤</button>
                </div>
              )}

              <div className="input-area-pro">
                <input 
                  value={reply} 
                  onChange={(e) => setReply(e.target.value)} 
                  placeholder="Type medical advice..." 
                  onKeyDown={(e) => e.key === 'Enter' && sendReply()} 
                />
                <button className={`pro-mic-btn ${isRecording ? "recording" : ""}`} onClick={isRecording ? stopRecording : startRecording}>
                  {isRecording ? "🛑" : "🎤"}
                </button>
                <button onClick={sendReply} className="pro-send-btn">➤</button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default DoctorPanel;