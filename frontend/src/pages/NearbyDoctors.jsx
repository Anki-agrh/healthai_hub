import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const API = process.env.REACT_APP_API || "http://localhost:5000";

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
      if (data.success && data.doctors.length > 0) {
        // Update map center from first result's coordinates
        if (data.center) {
          setMapCenter([data.center.lat, data.center.lng]);
        } else if (data.doctors.length > 0) {
          setMapCenter([data.doctors[0].lat, data.doctors[0].lng]);
        }
        setDoctors(data.doctors);
      } else {
        alert("Location not found or no nearby facilities.");
      }
    } catch (err) {
      console.error("Search error:", err);
      alert("Search failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nearby-container" style={{ maxWidth: '1200px', margin: '20px auto', padding: '20px' }}>
      <h2 style={{ color: '#0a4db8', textAlign: 'center' }}>Live Healthcare Locator</h2>
      
      <div style={{ display: 'flex', gap: '25px', height: '75vh' }}>
        {/* Search Panel */}
        <div style={{ flex: 1, background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', overflowY: 'auto' }}>
          <form onSubmit={handleManualSearch} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input 
              placeholder="e.g. Gomti Nagar, Lucknow" 
              value={city} 
              onChange={(e) => setCity(e.target.value)}
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
            />
            <button type="submit" style={{ padding: '12px', background: '#0a4db8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Find Healthcare</button>
            <button type="button" onClick={handleAutoLocation} style={{ padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Use My Location</button>
          </form>

          <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />
          
          {loading ? <p style={{ textAlign: 'center' }}>🔍 Searching live map...</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {doctors.map((doc, i) => (
                <div key={i} style={{ padding: '12px', background: '#f8faff', borderRadius: '8px', borderLeft: '4px solid #0a4db8' }}>
                  <h4 style={{ margin: '0 0 5px 0' }}>{doc.name || "Medical Center"}</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                    {doc.type ? `Type: ${doc.type.toUpperCase()}` : doc.distance ? `${doc.distance} km away` : "Healthcare Facility"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map Display */}
        <div style={{ flex: 2, borderRadius: '15px', overflow: 'hidden', border: '2px solid #eef2f6' }}>
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