import { useState } from "react";
import io from "socket.io-client";


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
    <div className="flex flex-col items-center justify-center text-center min-h-[80vh] p-[40px_20px] font-sans bg-slate-50 dark:bg-slate-900 transition-colors">
      <h2 className="text-[2rem] text-slate-800 dark:text-slate-100 mb-[30px] font-bold">🚨 Emergency SOS</h2>
      
      {!showForm && !alertSent && (
        <button className="w-[200px] h-[200px] rounded-full border-none bg-gradient-to-br from-red-500 to-red-600 text-white text-[1.4rem] font-extrabold cursor-pointer relative tracking-[1px] shadow-[0_8px_30px_rgba(239,68,68,0.4)] transition-transform hover:scale-105 animate-[sosPulse_2s_ease-in-out_infinite]" onClick={handleInitialClick}>SEND SOS ALERT</button>
      )}

      {showForm && (
        <form className="flex flex-col gap-[14px] w-full max-w-[380px] mt-[20px]" onSubmit={handleSendSOS}>
          <input className="p-[14px_18px] rounded-xl border border-slate-200 dark:border-slate-700 text-[1rem] bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none transition-colors focus:border-red-500" 
            type="text" placeholder="Your Name" required
            value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} 
          />
          <input className="p-[14px_18px] rounded-xl border border-slate-200 dark:border-slate-700 text-[1rem] bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none transition-colors focus:border-red-500" 
            type="tel" placeholder="Phone Number" required
            value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} 
          />
          <button type="submit" className="p-[16px] border-none rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white text-[1.05rem] font-bold cursor-pointer shadow-[0_4px_20px_rgba(239,68,68,0.3)] transition-all hover:-translate-y-[2px] hover:shadow-[0_8px_25px_rgba(239,68,68,0.4)] disabled:opacity-70 disabled:cursor-not-allowed" disabled={loading}>
            {loading ? "FETCHING LOCATION..." : "CONFIRM EMERGENCY"}
          </button>
        </form>
      )}

      {alertSent && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] p-[30px] mt-[20px] max-w-[380px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] text-slate-800 dark:text-slate-100">
          <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-[1.1rem] mb-[16px]">✅ Alert sent! Doctors have your name and number.</p>
          <button className="p-[10px_24px] border border-slate-200 dark:border-slate-700 rounded-[10px] bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer font-semibold transition-all hover:bg-slate-50 dark:hover:bg-slate-700" onClick={() => setAlertSent(false)}>Reset</button>
        </div>
      )}
    </div>
  );
}
export default Emergency;