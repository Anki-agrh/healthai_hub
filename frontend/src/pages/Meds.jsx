import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import './Meds.css';

const Meds = () => {
  // ✅ PERSISTENCE: Initializing states from LocalStorage
  const [points, setPoints] = useState(() => Number(localStorage.getItem('health_points')) || 150);
  const [water, setWater] = useState(() => Number(localStorage.getItem('health_water')) || 0);
  const [meds, setMeds] = useState(() => JSON.parse(localStorage.getItem('health_meds')) || [{ name: "START", time: "00:00", height: "80px" }]);
  const [completedDays, setCompletedDays] = useState(() => JSON.parse(localStorage.getItem('health_completedDays')) || []);
  const [totalDayMeditation, setTotalDayMeditation] = useState(() => Number(localStorage.getItem('health_meditation')) || 0);

  const [quote, setQuote] = useState("Loading your daily motivation...");
  const [showQuote, setShowQuote] = useState(true);
  const [gender, setGender] = useState('female'); 
  const [dailyGoal, setDailyGoal] = useState(2); 

  // --- Character States ---
  const [currentIndex, setCurrentIndex] = useState(0); 

  // --- Stopwatch States ---
  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(0); 

  // --- Medication & Modal States ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMed, setNewMed] = useState({ name: '', time: '' });

  // --- Notifications ---
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [pendingNotifs, setPendingNotifs] = useState([]);

  const genAI = new GoogleGenerativeAI("YOUR_API_KEY");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // ✅ SAVE DATA: Automatically update localStorage when states change
  useEffect(() => {
    localStorage.setItem('health_points', points);
    localStorage.setItem('health_water', water);
    localStorage.setItem('health_meds', JSON.stringify(meds));
    localStorage.setItem('health_completedDays', JSON.stringify(completedDays));
    localStorage.setItem('health_meditation', totalDayMeditation);
  }, [points, water, meds, completedDays, totalDayMeditation]);

  // ✅ MIDNIGHT RESET: Checks if the day has changed since last visit
  useEffect(() => {
    const lastVisit = localStorage.getItem('last_reset_date');
    const today = new Date().toDateString();

    if (lastVisit !== today) {
      setPoints(0);
      setWater(0);
      setTotalDayMeditation(0);
      setMeds([{ name: "START", time: "00:00", height: "80px" }]);
      setCurrentIndex(0);
      localStorage.setItem('last_reset_date', today);
    }
  }, []);

  const getCalendarData = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const todayDateNum = now.getDate(); 
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); 
    const startOffset = firstDay; 
    const monthName = now.toLocaleString('default', { month: 'long' });
    return { daysInMonth, startOffset, monthName, year, month, todayDateNum };
  };

  const { daysInMonth, startOffset, monthName, year, month, todayDateNum } = getCalendarData();
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const sortedMeds = [...meds].sort((a, b) => a.time.localeCompare(b.time));

  // 15-Min Notification Alert
  useEffect(() => {
    const checkAlerts = () => {
      const now = new Date();
      const currentTotalMins = now.getHours() * 60 + now.getMinutes();
      const alerts = sortedMeds.filter((m, i) => {
        if (i === 0) return false;
        const [h, min] = m.time.split(':').map(Number);
        const medMins = h * 60 + min;
        const diff = medMins - currentTotalMins;
        return diff > 0 && diff <= 15;
      });
      setPendingNotifs(alerts);
    };
    const alertTimer = setInterval(checkAlerts, 30000);
    return () => clearInterval(alertTimer);
  }, [sortedMeds]);

  const deleteMed = (indexToDelete) => {
    if (indexToDelete === 0) return;
    const medToDelete = sortedMeds[indexToDelete];
    setMeds(prev => prev.filter(m => m !== medToDelete));
    if (currentIndex >= indexToDelete && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const fetchAIQuote = async () => {
    const fallbacks = ["Your health is an investment.", "Consistency is key.", "Small steps lead to big results."];
    try {
      const prompt = "Generate one short, highly motivating health quote for a 21yo student. Under 15 words.";
      const result = await model.generateContent(prompt);
      const response = await result.response;
      setQuote(response.text());
    } catch (error) {
      setQuote(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
    }
  };

  const handleAction = (status) => {
    if (currentIndex >= sortedMeds.length - 1) return;
    if (status === 'done') setPoints(prev => prev + 10);
    else setPoints(prev => prev - 5);
    setCurrentIndex(prev => prev + 1);
  };

  const handleAddMed = () => {
    if (!newMed.name || !newMed.time) return;
    const [hours] = newMed.time.split(':');
    const dynamicHeight = `${Math.max(120, parseInt(hours) * 15)}px`;
    setMeds([...meds, { ...newMed, height: dynamicHeight }]);
    setNewMed({ name: '', time: '' });
    setShowAddModal(false);
  };

  useEffect(() => {
    const isWaterMet = water >= (dailyGoal * 0.8);
    const isMeditationMet = totalDayMeditation >= 780; 
    const areMedsMet = meds.length > 1 ? currentIndex === sortedMeds.length - 1 : true;
    if (isWaterMet && isMeditationMet && areMedsMet) {
      const dateKey = `${year}-${(month + 1).toString().padStart(2, '0')}-${new Date().getDate().toString().padStart(2, '0')}`;
      if (!completedDays.includes(dateKey)) setCompletedDays(prev => [...prev, dateKey]);
    }
  }, [water, totalDayMeditation, currentIndex, meds.length, dailyGoal, completedDays, year, month]);

  useEffect(() => {
    fetchAIQuote();
    const quoteTimer = setTimeout(() => setShowQuote(false), 10000);
    return () => clearTimeout(quoteTimer);
  }, []);

  useEffect(() => {
    let interval = null;
    if (isActive) interval = setInterval(() => setTime(t => t + 1), 1000);
    else clearInterval(interval);
    return () => clearInterval(interval);
  }, [isActive]);

  const handleStartStop = () => {
    if (isActive) {
      setTotalDayMeditation(prev => prev + time);
      setTime(0);
    }
    setIsActive(!isActive);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGenderChange = (e) => {
    const val = e.target.value;
    setGender(val);
    setDailyGoal(val === 'male' ? 3 : 2);
    setWater(0);
  };

  const addWater = (ml) => setWater(prev => Math.min(prev + (ml / 1000), dailyGoal));

  return (
    <div className="dashboard-container">
      {showQuote && (
        <div className="quote-overlay-mini">
          <button className="close-quote-btn" onClick={() => setShowQuote(false)}>×</button>
          <div className="quote-content-mini"><p>"{quote}"</p></div>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>💊 Add Medicine</h3>
            <input type="text" placeholder="Medicine Name" onChange={e => setNewMed({...newMed, name: e.target.value})} />
            <input type="time" onChange={e => setNewMed({...newMed, time: e.target.value})} />
            <div className="modal-actions">
              <button className="modal-btn-add" onClick={handleAddMed}>Add</button>
              <button className="modal-btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <h1 className="main-heading">Health Dashboard</h1>

      <div className="top-stats-row">
        <div className="points-badge">🏆 Points: {points}</div>
        
        <div className="notif-wrapper" style={{ position: 'relative' }}>
          <div 
            className={`notif-bell ${pendingNotifs.length > 0 ? 'red-alert' : ''}`} 
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            style={{ cursor: 'pointer' }}
          >
            🔔 {pendingNotifs.length > 0 && <span className="red-dot"></span>}
          </div>

          {showNotifDropdown && (
            <div className="notif-dropdown">
              <h4>Notifications</h4>
              {pendingNotifs.length === 0 ? <p>No upcoming meds.</p> : pendingNotifs.map((n, idx) => (
                <div key={idx} className="notif-item">Take <strong>{n.name}</strong> at {n.time}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="main-layout">
        <div className="left-panel expanded-vertical">
          <div className="med-header">
            <h2 className="section-title">Med-Reminder</h2>
            <button className="add-med-btn-header" onClick={() => setShowAddModal(true)}>+ Add</button>
          </div>

          <div className="pillar-container vertical-stage">
            {sortedMeds.map((med, i) => (
              <div key={i} className={`pillar cuboidal-pillar p-dynamic ${currentIndex === i ? 'current-p' : ''}`} style={{ height: med.height }}>
                {i !== 0 && <button className="delete-med-btn" onClick={() => deleteMed(i)}>×</button>}
                <div className="pillar-content">
                  <div className="pillar-vertical-text" style={{ fontSize: parseInt(med.height) < 140 ? '0.7rem' : '0.9rem' }}>{med.name}</div>
                </div>
                <div className="pillar-horizontal-time">{med.time}</div>
                {currentIndex === i && <img src="/assets/shinchan.png" alt="Shinchan" className="shinchan-image" />}
                {currentIndex === i && i !== sortedMeds.length - 1 && (
                  <div className="jump-controls">
                    <button className="done-btn" onClick={() => handleAction('done')}>Done</button>
                    <button className="skip-btn" onClick={() => handleAction('skip')}>Skip</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="consistency-note-box bottom-note">
            <p><strong>📝 Note:</strong> Consistency Condition</p>
            <ul>
                <li>Water intake &ge; 80%.</li>
                <li>Meditation &ge; 13 minutes.</li>
                <li>{meds.length > 1 ? "Mark all meds 'Done'!" : "No meds added (Condition skipped)."}</li>
            </ul>
          </div>
        </div>

        <div className="right-panel">
          <div className="info-box meditation-box">
            <div className="med-header">
              <h3>🧘 Meditation Track</h3>
              <span className="total-day-label">Total: {formatTime(totalDayMeditation)}</span>
            </div>
            <div className="stopwatch-display">{formatTime(time)}</div>
            <button className={`stopwatch-btn ${isActive ? 'active' : ''}`} onClick={handleStartStop}>
              {isActive ? 'Stop Session' : 'Start Meditating'}
            </button>
          </div>

          <div className="info-box water-box">
            <div className="med-header">
              <h3>💧 Water Intake</h3>
              <div className="gender-selector-header">
                <select value={gender} onChange={handleGenderChange}>
                  <option value="female">Woman (2L)</option>
                  <option value="male">Man (3L)</option>
                </select>
              </div>
            </div>
            <div className="water-drop-container">
               <div className="water-drop">
                  <div className="water-wave" style={{ top: `${100 - (water / dailyGoal) * 100}%` }}></div>
                  <div className="water-percentage">{Math.round((water / dailyGoal) * 100)}%</div>
               </div>
            </div>
            <div className="water-stats">{water.toFixed(3)}L / {dailyGoal}L</div>
            <div className="water-controls">
              <button onClick={() => addWater(50)}>+ 50 ml</button>
              <button onClick={() => addWater(100)}>+ 100 ml</button>
            </div>
          </div>

          <div className="info-box streak-box calendar-box-expanded">
            <h3>📅 {monthName} {year}</h3>
            <div className="calendar-day-labels">{dayLabels.map(l => <span key={l}>{l}</span>)}</div>
            <div className="calendar-grid-large">
              {[...Array(startOffset)].map((_, i) => <div key={`empty-${i}`} className="calendar-cell empty"></div>)}
              {[...Array(daysInMonth)].map((_, i) => {
                const dayNum = i + 1;
                const dateKey = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
                const isSuccess = completedDays.includes(dateKey);
                return (
                  <div key={i} className={`calendar-cell ${isSuccess ? 'cell-success' : ''} ${dayNum === todayDateNum ? 'today-highlight' : ''}`}>
                    <span className="cell-date">{dayNum}</span>
                    {isSuccess && <span className="cell-tick">✅</span>}
                  </div>
                );
              })}
            </div>

            <div className="calendar-stats-footer">
              <div className="stat-item">
                <span className="stat-label">🔥 Max Streak</span>
                <span className="stat-value">{completedDays.length} Days</span>
              </div>
              <div className="streak-progress-bar">
                <div 
                  className="streak-fill" 
                  style={{ width: `${(completedDays.length / daysInMonth) * 100}%` }}
                ></div>
              </div>
              <p className="stat-hint">Consistent efforts lead to great rewards!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Meds;