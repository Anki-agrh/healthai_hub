import { useState, useEffect, useRef } from "react";
import { Star, Calendar, Bot, Flag, Mic, Square, Send, X, ShieldCheck, Search, CheckCircle2, MapPin } from "lucide-react";
import io from "socket.io-client";


const API_BASE = process.env.REACT_APP_API || "https://healthai-hub.onrender.com";
const socket = io(API_BASE);

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [filter, setFilter] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
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
  const [scheduledMeet, setScheduledMeet] = useState(null);

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
    setScheduledMeet({
      link: data.meetLink,
      doctor: selectedDoc?.name || "Specialist",
      date: scheduleDate,
      time: scheduleTime,
      mode: scheduleMode
    });
    setScheduleMode(null);
    setScheduleTime("");
    setChatStep(0);
  } else {
    alert("Failed to schedule meeting");
  }
};


  if (loading) return <div className="text-center text-slate-500 py-[40px] font-semibold text-[1.1rem]">Searching for specialists...</div>;

  const specialties = ["All", "Cardiologist", "Neurologist", "Pediatrician", "Dermatologist"];

  const getDoctorImage = (doc) => {
    if (doc?.image) {
      if (doc.image.startsWith("http://") || doc.image.startsWith("https://")) {
        return doc.image;
      }
      return `${API_BASE}/uploads/${doc.image}`;
    }
    return "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500&q=80&fit=crop";
  };

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(filter.toLowerCase()) || 
      doc.specialization?.toLowerCase().includes(filter.toLowerCase()) ||
      doc.hospitalName?.toLowerCase().includes(filter.toLowerCase());
    const matchesSpecialty = selectedSpecialty === "All" || 
      doc.specialization?.toLowerCase() === selectedSpecialty.toLowerCase();
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="max-w-[1300px] mx-auto py-8 px-4 sm:px-6">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent mb-3">
          <ShieldCheck size={14} /> Verified Medical Professionals
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Find & Consult Top Specialists
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Book instant tokens for queue bypass or connect directly via HD Live Chat, Voice, & Video.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 max-w-4xl mx-auto">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by doctor name, specialty, or hospital..." 
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm transition-all" 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)} 
          />
        </div>

        {/* Specialty Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
          {specialties.map(spec => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSpecialty === spec
                  ? "bg-accent text-white shadow-md shadow-accent/25"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-accent/40"
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {filteredDoctors.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400 font-medium">No doctors found matching your criteria.</p>
          <button 
            onClick={() => { setFilter(""); setSelectedSpecialty("All"); }}
            className="mt-3 text-xs font-semibold text-accent hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDoctors.map((doc) => (
            <div 
              key={doc._id} 
              className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              {/* Doctor Image Container */}
              <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
                <img 
                  src={getDoctorImage(doc)}
                  alt={doc.name} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500&q=80&fit=crop";
                  }}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

                {/* Rating Badge */}
                <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-800 dark:text-slate-100 px-2.5 py-1 rounded-lg text-xs font-bold shadow-md flex items-center gap-1">
                  <Star size={13} className="text-amber-400 fill-amber-400" />
                  <span>{doc.averageRating || "4.8"}</span>
                </div>

                {/* Queue status badge */}
                <div className="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <span>{doc.queueLength ? `${doc.queueLength} in queue` : "Available Now"}</span>
                </div>

                {/* Doctor Name on Image Overlay */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="font-bold text-base leading-snug drop-shadow-sm flex items-center gap-1.5">
                    {doc.name}
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  </h3>
                  <p className="text-xs text-white/90 font-medium">
                    {doc.degree || "MBBS, MD"} • {doc.experience || 5}+ yrs exp
                  </p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-accent/10 text-accent">
                      {doc.specialization}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                      MCI Verified
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-1 flex items-center gap-1 mb-1">
                    <MapPin size={12} className="text-slate-400 shrink-0" />
                    <span>{doc.hospitalName || "General Hospital"}</span>
                  </p>

                  {(doc.hospitalAddress || doc.city) && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 pl-4 line-clamp-1">
                      {[doc.hospitalAddress, doc.city].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                  <button 
                    onClick={() => openBookingModal(doc)}
                    className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors text-center"
                  >
                    Book Token
                  </button>
                  <button 
                    onClick={() => startConsultation(doc)}
                    className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-accent hover:bg-accent-hover text-white transition-all shadow-sm shadow-accent/30 text-center flex items-center justify-center gap-1"
                  >
                    <span>Consult</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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

      {/* Scheduled Consultation Confirmation Modal */}
      {scheduledMeet && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[2500] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-[460px] p-6 text-center shadow-2xl border border-slate-200 dark:border-slate-700 animate-fadeIn relative">
            <button
              onClick={() => setScheduledMeet(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xl font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              ✕
            </button>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Consultation Scheduled!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Confirmed with <strong>{scheduledMeet.doctor}</strong> for {scheduledMeet.date} at {scheduledMeet.time}.
            </p>

            <div className="my-5 p-4 rounded-2xl bg-blue-50 dark:bg-slate-900 border border-blue-100 dark:border-slate-700 text-left">
              <span className="text-[11px] font-bold text-accent uppercase tracking-wider block mb-1">
                Your Direct Video Room
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-mono break-all select-all">
                {scheduledMeet.link}
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <a
                href={scheduledMeet.link}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold text-sm shadow-lg shadow-accent/25 transition-all inline-block no-underline"
              >
                📹 Join Video Consultation Now
              </a>
              <button
                onClick={() => setScheduledMeet(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
              >
                Close (Link also sent to your Gmail)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Doctors;