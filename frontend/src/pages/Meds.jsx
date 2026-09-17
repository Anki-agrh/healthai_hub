import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";


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
    <div className="p-5 bg-slate-50 dark:bg-slate-900 min-h-screen relative font-sans transition-colors duration-300">
      {showQuote && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 p-[15px_45px] rounded-full border-4 border-accent shadow-[0_15px_50px_rgba(10,77,184,0.3)] text-center z-[10001] max-w-[450px] w-[90%] animate-[slidePop_0.4s_ease-out]">
          <button className="absolute -top-3 right-3 bg-accent text-white border-none w-[26px] h-[26px] rounded-full cursor-pointer flex items-center justify-center font-bold shadow-md hover:scale-110 transition-transform" onClick={() => setShowQuote(false)}>×</button>
          <div className="m-0 text-[1.1rem] font-bold text-slate-800 dark:text-slate-100 italic"><p>"{quote}"</p></div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[10000] p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl flex flex-col gap-4 w-[300px] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-xl">
            <h3>💊 Add Medicine</h3>
            <input className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-accent" type="text" placeholder="Medicine Name" onChange={e => setNewMed({...newMed, name: e.target.value})} />
            <input className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-accent" type="time" onChange={e => setNewMed({...newMed, time: e.target.value})} />
            <div className="flex gap-2.5">
              <button className="flex-1 p-2.5 rounded-xl border-none bg-accent text-white font-bold cursor-pointer transition-transform hover:scale-105" onClick={handleAddMed}>Add</button>
              <button className="flex-1 p-2.5 rounded-xl border-none bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold cursor-pointer transition-transform hover:scale-105" onClick={() => setShowAddModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-center text-slate-800 dark:text-slate-100 mb-2.5 text-3xl font-bold">Health Dashboard</h1>

      <div className="flex flex-col md:flex-row justify-between items-center my-0 mx-auto mb-[30px] max-w-[1200px] px-5 gap-2.5">
        <div className="font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 px-5 py-2.5 rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.05)] border border-slate-200 dark:border-slate-700">🏆 Points: {points}</div>
        
        <div className="relative ml-auto md:ml-0 md:pr-2.5" style={{ position: 'relative' }}>
          <div 
            className={`text-2xl cursor-pointer ml-auto pr-2.5 ${pendingNotifs.length > 0 ? "text-red-500 animate-[shake_0.5s_infinite]" : "text-slate-600 dark:text-slate-300"}`} 
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            style={{ cursor: 'pointer' }}
          >
            🔔 {pendingNotifs.length > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full"></span>}
          </div>

          {showNotifDropdown && (
            <div className="absolute right-0 top-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-4 w-[250px] z-50">
              <h4>Notifications</h4>
              {pendingNotifs.length === 0 ? <p>No upcoming meds.</p> : pendingNotifs.map((n, idx) => (
                <div key={idx} className="p-2 border-b border-slate-100 dark:border-slate-700 last:border-b-0 text-sm text-slate-700 dark:text-slate-300">Take <strong>{n.name}</strong> at {n.time}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-[30px] max-w-[1200px] mx-auto">
        <div className="flex-[2] flex flex-col min-h-[auto] md:min-h-[850px] bg-white dark:bg-slate-800 rounded-[20px] p-[15px] md:p-[30px] shadow-[0_5px_15px_rgba(0,0,0,0.05)] border border-slate-200 dark:border-slate-700 transition-colors">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 m-0">Med-Reminder</h2>
            <button className="bg-accent text-white border-none p-[8px_20px] rounded-xl font-bold cursor-pointer transition-all hover:bg-accent-hover hover:scale-105 shadow-[0_4px_6px_rgba(0,0,0,0.05)]" onClick={() => setShowAddModal(true)}>+ Add</button>
          </div>

          <div className="flex items-end justify-start gap-5 h-[400px] md:h-[550px] mt-5 mb-12 border-b-4 border-slate-100 dark:border-slate-700 pb-[60px] overflow-x-auto overflow-y-visible px-2.5">
            {sortedMeds.map((med, i) => (
              <div key={i} className={`relative w-[55px] shrink-0 flex flex-col justify-center items-center rounded-sm transition-all duration-[400ms] mr-6 ${currentIndex === i ? "bg-gradient-to-b from-[#4facfe] to-[#00f2fe] shadow-[8px_0px_0px_#00c9db,0px_15px_30px_rgba(0,242,254,0.4)] -translate-y-2.5 scale-105 z-10" : "bg-gradient-to-b from-[#71b1ff] to-[#4a90e2] shadow-[8px_0px_0px_#3470b9,12px_10px_20px_rgba(0,0,0,0.15)] z-0"}`} style={{ height: med.height }}>
                {i !== 0 && <button className="absolute top-2 right-2 w-[22px] h-[22px] bg-white/20 text-white rounded-full flex items-center justify-center font-bold text-sm border-none cursor-pointer hover:bg-red-500 hover:scale-110 hover:rotate-90 transition-all z-20 shadow-sm" onClick={() => deleteMed(i)}>×</button>}
                <div className="flex items-center justify-center h-full w-full overflow-hidden py-1">
                  <div className="[writing-mode:vertical-rl] font-extrabold text-white tracking-wider uppercase drop-shadow-md text-center transition-all" style={{ fontSize: parseInt(med.height) < 140 ? '0.7rem' : '0.9rem' }}>{med.name}</div>
                </div>
                <div className="absolute -bottom-[30px] text-[0.8rem] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{med.time}</div>
                {currentIndex === i && <img src="/assets/shinchan.png" alt="Shinchan" className="absolute -top-[95px] md:-top-[95px] w-[60px] md:w-[90px] h-auto left-1/2 -translate-x-1/2 z-15 drop-shadow-lg animate-[victory-bounce_0.8s_infinite_alternate_ease-in-out]" />}
                {currentIndex === i && i !== sortedMeds.length - 1 && (
                  <div className="absolute -top-[150px] flex gap-2.5 left-1/2 -translate-x-1/2">
                    <button className="px-3 py-1.5 rounded-full border-none bg-green-500 hover:bg-green-600 text-white text-xs cursor-pointer font-bold transition-colors" onClick={() => handleAction('done')}>Done</button>
                    <button className="px-3 py-1.5 rounded-full border-none bg-orange-500 hover:bg-orange-600 text-white text-xs cursor-pointer font-bold transition-colors" onClick={() => handleAction('skip')}>Skip</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-auto p-5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-l-4 border-accent text-[0.85rem] text-slate-600 dark:text-slate-300">
            <p><strong>📝 Note:</strong> Consistency Condition</p>
            <ul>
                <li>Water intake &ge; 80%.</li>
                <li>Meditation &ge; 13 minutes.</li>
                <li>{meds.length > 1 ? "Mark all meds 'Done'!" : "No meds added (Condition skipped)."}</li>
            </ul>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-5 justify-start">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-[0_5px_15px_rgba(0,0,0,0.05)] border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center">
              <h3>🧘 Meditation Track</h3>
              <span className="text-[0.85rem] bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md text-accent font-bold">Total: {formatTime(totalDayMeditation)}</span>
            </div>
            <div className="font-mono text-[2.5rem] text-center text-slate-800 dark:text-slate-100 my-2.5 font-bold">{formatTime(time)}</div>
            <button className={`w-full p-3 rounded-xl border-none font-bold cursor-pointer transition-colors ${isActive ? "bg-red-500 hover:bg-red-600 text-white" : "bg-accent hover:bg-accent-hover text-white"}`} onClick={handleStartStop}>
              {isActive ? 'Stop Session' : 'Start Meditating'}
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-[0_5px_15px_rgba(0,0,0,0.05)] border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center">
              <h3>💧 Water Intake</h3>
              <div className="">
                <select className="p-1 px-2 rounded-lg border border-accent bg-blue-50 dark:bg-blue-900/30 text-[0.75rem] font-bold text-accent outline-none cursor-pointer" value={gender} onChange={handleGenderChange}>
                  <option value="female">Woman (2L)</option>
                  <option value="male">Man (3L)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-center my-4">
               <div className="relative w-[130px] h-[130px] bg-blue-50 dark:bg-blue-900/30 rounded-full border-[5px] border-accent overflow-hidden flex items-center justify-center shadow-[inset_0_0_15px_rgba(0,0,0,0.1)]">
                  <div className="absolute w-[250%] h-[250%] bg-accent -left-[75%] rounded-[38%] animate-[wave-rotate_6s_linear_infinite] transition-all duration-700 z-0" style={{ top: `${100 - (water / dailyGoal) * 100}%` }}></div>
                  <div className="relative z-10 font-bold text-slate-800 dark:text-white text-2xl drop-shadow-md">{Math.round((water / dailyGoal) * 100)}%</div>
               </div>
            </div>
            <div className="text-center font-bold text-slate-800 dark:text-slate-100 mb-2.5">{water.toFixed(3)}L / {dailyGoal}L</div>
            <div className="flex justify-center gap-2.5 mt-2.5">
              <button className="bg-accent hover:bg-accent-hover text-white border-none px-3 py-2 rounded-xl font-bold cursor-pointer transition-colors" onClick={() => addWater(50)}>+ 50 ml</button>
              <button className="bg-accent hover:bg-accent-hover text-white border-none px-3 py-2 rounded-xl font-bold cursor-pointer transition-colors" onClick={() => addWater(100)}>+ 100 ml</button>
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-[0_5px_15px_rgba(0,0,0,0.05)] border border-slate-200 dark:border-slate-700">
            <h3 className="text-center font-bold text-xl mb-4 text-slate-800 dark:text-slate-100">📅 {monthName} {year}</h3>
            <div className="grid grid-cols-7 text-center font-bold text-[0.75rem] text-accent mb-2">{dayLabels.map(l => <span key={l}>{l}</span>)}</div>
            <div className="grid grid-cols-7 gap-1.5 flex-1">
              {[...Array(startOffset)].map((_, i) => <div key={`empty-${i}`} className="aspect-square bg-transparent rounded-lg flex flex-col items-center justify-center"></div>)}
              {[...Array(daysInMonth)].map((_, i) => {
                const dayNum = i + 1;
                const dateKey = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
                const isSuccess = completedDays.includes(dateKey);
                return (
                  <div key={i} className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[0.75rem] transition-colors relative ${isSuccess ? "bg-green-100 dark:bg-green-900/30 border border-green-500" : "bg-slate-100 dark:bg-slate-700"} ${dayNum === todayDateNum ? "border-2 border-accent bg-blue-50 dark:bg-blue-900/30 shadow-[0_0_8px_rgba(113,177,255,0.5)] font-bold" : ""}`}>
                    <span className="text-slate-800 dark:text-slate-200">{dayNum}</span>
                    {isSuccess && <span className="text-[0.6rem] md:text-[0.8rem] mt-0.5">✅</span>}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t-2 border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-center mb-2.5">
                <span className="font-bold text-slate-600 dark:text-slate-400 text-[0.9rem]">🔥 Max Streak</span>
                <span className="text-accent font-extrabold text-[1.1rem]">{completedDays.length} Days</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-gradient-to-r from-[#71b1ff] to-[#51cf66] transition-all duration-500" 
                  style={{ width: `${(completedDays.length / daysInMonth) * 100}%` }}
                ></div>
              </div>
              <p className="text-[0.7rem] text-slate-400 dark:text-slate-500 italic text-center m-0">Consistent efforts lead to great rewards!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Meds;