import { useState } from "react";
import io from "socket.io-client";
import "./Emergency.css";

const API_BASE = process.env.REACT_APP_API || "https://healthai-hub.onrender.com";
const socket = io(API_BASE);

function Emergency() {
  const [alertSent, setAlertSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "" });

  const handleInitialClick = () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setFormData({ ...formData, name: user.name || "" });
    }
    setShowForm(true);
  };

  const handleSendSOS = (e) => {
    e.preventDefault();
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        emitSOS(position.coords.latitude, position.coords.longitude);
      },
      () => {
        emitSOS(null, null); // Send even if location fails
      }
    );
  };

  const emitSOS = (lat, lng) => {
    const googleMapsLink = lat 
    ? `https://www.google.com/maps?q=${lat},${lng}` 
    : "Location Unknown";

  const sosData = {
    patientName: formData.name,
    patientPhone: formData.phone,
    locationLink: googleMapsLink, // Coordinates ki jagah Link bhejo
    time: new Date().toLocaleTimeString(),
  };

    socket.emit("send_emergency_sos", sosData);
    setAlertSent(true);
    setLoading(false);
    setShowForm(false);
  };

  return (
    <div className="emergency-container">
      <h2>🚨 Emergency SOS</h2>
      
      {!showForm && !alertSent && (
        <button className="sos-btn" onClick={handleInitialClick}>SEND SOS ALERT</button>
      )}

      {showForm && (
        <form className="emergency-form" onSubmit={handleSendSOS}>
          <input 
            type="text" placeholder="Your Name" required
            value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} 
          />
          <input 
            type="tel" placeholder="Phone Number" required
            value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} 
          />
          <button type="submit" className="confirm-btn" disabled={loading}>
            {loading ? "FETCHING LOCATION..." : "CONFIRM EMERGENCY"}
          </button>
        </form>
      )}

      {alertSent && (
        <div className="alert-box">
          <p>✅ Alert sent! Doctors have your name and number.</p>
          <button onClick={() => setAlertSent(false)}>Reset</button>
        </div>
      )}
    </div>
  );
}
export default Emergency;