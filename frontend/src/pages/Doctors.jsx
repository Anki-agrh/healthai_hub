import { useState, useEffect, useRef } from "react";
import { Star, Calendar, Bot, Flag, Mic, Square, Send, X } from "lucide-react";
import io from "socket.io-client";


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


  if (loading) return <div className="text-center text-slate-500 py-[40px] font-semibold text-[1.1rem]">Searching for specialists...</div>;

  const filteredDoctors = doctors.filter(doc => 
    doc.name.toLowerCase().includes(filter.toLowerCase()) || 
    doc.specialization?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="max-w-[1200px] mx-auto py-10 px-5">
      <h2 className="text-center text-[2rem] font-bold text-slate-800 dark:text-slate-100 mb-8">Verified Specialists</h2>
      <div className="flex justify-center mb-10">
        <input 
          type="text" 
          placeholder="Search..." 
          className="w-full max-w-[600px] px-5 py-3 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm focus:outline-none focus:border-accent transition-colors" 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)} 
        />
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-[25px] md:grid-cols-1">
        {filteredDoctors.map((doc) => (
          <div key={doc._id} className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden flex flex-col text-slate-800 dark:text-slate-100 border-2 border-[#71b1ff] shadow-[6px_6px_0px_#71b1ff] md:shadow-[4px_4px_0px_#71b1ff] transition-transform hover:-translate-y-1">
            <div className="relative h-[250px]">
              <img 
                src={doc.image ? `${API_BASE}/uploads/${doc.image}` : "/assets/doc1.jpg"}
                alt={doc.name} 
                className="w-full h-full object-cover object-top" 
              />
              <div className="absolute bottom-2.5 left-2.5 bg-[#00d293] text-white px-2.5 py-1 rounded-md font-bold text-sm shadow-sm" style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                <Star size={14} fill="currentColor" /> {doc.averageRating || "4.8"}
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <span className="text-[#71b1ff] text-[0.8rem] font-bold uppercase tracking-wider mb-2">{doc.specialization}</span>
              <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[0.8rem] px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 mb-2.5 border border-emerald-200 dark:border-emerald-800 self-start">
                <span className="text-emerald-500 animate-pulse">●</span> 
                <strong>Live Queue:</strong> {doc.queueLength || 0} Patients Waiting
              </div>
              <h3>{doc.name}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-[0.85rem] mt-1">{doc.degree} • {doc.experience} Years Exp.</p>
              <p className="text-sm mt-2 font-medium">
 {doc.hospitalName}<br/>
<span style={{fontSize:"12px",color:"var(--text-secondary, #666)"}}>{doc.hospitalAddress}, {doc.city}</span>
</p>

            </div>
            <div className="flex border-t border-slate-100 dark:border-slate-700">
              <button className="flex-1 p-4 border-none cursor-pointer font-semibold bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => openBookingModal(doc)}>Book Token</button>
              <button className="flex-1 p-4 border-none cursor-pointer font-semibold bg-[#0a4db8] text-white hover:bg-accent-hover transition-colors" onClick={() => startConsultation(doc)}>Consult</button>
            </div>
          </div>
        ))}
      </div>

      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[2000] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-[450px] p-[35px] md:p-[25px] relative shadow-[0_20px_40px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-100 pointer-events-auto">
            <button className="absolute top-[15px] right-[20px] bg-transparent border-none text-[2rem] text-[#71b1ff] cursor-pointer transition-all hover:text-red-500 hover:rotate-90 z-10" onClick={() => setShowBookingModal(false)}>×</button>
            <div className="animate-fadeIn">
              <div className="text-center mb-[10px]">
                <span className="inline-block text-[2.5rem] mb-[10px] animate-[float_3s_ease-in-out_infinite]"><Calendar size={32} color="#0a4db8" /></span>
                <p>Book Appointment with <strong>{selectedDoc?.name}</strong></p>
              </div>
              <div className="flex flex-col gap-[12px]">
                <input type="text" placeholder="Patient Full Name" className="w-full p-[15px] border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-slate-800 dark:text-slate-100 outline-none focus:border-[#71b1ff] transition-colors" value={bookingData.patientName} onChange={(e) => setBookingData({...bookingData, patientName: e.target.value})} />
                <input type="text" placeholder="Phone Number" className="w-full p-[15px] border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-slate-800 dark:text-slate-100 outline-none focus:border-[#71b1ff] transition-colors" value={bookingData.phoneNumber} onChange={(e) => setBookingData({...bookingData, phoneNumber: e.target.value})} />
                <textarea placeholder="Describe your health problem..." className="w-full h-[120px] p-[15px] border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-slate-800 dark:text-slate-100 outline-none focus:border-[#71b1ff] transition-colors resize-none" value={bookingData.problem} onChange={(e) => setBookingData({...bookingData, problem: e.target.value})} />
                <input type="date" className="w-full p-[15px] border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-slate-800 dark:text-slate-100 outline-none focus:border-[#71b1ff] transition-colors" value={bookingData.date} onChange={(e) => setBookingData({...bookingData, date: e.target.value})} />
                <button onClick={submitBooking} className="flex-[2] w-full bg-[#0a4db8] text-white p-[12px] rounded-xl font-bold border-none cursor-pointer hover:bg-[#083d91] transition-colors">Confirm & Get Token</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {chatStep > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[2000] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-[450px] p-[35px] md:p-[25px] relative shadow-[0_20px_40px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-100 pointer-events-auto">
            <button className="absolute top-[15px] right-[20px] bg-transparent border-none text-[2rem] text-[#71b1ff] cursor-pointer transition-all hover:text-red-500 hover:rotate-90 z-10" onClick={closeModal}>×</button>
            {chatStep === 1 && (
              <div className="animate-fadeIn">
                <div className="text-center mb-[10px]">
                  <span className="inline-block text-[2.5rem] mb-[10px] animate-[float_3s_ease-in-out_infinite]"><Bot size={32} color="#0a4db8" /></span>
                  <p>Connect with <strong>{selectedDoc?.name}</strong>?</p>
                </div>
                <textarea className="w-full h-[120px] p-[15px] border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-slate-800 dark:text-slate-100 outline-none focus:border-[#71b1ff] transition-colors resize-none" placeholder="Describe symptoms..." value={symptoms} onChange={(e) => setSymptoms(e.target.value)} />
                  {scheduleMode && (
  <div className="mt-4 flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
    <h4>Schedule {scheduleMode} consultation</h4>

    <input
      type="date"
      className="w-full p-[15px] border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-slate-800 dark:text-slate-100 outline-none focus:border-[#71b1ff] transition-colors"
      value={scheduleDate}
      onChange={(e)=>setScheduleDate(e.target.value)}
    />

    <input
      type="time"
      className="w-full p-[15px] border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-slate-800 dark:text-slate-100 outline-none focus:border-[#71b1ff] transition-colors"
      value={scheduleTime}
      onChange={(e)=>setScheduleTime(e.target.value)}
    />

    <button className="flex-[2] w-full bg-[#0a4db8] text-white p-[12px] rounded-xl font-bold border-none cursor-pointer hover:bg-[#083d91] transition-colors" onClick={scheduleConsult}>
      Confirm Schedule
    </button>
  </div>
)}

                <div className="flex flex-col gap-[15px] mt-[20px]">
                  <div className="flex items-center p-[15px] bg-slate-50 dark:bg-slate-900/50 rounded-2xl cursor-pointer transition-all border-2 border-transparent hover:scale-[1.03] hover:bg-white dark:hover:bg-slate-800 hover:border-[#71b1ff] hover:shadow-[0_10px_20px_rgba(113,177,255,0.1)] text-slate-800 dark:text-slate-100" onClick={() => handleModeSelection("Chat")}><span>Live Chat</span></div>
                  <div className="flex items-center p-[15px] bg-slate-50 dark:bg-slate-900/50 rounded-2xl cursor-pointer transition-all border-2 border-transparent hover:scale-[1.03] hover:bg-white dark:hover:bg-slate-800 hover:border-[#71b1ff] hover:shadow-[0_10px_20px_rgba(113,177,255,0.1)] text-slate-800 dark:text-slate-100" onClick={() => {
                    setScheduleMode("voice");
                  }}> <span>Voice Call</span></div>
                  <div className="flex items-center p-[15px] bg-slate-50 dark:bg-slate-900/50 rounded-2xl cursor-pointer transition-all border-2 border-transparent hover:scale-[1.03] hover:bg-white dark:hover:bg-slate-800 hover:border-[#71b1ff] hover:shadow-[0_10px_20px_rgba(113,177,255,0.1)] text-slate-800 dark:text-slate-100" onClick={() => {
                    setScheduleMode("video");
                  }}> <span>Video Call</span></div>
                </div>
              </div>
            )}
            {chatStep === 2 && (
              <div className="animate-slideUp flex flex-col h-[600px] max-h-[85vh]">
                <div className="flex justify-between items-center pb-[10px] border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-[8px]"><div className="w-[10px] h-[10px] bg-[#00d293] rounded-full"></div><h4>{selectedDoc?.name}</h4></div>
                  <div className="flex items-center gap-[10px]">
                    <button className="text-red-500 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-[0.75rem] font-semibold border-none cursor-pointer transition-colors" onClick={handleReportClick} style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                      <Flag size={14} /> Report
                    </button>
                    <span className="bg-accent/10 text-accent px-[8px] py-[4px] rounded text-[0.75rem] font-bold uppercase">{consultMode}</span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-[15px] flex flex-col gap-[12px] bg-[#f8fafc] dark:bg-slate-900/30">
                  {messages.map((msg, i) => (
                    <div key={i} className={`max-w-[80%] p-[12px] rounded-2xl relative ${msg.sender === "Patient" ? "self-end bg-[#0a4db8] text-white rounded-br-sm" : "self-start bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-sm shadow-sm border border-slate-100 dark:border-slate-600"}`}>
                      {msg.audio ? <audio controls src={msg.audio} className="max-w-[100%] h-[35px] mt-[5px]" /> : <p>{msg.message}</p>}
                      <span className="text-[0.65rem] opacity-70 mt-[4px] block text-right">{msg.time}</span>
                    </div>
                  ))}
                  {isTyping && <div className="text-slate-400 text-[0.85rem] animate-pulse">...</div>}
                  <div ref={chatEndRef} />
                </div>

                {isRecording && (
                  <div className="flex items-center gap-[8px] text-red-500 font-bold mb-[10px] animate-fadeIn">
                    <div className="w-[12px] h-[12px] bg-red-500 rounded-full animate-pulse shadow-[0_0_0_rgba(220,53,69,0.4)]"></div>
                    <span>Recording Audio...</span>
                  </div>
                )}
                {audioPreview && (
                  <div className="bg-[#f8f9fa] dark:bg-slate-800 p-[12px] border-t-2 border-[#007bff] flex flex-col items-center gap-[8px] rounded-lg mb-[8px]">
                    <audio src={audioPreview} controls />
                    <button onClick={cancelRecording} style={{display: 'flex', alignItems:'center', gap:'5px'}}><X size={16} /> Cancel</button>
                    <button onClick={handleConfirmSendAudio} style={{display: 'flex', alignItems:'center', gap:'5px'}}><Send size={16} /> Send</button>
                  </div>
                )}
                <div className="flex gap-[10px] p-[15px] border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 mt-auto" style={{display: 'flex', gap: '10px'}}>
                  <input type="text" value={currentMsg} onChange={handleTyping} onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
                  <button onClick={isRecording ? stopRecording : startRecording} style={{padding: '10px'}}>
                    {isRecording ? <Square size={20} fill="currentColor" color="var(--danger, #ef4444)" /> : <Mic size={20} />}
                  </button>
                  <button onClick={() => sendMessage()} style={{padding: '10px'}}><Send size={20} /></button>
                </div>
                <button className="w-full bg-[#0a4db8] hover:bg-[#083d91] text-white p-[15px] font-bold border-none cursor-pointer transition-colors mt-[10px] rounded-b-xl" onClick={() => setChatStep(3)}>End & Rate</button>
              </div>
            )}
            {chatStep === 3 && (
              <div className="text-center p-[20px]">
                <h3>Rate your experience</h3>
                <div className="flex gap-[10px] justify-center my-[20px]">
                  {[1,2,3,4,5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      className={`text-[34px] bg-transparent border-none cursor-pointer transition-all hover:scale-125 hover:text-[#ffd700] ${userRating >= s ? "text-[#ffc107]" : "text-[#cfcfcf]"}`}
                      onClick={() => setUserRating(s)}
                    >
                      <Star size={34} fill={userRating >= s ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>

                <button onClick={closeModal} className="w-full bg-[#0a4db8] hover:bg-[#083d91] text-white p-[12px] rounded-xl font-bold border-none cursor-pointer transition-colors">Submit</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Doctors;