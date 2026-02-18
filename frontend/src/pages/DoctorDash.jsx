import { useState, useEffect } from "react";
import io from "socket.io-client";
const API_BASE = process.env.REACT_APP_API || "https://healthai-hub.onrender.com";
const socket = io(API_BASE);

function DoctorDash({ doctorId }) {
  const [incoming, setIncoming] = useState(false);
  const roomId = `${doctorId}-consult`;

  const acceptConsult = () => {
    socket.emit("join_consultation", roomId);
    setIncoming(true);
  };

  return (
    <div className="doctor-dash">
      <h1>Doctor Portal</h1>
      <button onClick={acceptConsult}>Go Online</button>
      
      {incoming && (
        <div className="live-chat-box">
          {/* Reuse the same Chat Window UI from Doctors.jsx */}
          <h3>Active Patient Consultation</h3>
          {/* Chat Logic Here */}
        </div>
      )}
    </div>
  );
}