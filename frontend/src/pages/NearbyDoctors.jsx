import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const API = process.env.REACT_APP_API || "https://healthai-hub.onrender.com";

// ✅ Essential: Fixing the default Leaflet icon path issue
const doctorIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2785/2785482.png',
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
});

function ChangeView({ center }) {
  const map = useMap();
  map.setView(center, 14);
  return null;
}

const NearbyDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState("");
  const [mapCenter, setMapCenter] = useState([26.8467, 80.9462]); // Default: Lucknow

  // ✅ Route through backend to avoid CORS issues with Overpass API
  const searchHealthcare = async (lat, lon) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/doctors/nearby?lat=${lat}&lng=${lon}`);
      const data = await res.json();
      if (data.success) {
        setDoctors(data.doctors || []);
      } else {
        alert("No healthcare facilities found nearby.");
      }
    } catch (err) {
      console.error("Search error:", err);
      alert("Error fetching live medical data.");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      setMapCenter([latitude, longitude]);
      searchHealthcare(latitude, longitude);
    }, () => alert("GPS access denied. Use manual search."));
  };

  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!city) return;
    setLoading(true);
    try {
      // ✅ Route geocoding through backend to avoid CORS
      const res = await fetch(`${API}/api/doctors/nearby?city=${encodeURIComponent(city)}`);
      const data = await res.json();
      if (data.success && data.doctors && data.doctors.length > 0) {
        // Update map center from first result's coordinates
        if (data.center) {
          setMapCenter([data.center.lat, data.center.lng]);
        } else if (data.doctors.length > 0) {
          setMapCenter([data.doctors[0].lat, data.doctors[0].lng]);
        }
        setDoctors(data.doctors);
      } else {
        alert(data.message || "No medical facilities found nearby in this area.");
        setDoctors([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      alert(`Search failed. Make sure backend is running. Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto my-[20px] p-[20px] bg-slate-50 dark:bg-slate-900 transition-colors">
      <h2 className="text-[#0a4db8] text-center mb-5 font-bold text-3xl">Live Healthcare Locator</h2>
      
      <div className="flex flex-col md:flex-row gap-[25px] h-auto md:h-[75vh]">
        {/* Search Panel */}
        <div className="flex-1 bg-white dark:bg-slate-800 p-[20px] rounded-[15px] shadow-[0_4px_15px_rgba(0,0,0,0.1)] overflow-y-auto border border-slate-200 dark:border-slate-700">
          <form onSubmit={handleManualSearch} className="flex flex-col gap-[12px]">
            <input 
              placeholder="e.g. Gomti Nagar, Lucknow" 
              value={city} 
              onChange={(e) => setCity(e.target.value)}
              className="p-[12px] rounded-[8px] border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-accent"
            />
            <button type="submit" className="p-[12px] bg-[#0a4db8] hover:bg-[#083d91] text-white border-none rounded-[8px] cursor-pointer font-bold transition-colors">Find Healthcare</button>
            <button type="button" onClick={handleAutoLocation} className="p-[12px] bg-[#28a745] hover:bg-[#218838] text-white border-none rounded-[8px] cursor-pointer font-bold transition-colors">Use My Location</button>
          </form>

          <hr className="my-[20px] border-none border-t border-slate-200 dark:border-slate-700" />
          
          {loading ? <p className="text-center text-slate-500 dark:text-slate-400">🔍 Searching live map...</p> : (
            <div className="flex flex-col gap-[10px]">
              {doctors.map((doc, i) => (
                <div key={i} className="p-[12px] bg-blue-50 dark:bg-slate-700 rounded-[8px] border-l-[4px] border-[#0a4db8]">
                  <h4 className="m-0 mb-[5px] text-slate-800 dark:text-slate-100 font-bold">{doc.name || "Medical Center"}</h4>
                  <p className="m-0 text-[13px] text-[#666] dark:text-slate-400">
                    {doc.type ? `Type: ${doc.type.toUpperCase()}` : doc.distance ? `${doc.distance} km away` : "Healthcare Facility"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map Display */}
        <div className="flex-[2] rounded-[15px] overflow-hidden border-[2px] border-slate-200 dark:border-slate-700 min-h-[400px]">
          <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
            <ChangeView center={mapCenter} />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {doctors.map((doc, i) => (
              <Marker key={i} position={[doc.lat, doc.lng || doc.lon]} icon={doctorIcon}>
                <Popup>
                  <strong>{doc.name || "Healthcare Facility"}</strong><br/>
                  {doc.type || doc.address || ""}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default NearbyDoctors;