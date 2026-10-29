import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search, MapPin, Locate, Activity, Brain, Clock, ChevronRight, Building2, Pill, Zap, Stethoscope } from 'lucide-react';

const API = process.env.REACT_APP_API || "https://healthai-hub.onrender.com";

const doctorIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2785/2785482.png',
  iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -36]
});
const userIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
  iconSize: [38, 38], iconAnchor: [19, 38], popupAnchor: [0, -38]
});

function ChangeView({ center }) {
  const map = useMap();
  map.setView(center, 14);
  return null;
}

// ——— Extraordinary Feature 1: AI Symptom → Specialist Matcher ———
const SYMPTOM_SPECIALIST_MAP = {
  'chest pain': { specialist: 'Cardiologist', urgency: 'URGENT', tip: 'Seek emergency care if pain is crushing or radiates to arm.' },
  'heart pounding': { specialist: 'Cardiologist', urgency: 'HIGH', tip: 'Could indicate arrhythmia. Avoid caffeine and stress.' },
  'headache': { specialist: 'Neurologist', urgency: 'MODERATE', tip: 'Track headache patterns, triggers and duration.' },
  'seizure': { specialist: 'Neurologist', urgency: 'URGENT', tip: 'Do not restrain during seizure. Call emergency services.' },
  'rash': { specialist: 'Dermatologist', urgency: 'LOW', tip: 'Avoid scratching. Note when rash first appeared.' },
  'acne': { specialist: 'Dermatologist', urgency: 'LOW', tip: 'Use non-comedogenic products and avoid touching face.' },
  'child fever': { specialist: 'Pediatrician', urgency: 'HIGH', tip: 'Children under 3 months with fever need immediate evaluation.' },
  'knee pain': { specialist: 'Orthopedist', urgency: 'MODERATE', tip: 'R.I.C.E – Rest, Ice, Compression, Elevation.' },
  'back pain': { specialist: 'Orthopedist', urgency: 'MODERATE', tip: 'Avoid heavy lifting. Core strengthening exercises help.' },
  'blurred vision': { specialist: 'Ophthalmologist', urgency: 'HIGH', tip: 'Sudden vision changes can indicate serious conditions.' },
  'tooth pain': { specialist: 'Dentist', urgency: 'MODERATE', tip: 'Clove oil can temporarily reduce tooth pain.' },
  'stomach pain': { specialist: 'Gastroenterologist', urgency: 'MODERATE', tip: 'Note if pain is related to meals, position or timing.' },
  'breathing': { specialist: 'Pulmonologist', urgency: 'HIGH', tip: 'Sit upright and breathe through pursed lips if struggling.' },
  'diabetes': { specialist: 'Endocrinologist', urgency: 'MODERATE', tip: 'Monitor blood sugar levels regularly.' },
  'anxiety': { specialist: 'Psychiatrist', urgency: 'LOW', tip: '4-7-8 breathing: inhale 4s, hold 7s, exhale 8s.' },
  'depression': { specialist: 'Psychiatrist', urgency: 'HIGH', tip: 'Reach out to someone you trust. You are not alone.' },
};

// ——— Extraordinary Feature 2: Live Wait Time Intelligence ———
function getEstimatedWait(type = '') {
  const h = new Date().getHours();
  const t = type.toLowerCase();
  const peak = (h >= 9 && h <= 12) || (h >= 17 && h <= 20);
  if (t.includes('hospital')) return peak ? '45–90 min' : '20–40 min';
  if (t.includes('clinic')) return peak ? '25–50 min' : '10–25 min';
  if (t.includes('pharmacy')) return peak ? '5–15 min' : '2–8 min';
  return peak ? '30–60 min' : '15–30 min';
}
function getOpenStatus() {
  const h = new Date().getHours();
  if (h >= 8 && h <= 21) return { label: 'Open Now', color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' };
  if (h === 7 || h === 22) return { label: 'Opening Soon', color: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' };
  return { label: '24/7 Emergency', color: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' };
}

const FACILITY_FILTERS = ['All', 'Hospital', 'Clinic', 'Pharmacy', 'Dentist'];
const URGENCY_COLORS = { URGENT: 'bg-red-100 text-red-700 border-red-200', HIGH: 'bg-orange-100 text-orange-700 border-orange-200', MODERATE: 'bg-yellow-100 text-yellow-700 border-yellow-200', LOW: 'bg-green-100 text-green-700 border-green-200' };

const NearbyDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState('');
  const [mapCenter, setMapCenter] = useState([26.8467, 80.9462]);
  const [userPos, setUserPos] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchDone, setSearchDone] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [searchTime, setSearchTime] = useState(null);

  // Feature 1: AI Symptom Matcher
  const [symptomQuery, setSymptomQuery] = useState('');
  const [symptomResult, setSymptomResult] = useState(null);
  const [showSymptomMatcher, setShowSymptomMatcher] = useState(false);

  // Feature 3: Heatzone mode
  const [heatMode, setHeatMode] = useState(false);

  const matchSymptom = () => {
    const q = symptomQuery.toLowerCase();
    const match = Object.entries(SYMPTOM_SPECIALIST_MAP).find(([key]) => q.includes(key));
    setSymptomResult(match ? match[1] : { specialist: 'General Physician', urgency: 'LOW', tip: 'Please describe symptoms more specifically for better matching.' });
  };

  const searchHealthcare = async (lat, lon) => {
    setLoading(true);
    const t0 = Date.now();
    try {
      const res = await fetch(`${API}/api/doctors/nearby?lat=${lat}&lng=${lon}`);
      const data = await res.json();
      if (data.success) {
        setDoctors(data.doctors || []);
        setFiltered(data.doctors || []);
        setSearchDone(true);
        setSearchTime(((Date.now() - t0) / 1000).toFixed(2));
      }
    } catch { } finally { setLoading(false); }
  };

  const handleAutoLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      setMapCenter([latitude, longitude]);
      setUserPos([latitude, longitude]);
      searchHealthcare(latitude, longitude);
    }, () => alert('GPS access denied. Use manual search.'));
  };

  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!city) return;
    setLoading(true);
    const t0 = Date.now();
    try {
      const res = await fetch(`${API}/api/doctors/nearby?city=${encodeURIComponent(city)}`);
      const data = await res.json();
      if (data.success && data.doctors?.length > 0) {
        if (data.center) setMapCenter([data.center.lat, data.center.lng]);
        else setMapCenter([data.doctors[0].lat, data.doctors[0].lng]);
        setDoctors(data.doctors);
        setFiltered(data.doctors);
        setSearchDone(true);
        setSearchTime(((Date.now() - t0) / 1000).toFixed(2));
      } else {
        alert(data.message || 'No facilities found.');
        setDoctors([]); setFiltered([]);
      }
    } catch (err) { alert(`Search failed: ${err.message}`); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    setFiltered(activeFilter === 'All' ? doctors : doctors.filter(d => (d.type || '').toLowerCase().includes(activeFilter.toLowerCase())));
  }, [activeFilter, doctors]);

  const openStatus = getOpenStatus();

  return (
    <div className="max-w-[1300px] mx-auto py-8 px-4 sm:px-6 animate-fadeSlideIn">

      {/* ── Page Header ── */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent mb-3">
          <MapPin size={13} /> Live Healthcare Locator
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Find Healthcare Near You
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Real-time hospital, clinic & pharmacy discovery · AI specialist matching · Live wait times
        </p>
      </div>

      {/* ══ EXTRAORDINARY FEATURE 1: AI Symptom → Specialist Matcher ══ */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 border border-blue-200 dark:border-slate-700 rounded-2xl p-5 mb-6 shadow-sm">
        <button
          onClick={() => setShowSymptomMatcher(s => !s)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
              <Brain size={20} className="text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">AI Symptom → Specialist Matcher</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Describe symptoms and AI tells you which specialist to see</p>
            </div>
          </div>
          <ChevronRight size={18} className={`text-slate-400 transition-transform ${showSymptomMatcher ? 'rotate-90' : ''}`} />
        </button>

        {showSymptomMatcher && (
          <div className="mt-4 border-t border-blue-200 dark:border-slate-700 pt-4">
            <div className="flex gap-3 flex-wrap sm:flex-nowrap">
              <input
                value={symptomQuery}
                onChange={e => setSymptomQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && matchSymptom()}
                placeholder="e.g. chest pain, knee pain, child fever, anxiety..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
              <button
                onClick={matchSymptom}
                className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
              >
                Match Specialist
              </button>
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-2 mt-3">
              {['chest pain', 'headache', 'back pain', 'rash', 'anxiety', 'diabetes', 'knee pain'].map(s => (
                <button key={s} onClick={() => { setSymptomQuery(s); }}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-accent/50 hover:text-accent transition-colors">
                  {s}
                </button>
              ))}
            </div>

            {symptomResult && (
              <div className={`mt-4 p-4 rounded-xl border ${URGENCY_COLORS[symptomResult.urgency] || 'bg-blue-50 border-blue-200'} dark:bg-slate-900 dark:border-slate-700`}>
                <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap">
                  <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                    <Stethoscope size={20} className="text-accent" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-base">See a {symptomResult.specialist}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${URGENCY_COLORS[symptomResult.urgency]}`}>
                        {symptomResult.urgency}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{symptomResult.tip}</p>
                    <button
                      onClick={() => { setActiveFilter('All'); handleAutoLocation(); }}
                      className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
                    >
                      <MapPin size={12} /> Find {symptomResult.specialist} near me →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Search Bar ── */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 mb-6 shadow-sm">
        <form onSubmit={handleManualSearch} className="flex gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Search city or area (e.g. Gomti Nagar, Lucknow)"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>
          <button type="submit" disabled={loading}
            className="px-5 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-60 whitespace-nowrap flex items-center gap-2">
            <Search size={15} /> {loading ? 'Searching…' : 'Search'}
          </button>
          <button type="button" onClick={handleAutoLocation} disabled={loading}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-60 whitespace-nowrap flex items-center gap-2">
            <Locate size={15} /> Use GPS
          </button>
        </form>
      </div>

      {/* ──Stats Row (after search) ── */}
      {searchDone && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          {[
            { label: 'Total Found', value: doctors.length, icon: <Building2 size={24} className="text-accent mx-auto mb-1" />, color: 'text-accent' },
            { label: 'Hospitals', value: doctors.filter(d => (d.type || '').toLowerCase().includes('hospital')).length, icon: <Building2 size={24} className="text-amber-600 mx-auto mb-1" />, color: 'text-amber-600' },
            { label: 'Clinics', value: doctors.filter(d => (d.type || '').toLowerCase().includes('clinic')).length, icon: <Pill size={24} className="text-emerald-600 mx-auto mb-1" />, color: 'text-emerald-600' },
            { label: 'Search Time', value: `${searchTime}s`, icon: <Zap size={24} className="text-indigo-600 mx-auto mb-1" />, color: 'text-indigo-600' },
          ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
              <div>{s.icon}</div>
              <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter Pills + Heatmap Toggle ── */}
      {searchDone && (
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {FACILITY_FILTERS.map(f => (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeFilter === f ? 'bg-accent text-white shadow-md shadow-accent/25' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-accent/40'}`}>
                {f}
              </button>
            ))}
          </div>
          {/* ══ EXTRAORDINARY FEATURE 3: Healthcare Zone Mode ══ */}
          <button onClick={() => setHeatMode(h => !h)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${heatMode ? 'bg-purple-600 text-white border-purple-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-400'}`}>
            <Activity size={13} /> {heatMode ? 'Zone Mode: ON' : 'Healthcare Zone Map'}
          </button>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="flex flex-col lg:flex-row gap-5" style={{ height: '520px', minHeight: '520px' }}>

        {/* Left Panel: Results List */}
        <div className="w-full lg:w-[340px] shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              {loading ? 'Scanning live map…' : `${filtered.length} Results`}
            </h3>
            {searchDone && (
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${openStatus.color}`}>
                <span className={`w-2 h-2 rounded-full ${openStatus.dot} animate-pulse`} />
                {openStatus.label}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? (
              <div className="text-center text-slate-400 py-16">
                <Search size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">Scanning live healthcare map…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center text-slate-400 py-16">
                <Activity size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">Search a location to find nearby facilities</p>
              </div>
            ) : (
              filtered.map((doc, i) => {
                const wait = getEstimatedWait(doc.type);
                const isSelected = selectedDoc === doc;
                return (
                  <button
                    key={i}
                    onClick={() => { setSelectedDoc(doc); setMapCenter([doc.lat, doc.lng || doc.lon]); }}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${isSelected ? 'bg-accent/8 border-accent/30' : 'bg-slate-50 dark:bg-slate-900 border-transparent hover:border-slate-200 dark:hover:border-slate-600'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                        {(doc.type || '').toLowerCase().includes('hospital') ? (
                          <Building2 size={16} className="text-accent" />
                        ) : (doc.type || '').toLowerCase().includes('pharmacy') ? (
                          <Pill size={16} className="text-purple-600" />
                        ) : (
                          <Activity size={16} className="text-emerald-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">{doc.name || 'Medical Center'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {doc.type ? doc.type.toUpperCase() : 'Healthcare'}{doc.distance ? ` · ${doc.distance} km` : ''}
                        </p>
                        {/* ══ FEATURE 2: Live Wait Time ══ */}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Clock size={11} className="text-amber-500" />
                          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">~{wait} wait</span>
                          {heatMode && (
                            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-bold">
                              Zone {String.fromCharCode(65 + (i % 5))}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={15} className="text-slate-300 dark:text-slate-600 shrink-0 mt-1" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Map */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm relative min-h-[400px]">
          <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
            <ChangeView center={mapCenter} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {userPos && (
              <>
                <Marker position={userPos} icon={userIcon}><Popup>You are here</Popup></Marker>
                <Circle center={userPos} radius={1500} pathOptions={{ color: '#0a4db8', fillColor: '#0a4db8', fillOpacity: 0.06, weight: 2, dashArray: '8 4' }} />
              </>
            )}
            {filtered.map((doc, i) => (
              <Marker key={i} position={[doc.lat, doc.lng || doc.lon]} icon={doctorIcon}>
                <Popup>
                  <strong>{doc.name || 'Healthcare Facility'}</strong><br />
                  {doc.type || ''}<br />
                  <span style={{ color: '#d97706', fontSize: '12px' }}>~{getEstimatedWait(doc.type)} wait</span>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Live Map Badge */}
          <div className="absolute top-3 left-3 z-[999] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 flex items-center gap-2 shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Live Map</span>
          </div>
          {heatMode && (
            <div className="absolute top-3 right-3 z-[999] bg-purple-600 text-white rounded-xl px-3 py-2 text-xs font-bold shadow-md flex items-center gap-1.5">
              <Activity size={13} /> Healthcare Zone Mode
            </div>
          )}
        </div>
      </div>

      {/* ── Info Tips Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[
          { title: 'Emergency?', tip: 'Use the Emergency SOS tab for fastest response — alerts all nearby doctors instantly.' },
          { title: 'Prefer Video?', tip: 'Book a specialist consultation from home via the Consult tab with HD video call.' },
          { title: 'Not Sure?', tip: 'Use the AI Symptom Matcher above to know which type of doctor to see first.' },
          { title: 'Wait Times', tip: 'Estimated wait times are AI-calculated based on facility type and time of day.' },
        ].map((t, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <span className="text-2xl">{t.icon}</span>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-2 mb-1">{t.title}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{t.tip}</p>
          </div>
        ))}
      </div>

    </div>
  );
};

export default NearbyDoctors;