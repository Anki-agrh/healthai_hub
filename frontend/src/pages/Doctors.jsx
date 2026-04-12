import { useState, useEffect, useRef } from "react";
import { Star, Calendar, Bot, Flag, Mic, Square, Send, X } from "lucide-react";
import io from "socket.io-client";
import "./Doctors.css";

const API_BASE = process.env.REACT_APP_API || "https://healthai-hub.onrender.com";
const socket = io(API_BASE);

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedDoc, setSelectedDoc] = useState(null);
  const [chatStep, setChatStep] = useState(0); 
  const [consultMode, setConsultMode] = useState("");
  const [symptoms, setSymptoms] = useState("");
  
  const [messages, setMessages] = useState([]);
  const [currentMsg, setCurrentMsg] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [audioPreview, setAudioPreview] = useState(null);
  const [recordedBase64, setRecordedBase64] = useState(null);

  
  // ✅ FIXED: Corrected ref declarations
  const mediaRecorder = useRef(null); 
  const audioChunks = useRef([]);

  const [userRating, setUserRating] = useState(0);

  // --- ✅ BOOKING STATES ---
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    patientName: "",
    phoneNumber: "",
    problem: "",
    date: new Date().toISOString().split('T')[0]
  });

  const [scheduleMode, setScheduleMode] = useState(null);
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchDoctors = async () => {
    const API_BASE = process.env.REACT_APP_API || "https://healthai-hub.onrender.com";
    try {
      const response = await fetch(`${API_BASE}/api/doctors/approved`);
      const data = await response.json();
      if (data.success) {
        setDoctors(data.doctors);
      }
    } catch (error) { 
      console.error("Fetch error:", error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchDoctors();
    socket.on("queue_updated", (data) => {
      // data should contain { doctorId, newQueueLength }
      setDoctors((prevDoctors) =>
        prevDoctors.map((doc) =>
          doc._id === data.doctorId 
            ? { ...doc, queueLength: data.newQueueLength } 
            : doc
        )
      );
    });

    socket.on("receive_message", (data) => {
      // ✅ Allow messages from Doctor to appear in Patient UI
      if (data.sender !== "Patient") {
        setMessages((prev) => [...prev, data]);
        setIsTyping(false);
      }
    });
    
    socket.on("display_typing", (data) => setIsTyping(data.typing));

    return () => {
      socket.off("queue_updated");
      socket.off("receive_message");
      socket.off("display_typing");
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const openBookingModal = (doc) => {
  const userStr = localStorage.getItem("user");

  if (!userStr) {
    alert("Please login first to book appointment");
    window.location.href = "/login";
    return;
  }

  setSelectedDoc(doc);
  setShowBookingModal(true);
};


  const submitBooking = async () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return alert("Please login to book a token!");

    if (!bookingData.patientName || !bookingData.phoneNumber || !bookingData.problem) {
      alert("Please fill all details!");
      return;
    }

    const loggedInUser = JSON.parse(userStr);
    if (!loggedInUser.email) return alert("Email not found. Please re-login.");

    const finalData = {
      doctorId: selectedDoc._id,
      patientId: loggedInUser._id || loggedInUser.id,
      patientEmail: loggedInUser.email, 
      ...bookingData
    };

    try {
      const res = await fetch(`${API_BASE}/api/appointments`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(finalData),
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ Success! Token #${data.tokenNumber} sent to ${loggedInUser.email}`);
        setShowBookingModal(false);
        setBookingData({ 
          patientName: "", phoneNumber: "", problem: "", 
          date: new Date().toISOString().split('T')[0] 
        });
        fetchDoctors(); 
      } else {
        alert(`Booking failed: ${data.message || "Unknown Error"}`);
      }
    } catch (err) {
      alert("Network error: Is the backend server running?");
    }
  };

  const handleReportClick = async () => {
    const reason = prompt("Reason for report:");
    if (!reason) return;
    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    const reportData = {
      reporterId: loggedInUser._id,
      reportedUserId: selectedDoc?._id,
      roomId: `${selectedDoc._id}-consult`,
      reason: reason,
      chatTranscript: messages 
    };
    try {
      const res = await fetch(`${API_BASE}/api/reports/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData)
      });
      const data = await res.json();
      if (data.success) alert("Reported successfully.");
    } catch (err) { alert("Report failed."); }
  };

  // ✅ FIXED: Using .current for all mediaRecorder calls
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = (e) => { 
        if (e.data.size > 0) audioChunks.current.push(e.data); 
      };
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
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
    }
    setIsRecording(false);
  };

  const handleConfirmSendAudio = () => {
    if (recordedBase64) {
      const messageData = {
        roomId: `${selectedDoc._id}-consult`, 
        sender: "Patient", 
        message: "🎤 Voice Note",
        audio: recordedBase64, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      socket.emit("send_message", messageData);
      setMessages((prev) => [...prev, messageData]);
      setAudioPreview(null); 
      setRecordedBase64(null);
    }
  };

  const cancelRecording = () => { setAudioPreview(null); setRecordedBase64(null); };
  const startConsultation = (doc) => {
  const user = localStorage.getItem("user");
  if (!user) {
    alert("Please login to consult doctor");
    return;
  }

  setSelectedDoc(doc);
  setChatStep(1);
};


  const handleModeSelection = (mode) => {
    setConsultMode(mode);
    socket.emit("join_consultation", `${selectedDoc._id}-consult`);
    setChatStep(2);

    // Push precise AI Summary Brief to the room if available
    const savedAiHistory = localStorage.getItem("ai_chat_history");
    if (savedAiHistory) {
      try {
        const history = JSON.parse(savedAiHistory);
        const userMsgs = history.filter(h => h.role === "user").map(h => h.text);
        if (userMsgs.length > 0) {
           const aiSummaryText = "System Auto-Brief: Patient reported symptoms: " + userMsgs.slice(-3).join(", ");
           const summaryPayload = {
             roomId: `${selectedDoc._id}-consult`,
             sender: "System",
             message: aiSummaryText,
             isAiBrief: true,
             time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
           };
           socket.emit("send_message", summaryPayload);
        }
      } catch (e) { console.error(e); }
    }

    if (symptoms.trim() !== "") sendMessage(`Health Brief: ${symptoms}`);
  };

  const sendMessage = (textOverride = null) => {
    const text = textOverride || currentMsg;
    if (text.trim() === "") return;
    const messageData = {
      roomId: `${selectedDoc._id}-consult`, 
      sender: "Patient", 
      message: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    socket.emit("send_message", messageData);
    setMessages((prev) => [...prev, messageData]);
    if (!textOverride) {
      setCurrentMsg("");
      socket.emit("typing", { roomId: `${selectedDoc._id}-consult`, typing: false });
    }
  };

  const handleTyping = (e) => {
    setCurrentMsg(e.target.value);
    socket.emit("typing", { roomId: `${selectedDoc._id}-consult`, typing: e.target.value !== "" });
  };

  const closeModal = () => {
    setChatStep(0); setSelectedDoc(null); setSymptoms(""); setMessages([]);
    setUserRating(0); setAudioPreview(null);
  };

  // ===== SCHEDULE CONSULTATION =====
const scheduleConsult = async () => {

  const userStr = localStorage.getItem("user");
  if (!userStr) {
    alert("Please login first to schedule consultation");
    return;
  }

  const user = JSON.parse(userStr);

  if (!selectedDoc) {
    alert("Doctor not selected");
    return;
  }

  if (!scheduleTime) {
    alert("Please select time");
    return;
  }

  const res = await fetch(`${API_BASE}/api/consult/schedule`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      doctorId: selectedDoc._id,
      patientId: user._id,
      patientEmail: user.email,
      mode: scheduleMode,
      date: scheduleDate,
      time: scheduleTime
    })
  });

  const data = await res.json();

  if(data.success){
    alert("Meeting scheduled! Check your Gmail.");
    setScheduleMode(null);
    setScheduleTime("");
    setChatStep(0);
  } else {
    alert("Failed to schedule meeting");
  }
};


  if (loading) return <div className="loader">Searching for specialists...</div>;

  const filteredDoctors = doctors.filter(doc => 
    doc.name.toLowerCase().includes(filter.toLowerCase()) || 
    doc.specialization?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="doctors-container">
      <h2 className="main-heading">Verified Specialists</h2>
      <div className="search-container">
        <input 
          type="text" 
          placeholder="Search..." 
          className="search-input" 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)} 
        />
      </div>

      <div className="doctor-grid">
        {filteredDoctors.map((doc) => (
          <div key={doc._id} className="doctor-card cuboidal-card">
            <div className="image-wrapper">
              <img 
                src={doc.image ? `${API_BASE}/uploads/${doc.image}` : "/assets/doc1.jpg"}
                alt={doc.name} 
                className="doctor-photo" 
              />
              <div className="rating-tag" style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                <Star size={14} fill="currentColor" /> {doc.averageRating || "4.8"}
              </div>
            </div>
            <div className="card-body">
              <span className="specialty-label">{doc.specialization}</span>
              <div className="live-queue-status">
                <span className="pulse-icon">●</span> 
                <strong>Live Queue:</strong> {doc.queueLength || 0} Patients Waiting
              </div>
              <h3>{doc.name}</h3>
              <p className="sub-text">{doc.degree} • {doc.experience} Years Exp.</p>
              <p className="hospital-text">
 {doc.hospitalName}<br/>
<span style={{fontSize:"12px",color:"var(--text-secondary, #666)"}}>{doc.hospitalAddress}, {doc.city}</span>
</p>

            </div>
            <div className="card-footer">
              <button className="btn-token" onClick={() => openBookingModal(doc)}>Book Token</button>
              <button className="btn-consult" onClick={() => startConsultation(doc)}>Consult</button>
            </div>
          </div>
        ))}
      </div>

      {showBookingModal && (
        <div className="consult-overlay">
          <div className="consult-modal modern-box">
            <button className="absolute-close" onClick={() => setShowBookingModal(false)}>×</button>
            <div className="menu-container fade-in">
              <div className="bot-header">
                <span className="bot-icon"><Calendar size={32} color="#0a4db8" /></span>
                <p>Book Appointment with <strong>{selectedDoc?.name}</strong></p>
              </div>
              <div className="booking-form">
                <input type="text" placeholder="Patient Full Name" className="modern-input" value={bookingData.patientName} onChange={(e) => setBookingData({...bookingData, patientName: e.target.value})} />
                <input type="text" placeholder="Phone Number" className="modern-input" value={bookingData.phoneNumber} onChange={(e) => setBookingData({...bookingData, phoneNumber: e.target.value})} />
                <textarea placeholder="Describe your health problem..." className="modern-textarea" value={bookingData.problem} onChange={(e) => setBookingData({...bookingData, problem: e.target.value})} />
                <input type="date" className="modern-input" value={bookingData.date} onChange={(e) => setBookingData({...bookingData, date: e.target.value})} />
                <button onClick={submitBooking} className="submit-booking-btn">Confirm & Get Token</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {chatStep > 0 && (
        <div className="consult-overlay">
          <div className="consult-modal modern-box">
            <button className="absolute-close" onClick={closeModal}>×</button>
            {chatStep === 1 && (
              <div className="menu-container fade-in">
                <div className="bot-header">
                  <span className="bot-icon"><Bot size={32} color="#0a4db8" /></span>
                  <p>Connect with <strong>{selectedDoc?.name}</strong>?</p>
                </div>
                <textarea className="modern-textarea" placeholder="Describe symptoms..." value={symptoms} onChange={(e) => setSymptoms(e.target.value)} />
                  {scheduleMode && (
  <div className="schedule-box">
    <h4>Schedule {scheduleMode} consultation</h4>

    <input
      type="date"
      className="modern-input"
      value={scheduleDate}
      onChange={(e)=>setScheduleDate(e.target.value)}
    />

    <input
      type="time"
      className="modern-input"
      value={scheduleTime}
      onChange={(e)=>setScheduleTime(e.target.value)}
    />

    <button className="submit-booking-btn" onClick={scheduleConsult}>
      Confirm Schedule
    </button>
  </div>
)}

                <div className="choice-grid">
                  <div className="choice-item" onClick={() => handleModeSelection("Chat")}><span>Live Chat</span></div>
                  <div className="choice-item" onClick={() => {
                    setScheduleMode("voice");
                  }}> <span>Voice Call</span></div>
                  <div className="choice-item" onClick={() => {
                    setScheduleMode("video");
                  }}> <span>Video Call</span></div>
                </div>
              </div>
            )}
            {chatStep === 2 && (
              <div className="live-chat-view slide-up">
                <div className="chat-header">
                  <div className="doc-info"><div className="online-dot"></div><h4>{selectedDoc?.name}</h4></div>
                  <div className="chat-header-actions">
                    <button className="report-btn-danger" onClick={handleReportClick} style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                      <Flag size={14} /> Report
                    </button>
                    <span className="mode-badge">{consultMode}</span>
                  </div>
                </div>
                <div className="chat-messages">
                  {messages.map((msg, i) => (
                    <div key={i} className={`message-bubble ${msg.sender === "Patient" ? "sent" : "received"}`}>
                      {msg.audio ? <audio controls src={msg.audio} className="chat-audio" /> : <p>{msg.message}</p>}
                      <span className="msg-time">{msg.time}</span>
                    </div>
                  ))}
                  {isTyping && <div className="typing-dots">...</div>}
                  <div ref={chatEndRef} />
                </div>

                {isRecording && (
                  <div className="recording-status fade-in">
                    <div className="pulse-red"></div>
                    <span>Recording Audio...</span>
                  </div>
                )}
                {audioPreview && (
                  <div className="audio-preview-bar">
                    <audio src={audioPreview} controls />
                    <button onClick={cancelRecording} style={{display: 'flex', alignItems:'center', gap:'5px'}}><X size={16} /> Cancel</button>
                    <button onClick={handleConfirmSendAudio} style={{display: 'flex', alignItems:'center', gap:'5px'}}><Send size={16} /> Send</button>
                  </div>
                )}
                <div className="chat-input-area" style={{display: 'flex', gap: '10px'}}>
                  <input type="text" value={currentMsg} onChange={handleTyping} onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
                  <button onClick={isRecording ? stopRecording : startRecording} style={{padding: '10px'}}>
                    {isRecording ? <Square size={20} fill="currentColor" color="var(--danger, #ef4444)" /> : <Mic size={20} />}
                  </button>
                  <button onClick={() => sendMessage()} style={{padding: '10px'}}><Send size={20} /></button>
                </div>
                <button className="end-session-btn" onClick={() => setChatStep(3)}>End & Rate</button>
              </div>
            )}
            {chatStep === 3 && (
              <div className="rating-container">
                <h3>Rate your experience</h3>
                <div className="star-rating">
                  {[1,2,3,4,5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      className={`star ${userRating >= s ? "active" : ""}`}
                      onClick={() => setUserRating(s)}
                    >
                      <Star size={34} fill={userRating >= s ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>

                <button onClick={closeModal} className="submit-rating-btn">Submit</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Doctors;