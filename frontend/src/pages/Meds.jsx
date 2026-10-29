import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Activity, Heart, Droplets, Moon, Zap, ShieldAlert, 
  Sparkles, Calendar, Plus, AlertTriangle, 
  Flame, QrCode, Play, Square, Wind, Edit3, HelpCircle, BellOff, Bell
} from 'lucide-react';

// ================= KNOWN CLINICAL DRUG INTERACTIONS DATABASE =================
const DRUG_INTERACTIONS = [
  {
    drugs: ['aspirin', 'warfarin'],
    severity: 'critical',
    title: 'Severe Bleeding Hazard',
    description: 'Concurrent use synergistically inhibits platelet aggregation and vitamin K-dependent clotting factors, drastically elevating gastrointestinal and intracranial hemorrhage risk.',
    action: 'Strictly avoid combination unless prescribed with frequent INR monitoring.'
  },
  {
    drugs: ['aspirin', 'ibuprofen'],
    severity: 'moderate',
    title: 'Reduced Cardioprotection & Ulcer Risk',
    description: 'Ibuprofen competitively blocks aspirin from binding COX-1 platelets, negating aspirin’s cardioprotective anti-platelet effect while doubling peptic ulceration risk.',
    action: 'Take immediate-release aspirin at least 30 minutes before or 8 hours after ibuprofen.'
  },
  {
    drugs: ['lisinopril', 'potassium'],
    severity: 'moderate',
    title: 'Hyperkalemia Risk',
    description: 'ACE inhibitors reduce aldosterone production, leading to potassium retention. Concomitant potassium supplements can trigger fatal cardiac arrhythmias.',
    action: 'Monitor serum potassium levels regularly; avoid high-dose potassium.'
  },
  {
    drugs: ['metformin', 'alcohol'],
    severity: 'moderate',
    title: 'Lactic Acidosis Hazard',
    description: 'Alcohol potentiates metformin’s effect on lactate metabolism, dramatically increasing the hazard of acute lactic acidosis.',
    action: 'Limit or avoid alcohol intake while undergoing metformin therapy.'
  },
  {
    drugs: ['atorvastatin', 'grapefruit'],
    severity: 'caution',
    title: 'CYP3A4 Inhibition',
    description: 'Grapefruit furanocoumarins inhibit intestinal CYP3A4 enzyme, increasing bioavailable statin serum levels by up to 300% and elevating rhabdomyolysis risk.',
    action: 'Avoid consuming grapefruit or grapefruit juice within 12 hours of statin dose.'
  },
  {
    drugs: ['levothyroxine', 'calcium'],
    severity: 'caution',
    title: 'Chelation & Malabsorption',
    description: 'Calcium carbonate binds to levothyroxine in the gastrointestinal tract, significantly impairing thyroid hormone absorption.',
    action: 'Administer levothyroxine at least 4 hours apart from calcium supplements.'
  }
];

// ============================================================
// Web Audio API – generate a clinical alarm beep pattern
// ============================================================
function playMedAlarm(audioCtxRef) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;
    const playTone = (startTime, freq, dur) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.35, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + dur);
    };
    // Repeating triple-beep pattern
    for (let rep = 0; rep < 8; rep++) {
      const base = ctx.currentTime + rep * 1.2;
      playTone(base + 0.00, 880, 0.18);
      playTone(base + 0.22, 880, 0.18);
      playTone(base + 0.44, 880, 0.18);
    }
  } catch (e) {
    console.warn('Audio alarm failed:', e);
  }
}

const Meds = () => {
  // Navigation / Mode Tabs
  const [activeTab, setActiveTab] = useState("tracker"); // "tracker" (Shinchan & Meds) | "vitals" | "habits"

  // User persistence
  const [points, setPoints] = useState(() => Number(localStorage.getItem('health_points')) || 180);
  const [water, setWater] = useState(() => Number(localStorage.getItem('health_water')) || 1.4);
  const [gender, setGender] = useState('female');
  const [dailyGoal, setDailyGoal] = useState(2.5);

  // --- Iconic Shinchan Pill Track States ---
  const [meds, setMeds] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('health_meds'));
      if (saved && Array.isArray(saved) && saved.length > 0) return saved;
    } catch (e) {}
    return [
      { name: "START", time: "00:00", height: "80px" },
      { name: "Aspirin 81mg", time: "08:30", height: "140px" },
      { name: "Vitamin D3", time: "13:00", height: "190px" },
      { name: "Omega 3", time: "20:00", height: "240px" }
    ];
  });
  const [currentIndex, setCurrentIndex] = useState(0);

  const [completedDays] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('health_completedDays'));
      if (saved && Array.isArray(saved)) return saved;
    } catch (e) {}
    const now = new Date();
    const y = now.getFullYear();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    return [`${y}-${m}-02`, `${y}-${m}-04`, `${y}-${m}-05`, `${y}-${m}-08`, `${y}-${m}-09`, `${y}-${m}-12`];
  });
  const [totalDayMeditation, setTotalDayMeditation] = useState(() => Number(localStorage.getItem('health_meditation')) || 420);

  // --- Real Vitals Recorded by User (Persistent in localStorage) ---
  const [vitalsData, setVitalsData] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('health_vitals_record'));
      if (saved) return saved;
    } catch (e) {}
    return {
      heartRate: 72,
      bpSys: 118,
      bpDia: 76,
      spo2: 98,
      bloodSugar: 94,
      sleepHours: 8.2,
      hrv: 64,
      steps: 7840,
      userAge: 24,
      lastRecorded: "Today, 08:30 AM (Manual Entry)"
    };
  });

  // Modal to record new vitals
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [recordHeartRate, setRecordHeartRate] = useState(vitalsData.heartRate);
  const [recordBpSys, setRecordBpSys] = useState(vitalsData.bpSys);
  const [recordBpDia, setRecordBpDia] = useState(vitalsData.bpDia);
  const [recordSpo2, setRecordSpo2] = useState(vitalsData.spo2);
  const [recordSugar, setRecordSugar] = useState(vitalsData.bloodSugar);
  const [recordSleep, setRecordSleep] = useState(vitalsData.sleepHours);
  const [recordAge, setRecordAge] = useState(vitalsData.userAge);

  // Save vitals into persistent state
  const handleSaveVitals = (e) => {
    e.preventDefault();
    const updated = {
      heartRate: Number(recordHeartRate) || 72,
      bpSys: Number(recordBpSys) || 120,
      bpDia: Number(recordBpDia) || 80,
      spo2: Number(recordSpo2) || 98,
      bloodSugar: Number(recordSugar) || 95,
      sleepHours: Number(recordSleep) || 8,
      hrv: vitalsData.hrv,
      steps: vitalsData.steps,
      userAge: Number(recordAge) || 24,
      lastRecorded: `Just now (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
    };
    setVitalsData(updated);
    localStorage.setItem('health_vitals_record', JSON.stringify(updated));
    setShowVitalsModal(false);
    setPoints(p => p + 20); // reward user for recording vitals
  };

  // Sync state with localStorage
  useEffect(() => {
    localStorage.setItem('health_points', points);
    localStorage.setItem('health_water', water);
    localStorage.setItem('health_meds', JSON.stringify(meds));
    localStorage.setItem('health_completedDays', JSON.stringify(completedDays));
    localStorage.setItem('health_meditation', totalDayMeditation);
  }, [points, water, meds, completedDays, totalDayMeditation]);

  // ============================================================
  // MEDICATION ALARM SYSTEM
  // ============================================================
  const [alarmMed, setAlarmMed] = useState(null);      // { name, time } when alarm fires
  const [alarmRinging, setAlarmRinging] = useState(false);
  const audioCtxRef = useRef(null);
  const snoozedRef = useRef(new Set());               // track already-fired meds today
  const alarmIntervalRef = useRef(null);

  const stopAlarm = useCallback(() => {
    try { audioCtxRef.current?.close(); } catch (e) {}
    audioCtxRef.current = null;
    clearInterval(alarmIntervalRef.current);
    setAlarmRinging(false);
    setAlarmMed(null);
  }, []);

  useEffect(() => {
    const checkMedAlarms = () => {
      const now = new Date();
      const hhmm = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const todayKey = now.toDateString();

      // Reset snoozed set on new day
      if (snoozedRef.current._day && snoozedRef.current._day !== todayKey) {
        snoozedRef.current = new Set();
      }
      snoozedRef.current._day = todayKey;

      // Check each med (skip the START node at index 0 which has time 00:00 as placeholder)
      for (const med of meds) {
        if (med.name === 'START') continue;
        const alarmKey = `${todayKey}_${med.name}_${med.time}`;
        if (med.time === hhmm && !snoozedRef.current.has(alarmKey)) {
          snoozedRef.current.add(alarmKey);
          setAlarmMed(med);
          setAlarmRinging(true);
          // Keep re-playing alarm every 5s until stopped
          playMedAlarm(audioCtxRef);
          alarmIntervalRef.current = setInterval(() => {
            playMedAlarm(audioCtxRef);
          }, 9800);
          break; // one alarm at a time
        }
      }
    };

    // Check immediately, then every 30s
    checkMedAlarms();
    const ticker = setInterval(checkMedAlarms, 30000);
    return () => {
      clearInterval(ticker);
      clearInterval(alarmIntervalRef.current);
    };
  }, [meds]);


  // Live Wearable Telemetry Jitter Simulator
  const [wearableSync, setWearableSync] = useState(true);
  const [liveHr, setLiveHr] = useState(vitalsData.heartRate);
  const [isSpiking, setIsSpiking] = useState(false);

  useEffect(() => {
    setLiveHr(vitalsData.heartRate);
  }, [vitalsData.heartRate]);

  useEffect(() => {
    if (!wearableSync) return;
    const interval = setInterval(() => {
      if (!isSpiking) {
        setLiveHr(prev => Math.min(84, Math.max(65, prev + (Math.random() > 0.5 ? 1 : -1))));
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [wearableSync, isSpiking]);

  const triggerHrSpike = () => {
    setIsSpiking(true);
    setLiveHr(128);
    setTimeout(() => {
      setLiveHr(94);
      setTimeout(() => {
        setLiveHr(vitalsData.heartRate);
        setIsSpiking(false);
      }, 3500);
    }, 3500);
  };

  // Biological Age Longevity Calculation based on real vitals
  const bioAgeData = useMemo(() => {
    const age = Number(vitalsData.userAge) || 24;
    let delta = 0;
    if (vitalsData.heartRate <= 70) delta -= 1.2;
    else if (vitalsData.heartRate <= 78) delta -= 0.4;
    else delta += 1.4;

    if (water >= dailyGoal * 0.8) delta -= 0.8;
    else delta += 0.5;

    if (vitalsData.sleepHours >= 7.5 && vitalsData.sleepHours <= 9) delta -= 1.0;
    else delta += 0.8;

    if (vitalsData.bpSys <= 120 && vitalsData.bpDia <= 80) delta -= 0.8;
    else delta += 1.2;

    const bioAge = (age + delta).toFixed(1);
    const diff = (bioAge - age).toFixed(1);
    return {
      chronological: age,
      biological: bioAge,
      diff: Number(diff),
      isYounger: Number(diff) < 0
    };
  }, [vitalsData, water, dailyGoal]);

  // Shinchan Pill Actions
  const sortedMeds = useMemo(() => {
    return [...meds].sort((a, b) => a.time.localeCompare(b.time));
  }, [meds]);

  const handlePillAction = (status) => {
    if (currentIndex >= sortedMeds.length - 1) return;
    if (status === 'done') setPoints(prev => prev + 10);
    else setPoints(prev => Math.max(0, prev - 5));
    setCurrentIndex(prev => prev + 1);
  };

  // Add Med Form
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [newMed, setNewMed] = useState({ name: '', time: '08:00' });

  const handleAddMed = (e) => {
    e.preventDefault();
    if (!newMed.name || !newMed.time) return;
    const [hours] = newMed.time.split(':');
    const dynamicHeight = `${Math.max(120, parseInt(hours, 10) * 15)}px`;
    setMeds(prev => [...prev, { ...newMed, height: dynamicHeight }]);
    setNewMed({ name: '', time: '08:00' });
    setShowAddMedModal(false);
    setPoints(prev => prev + 15);
  };

  const deleteMed = (indexToDelete) => {
    if (indexToDelete === 0) return;
    const medToDelete = sortedMeds[indexToDelete];
    setMeds(prev => prev.filter(m => m !== medToDelete));
    if (currentIndex >= indexToDelete && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Drug-Drug Interaction Safety Check on Active Meds
  const detectedInteractions = useMemo(() => {
    const activeNames = meds.map(m => m.name.toLowerCase());
    const matched = [];
    DRUG_INTERACTIONS.forEach(item => {
      const foundCount = item.drugs.filter(d => 
        activeNames.some(med => med.includes(d))
      ).length;
      if (foundCount >= 2) matched.push(item);
    });
    return matched;
  }, [meds]);

  // Drug Interaction Sandbox
  const [testDrugA, setTestDrugA] = useState("Aspirin");
  const [testDrugB, setTestDrugB] = useState("Warfarin");
  const [testResult, setTestResult] = useState(null);

  const runInteractionTest = () => {
    const d1 = testDrugA.toLowerCase().trim();
    const d2 = testDrugB.toLowerCase().trim();
    const found = DRUG_INTERACTIONS.find(item => 
      (d1.includes(item.drugs[0]) && d2.includes(item.drugs[1])) ||
      (d1.includes(item.drugs[1]) && d2.includes(item.drugs[0]))
    );

    if (found) {
      setTestResult(found);
    } else {
      setTestResult({
        severity: 'safe',
        title: 'No Direct Adverse Interaction Detected',
        description: `No major adverse contraindications reported between ${testDrugA} and ${testDrugB} in current clinical pharmacology guidelines.`,
        action: 'Standard clinical administration recommended. Ensure adequate hydration.'
      });
    }
  };

  // Water Tracker
  const addWater = (ml) => {
    setWater(prev => Math.min(dailyGoal, Number((prev + ml / 1000).toFixed(2))));
    setPoints(p => p + 5);
  };

  // Guided Meditation Timer
  const [isMeditating, setIsMeditating] = useState(false);
  const [medTimer, setMedTimer] = useState(0);
  const [breathPhase, setBreathPhase] = useState("Inhale...");

  useEffect(() => {
    let interval = null;
    if (isMeditating) {
      interval = setInterval(() => {
        setMedTimer(t => t + 1);
        setTotalDayMeditation(t => t + 1);
      }, 1000);
    } else clearInterval(interval);
    return () => clearInterval(interval);
  }, [isMeditating]);

  useEffect(() => {
    if (!isMeditating) return;
    const cycle = medTimer % 12;
    if (cycle < 4) setBreathPhase("Inhale 4s...");
    else if (cycle < 8) setBreathPhase("Hold 4s...");
    else setBreathPhase("Exhale 4s...");
  }, [isMeditating, medTimer]);

  const formatSecs = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Emergency ICE QR Modal
  const [showIceModal, setShowIceModal] = useState(false);

  // Calendar
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayDateNum = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = new Date(year, month, 1).getDay();
  const monthName = now.toLocaleString('default', { month: 'long' });
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans pb-16 transition-colors duration-200">

      {/* ======================================================== */}
      {/* MEDICATION ALARM OVERLAY – fires when it's dose time     */}
      {/* ======================================================== */}
      {alarmRinging && alarmMed && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 max-w-sm w-full mx-4 text-center shadow-2xl border-4 border-red-500 animate-pulse">
            {/* Pulsing red glow ring */}
            <div className="absolute inset-0 rounded-3xl ring-4 ring-red-500/40 animate-ping pointer-events-none" />

            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
              <Bell className="text-red-500 animate-bounce" size={40} />
            </div>

            <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-1">Medication Reminder</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-1">
              {alarmMed.name}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Scheduled dose time: <strong className="text-red-500">{alarmMed.time}</strong>
            </p>

            <button
              onClick={stopAlarm}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-lg shadow-lg shadow-red-500/30 transition-all active:scale-95 cursor-pointer"
            >
              <BellOff size={22} /> Stop Alarm
            </button>

            <p className="mt-4 text-[11px] text-slate-400">
              Mark dose as taken from the Shinchan Pill Track tab after stopping the alarm.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-[1300px] mx-auto pt-6 px-4 sm:px-6">

        {/* ══ TOP BANNER WITH SHINCHAN MASCOT ══ */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                src="/assets/shinchan.png" 
                alt="Shinchan" 
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-md animate-[victory-bounce_1.5s_infinite_alternate_ease-in-out]" 
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent/10 text-accent flex items-center gap-1.5">
                  <Activity size={13} /> Health Tracker & Vitals Hub
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  Shinchan's Daily Mission
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Daily Health Tracker
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Shinchan: <span className="italic text-accent font-semibold">"Take your pills on time and drink water, or I'll tell Mom!"</span>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setShowVitalsModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-accent text-white hover:bg-accent/90 shadow-md shadow-accent/20 transition-all cursor-pointer"
            >
              <Edit3 size={15} /> Record My Vitals
            </button>

            <button
              onClick={() => setShowIceModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition-all cursor-pointer shadow-sm"
            >
              <QrCode size={15} /> Emergency ICE QR
            </button>

            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-xs font-bold">
              <Flame size={15} className="text-amber-500 animate-pulse" />
              <span>Score: <strong className="text-accent text-sm">{points} pts</strong></span>
            </div>
          </div>
        </div>

        {/* ══ NAVIGATION MODE TABS ══ */}
        <div className="flex gap-2 my-6 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab("tracker")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "tracker"
                ? "bg-accent text-white shadow-md shadow-accent/25"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-accent/40"
            }`}
          >
            <span>Shinchan Pill Track</span>
          </button>

          <button
            onClick={() => setActiveTab("vitals")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "vitals"
                ? "bg-accent text-white shadow-md shadow-accent/25"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-accent/40"
            }`}
          >
            <Activity size={15} /> Live Vitals & Biological Age
          </button>

          <button
            onClick={() => setActiveTab("habits")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer relative ${
              activeTab === "habits"
                ? "bg-accent text-white shadow-md shadow-accent/25"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-accent/40"
            }`}
          >
            <Droplets size={15} /> Hydration, Zen & Habits
            {detectedInteractions.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute top-2 right-2" />
            )}
          </button>
        </div>

        {/* ============================================================== */}
        {/* ================= TAB 1: SHINCHAN PILL TRACK & MEDS ========== */}
        {/* ============================================================== */}
        {activeTab === "tracker" && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Shinchan Animated Pill Path Card */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white m-0">
                      Shinchan's Medication Journey
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent/10 text-accent">
                      Step {currentIndex + 1} of {sortedMeds.length}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Shinchan hops along each pill as you take your daily doses. Tap <strong>Done</strong> to advance him!
                  </p>
                </div>

                <button
                  onClick={() => setShowAddMedModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-accent/20 cursor-pointer self-start sm:self-auto"
                >
                  <Plus size={15} /> Add Prescription
                </button>
              </div>

              {/* Pill Pillars Track with Shinchan Bouncing */}
              <div className="relative flex items-end justify-start gap-8 min-h-[380px] sm:min-h-[460px] my-6 border-b-4 border-slate-200 dark:border-slate-700 pb-[70px] overflow-x-auto px-6 scrollbar-thin">
                {sortedMeds.map((med, i) => {
                  const isCurrent = currentIndex === i;
                  return (
                    <div 
                      key={i} 
                      className={`relative w-[64px] shrink-0 flex flex-col justify-center items-center rounded-2xl transition-all duration-500 ${
                        isCurrent 
                          ? "bg-gradient-to-b from-[#4facfe] to-[#00f2fe] shadow-[0px_15px_30px_rgba(0,242,254,0.4)] -translate-y-4 scale-105 z-20" 
                          : "bg-gradient-to-b from-[#71b1ff] to-[#4a90e2] shadow-[0px_10px_20px_rgba(10,77,184,0.2)] z-0"
                      }`} 
                      style={{ height: med.height || '140px' }}
                    >
                      {/* Delete button */}
                      {i !== 0 && (
                        <button 
                          className="absolute top-2 right-2 w-[22px] h-[22px] bg-white/20 hover:bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-xs border-none cursor-pointer hover:scale-110 transition-all z-30" 
                          onClick={() => deleteMed(i)}
                          title="Remove dose"
                        >
                          ×
                        </button>
                      )}

                      {/* Pill Vertical Text */}
                      <div className="flex items-center justify-center h-full w-full overflow-hidden py-2">
                        <div 
                          className="[writing-mode:vertical-rl] font-extrabold text-white tracking-wider uppercase drop-shadow-md text-center transition-all select-none" 
                          style={{ fontSize: parseInt(med.height || '140', 10) < 140 ? '0.72rem' : '0.85rem' }}
                        >
                          {med.name}
                        </div>
                      </div>

                      {/* Time Tag */}
                      <div className="absolute -bottom-[32px] text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/80 px-2 py-0.5 rounded-md shadow-sm">
                        {med.time}
                      </div>

                      {/* 👦 SHINCHAN BOUNCING ON CURRENT ACTIVE PILL */}
                      {isCurrent && (
                        <>
                          <img 
                            src="/assets/shinchan.png" 
                            alt="Shinchan" 
                            className="absolute -top-[95px] w-[75px] sm:w-[90px] h-auto left-1/2 -translate-x-1/2 z-30 drop-shadow-2xl animate-[victory-bounce_0.8s_infinite_alternate_ease-in-out]" 
                          />

                          {/* Action Buttons for Shinchan's Current Dose */}
                          {i !== sortedMeds.length - 1 && (
                            <div className="absolute -top-[145px] flex gap-2 left-1/2 -translate-x-1/2 z-40 whitespace-nowrap">
                              <button 
                                className="px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black shadow-lg shadow-emerald-500/30 cursor-pointer transition-transform hover:scale-105" 
                                onClick={() => handlePillAction('done')}
                              >
                                ✓ Take Dose (+10 pts)
                              </button>
                              <button 
                                className="px-2.5 py-1.5 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition-transform" 
                                onClick={() => handlePillAction('skip')}
                              >
                                Skip
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Adherence summary */}
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="text-base">🏆</span>
                  <span><strong>Streak Bonus:</strong> Complete all doses before midnight to earn a gold day stamp on your monthly health calendar!</span>
                </div>
                <span className="font-bold text-accent shrink-0">Current Points: {points}</span>
              </div>
            </div>

            {/* Drug-Drug Safety Alert on Active Meds */}
            {detectedInteractions.length > 0 && (
              <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/30 border-2 border-red-500/30 text-red-900 dark:text-red-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={22} />
                  <div>
                    <h3 className="font-bold text-red-700 dark:text-red-400 text-sm">
                      ⚠️ Clinical Warning: Drug Interaction in Active Prescriptions
                    </h3>
                    <p className="text-xs text-red-600/90 dark:text-red-300 mt-0.5">
                      Cross-reaction detected: {detectedInteractions[0].title} ({detectedInteractions[0].drugs.join(" + ").toUpperCase()})
                    </p>
                    <p className="mt-1 text-[11px] text-slate-700 dark:text-slate-300">
                      {detectedInteractions[0].description}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* ================= TAB 2: LIVE VITALS & BIOLOGICAL AGE ======== */}
        {/* ============================================================== */}
        {activeTab === "vitals" && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* 💡 Clinical Explanation Box: How Vitals Are Recorded */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 border border-blue-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0 mt-0.5">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    How Are Your Vitals Recorded?
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    1. <strong>Manual Clinical Entry</strong>: Click <em>"Record My Vitals"</em> to input readings from your home Blood Pressure cuff, pulse oximeter, or glucometer.<br />
                    2. <strong>Wearable Bluetooth Telemetry</strong>: Connects with BLE monitors (Polar, Apple Watch export) to stream live cardiac rhythms.<br />
                    3. <strong>Demonstration Mode</strong>: Real-time pulse below reflects your logged heart rate with realistic natural variance.
                  </p>
                  <div className="mt-2 text-[11px] font-semibold text-slate-400">
                    Last Logged: <strong className="text-accent">{vitalsData.lastRecorded}</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowVitalsModal(true)}
                className="px-4 py-2.5 rounded-xl bg-accent text-white font-bold text-xs hover:bg-accent/90 shadow-md shadow-accent/20 transition-all shrink-0 self-start sm:self-auto cursor-pointer"
              >
                Log Reading Now
              </button>
            </div>

            {/* Live Cardiac Rhythm Bar */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-accent text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Heart className="animate-pulse text-white" size={22} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-100 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Continuous Rhythm Stream
                    </span>
                    <h3 className="text-xl font-black leading-tight">Cardiac Telemetry & ECG Waveform</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={triggerHrSpike}
                    disabled={isSpiking}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 transition-all cursor-pointer"
                  >
                    {isSpiking ? "Spiking..." : "Simulate Workout Spike"}
                  </button>

                  <button
                    onClick={() => setWearableSync(!wearableSync)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    {wearableSync ? "Pause" : "Sync"}
                  </button>
                </div>
              </div>

              {/* Animated ECG Pulse Waveform Line */}
              <div className="bg-black/25 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center justify-between overflow-hidden">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  ECG Lead II (Sinus Rhythm)
                </div>
                <svg className="w-full max-w-[480px] h-8 text-emerald-400" viewBox="0 0 500 40" preserveAspectRatio="none">
                  <path
                    d="M0,20 L40,20 L50,10 L60,30 L70,5 L80,35 L90,20 L180,20 L190,10 L200,30 L210,5 L220,35 L230,20 L320,20 L330,10 L340,30 L350,5 L360,35 L370,20 L460,20 L470,10 L480,30 L490,5 L500,20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="animate-[pulse_1.5s_infinite]"
                  />
                </svg>
                <span className="text-xs font-mono font-bold text-white/90">
                  {liveHr} BPM
                </span>
              </div>
            </div>

            {/* 6 Real Vitals Cards (Driven by Logged Data) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-rose-500 mb-1">
                  <Heart size={18} />
                  <span className="text-[10px] font-bold uppercase bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded text-rose-600 dark:text-rose-400">Normal</span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white leading-none my-1">{liveHr}</div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Heart Rate</div>
                <div className="text-[10px] text-slate-400 mt-0.5">BPM (Resting)</div>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-blue-500 mb-1">
                  <Wind size={18} />
                  <span className="text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400">Optimal</span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white leading-none my-1">{vitalsData.spo2}%</div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Blood Oxygen</div>
                <div className="text-[10px] text-slate-400 mt-0.5">SpO2 Arterial</div>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-purple-500 mb-1">
                  <Activity size={18} />
                  <span className="text-[10px] font-bold uppercase bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded text-purple-600 dark:text-purple-400">Target</span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white leading-none my-1">{vitalsData.bpSys}/{vitalsData.bpDia}</div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Blood Pressure</div>
                <div className="text-[10px] text-slate-400 mt-0.5">mmHg (Resting)</div>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-emerald-500 mb-1">
                  <Zap size={18} />
                  <span className="text-[10px] font-bold uppercase bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded text-emerald-600 dark:text-emerald-400">Fasting</span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white leading-none my-1">{vitalsData.bloodSugar}</div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Blood Glucose</div>
                <div className="text-[10px] text-slate-400 mt-0.5">mg/dL (Normal)</div>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-indigo-500 mb-1">
                  <Moon size={18} />
                  <span className="text-[10px] font-bold uppercase bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400">Restful</span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white leading-none my-1">{vitalsData.sleepHours}h</div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sleep Duration</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Last night's total</div>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-amber-500 mb-1">
                  <Flame size={18} />
                  <span className="text-[10px] font-bold uppercase bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded text-amber-600 dark:text-amber-400">78%</span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white leading-none my-1">{vitalsData.steps.toLocaleString()}</div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Daily Steps</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Goal: 10,000</div>
              </div>
            </div>

            {/* Epigenetic Biological Age Longevity Scorecard */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    🔬 Epigenetic Biological Age Scorecard
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    Cellular Longevity & Rejuvenation Engine
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Calculated live from your logged resting heart rate, blood pressure, sleep, and hydration.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-900 dark:to-slate-900/60 border border-slate-100 dark:border-slate-800">
                <div className="text-center md:border-r border-slate-200 dark:border-slate-800 pr-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Chronological Age</div>
                  <div className="text-4xl font-extrabold text-slate-700 dark:text-slate-300 my-1">{bioAgeData.chronological} <span className="text-sm font-normal">yrs</span></div>
                  <div className="text-xs text-slate-400">Calendar Years</div>
                </div>

                <div className="text-center md:border-r border-slate-200 dark:border-slate-800 px-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-accent">Biological Age</div>
                  <div className="text-5xl font-black text-accent my-1 leading-none">{bioAgeData.biological} <span className="text-sm font-normal">yrs</span></div>
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                    <Sparkles size={13} /> {Math.abs(bioAgeData.diff)} years {bioAgeData.isYounger ? "younger than calendar age!" : "older than calendar age"}
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-2 pl-2">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Key Longevity Drivers:</div>
                  <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>🫀 Resting HR ({vitalsData.heartRate} bpm)</span>
                      <strong className="text-emerald-600 font-bold">-1.2 yrs</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>💤 Restorative Sleep ({vitalsData.sleepHours} hrs)</span>
                      <strong className="text-emerald-600 font-bold">-1.0 yrs</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>🩸 Blood Pressure ({vitalsData.bpSys}/{vitalsData.bpDia})</span>
                      <strong className="text-emerald-600 font-bold">-0.8 yrs</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Drug Interaction Sandbox */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                  <ShieldAlert size={16} className="text-accent" /> Clinical Pharmacology Interaction Sandbox
                </div>
                <span className="text-xs text-slate-400">Test two medications</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 items-center">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Medication 1</label>
                  <input
                    type="text"
                    value={testDrugA}
                    onChange={(e) => setTestDrugA(e.target.value)}
                    placeholder="e.g. Aspirin"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Medication 2</label>
                  <input
                    type="text"
                    value={testDrugB}
                    onChange={(e) => setTestDrugB(e.target.value)}
                    placeholder="e.g. Warfarin"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold outline-none focus:border-accent"
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-1 pt-4">
                  <button
                    onClick={runInteractionTest}
                    className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs font-bold transition-all shadow-md shadow-accent/20 cursor-pointer"
                  >
                    🔍 Analyze Clinical Interaction
                  </button>
                </div>
              </div>

              {testResult && (
                <div className={`mt-4 p-4 rounded-xl border text-xs animate-fadeIn ${
                  testResult.severity === 'safe'
                    ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300"
                    : "bg-amber-50/80 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                }`}>
                  <div className="font-bold text-sm mb-1">{testResult.title}</div>
                  <p className="leading-relaxed mb-2">{testResult.description}</p>
                  <div className="font-semibold text-[11px]">
                    <strong>Recommendation:</strong> {testResult.action}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ================= TAB 3: HYDRATION, ZEN & HABITS ============= */}
        {/* ============================================================== */}
        {activeTab === "habits" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            
            {/* Water Tracker */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <Droplets className="text-blue-500" size={18} /> Hydration Station
                  </div>
                  <select
                    value={gender}
                    onChange={(e) => {
                      setGender(e.target.value);
                      setDailyGoal(e.target.value === 'male' ? 3.2 : 2.5);
                    }}
                    className="text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 outline-none"
                  >
                    <option value="female">Target: 2.5L / Day</option>
                    <option value="male">Target: 3.2L / Day</option>
                  </select>
                </div>

                <div className="relative w-40 h-40 mx-auto my-4 rounded-full border-4 border-blue-500/20 bg-blue-50 dark:bg-blue-950/30 overflow-hidden flex items-center justify-center shadow-inner">
                  <div
                    className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-blue-600 to-cyan-400 transition-all duration-700 opacity-80"
                    style={{ height: `${Math.min(100, (water / dailyGoal) * 100)}%` }}
                  />
                  <div className="relative z-10 text-center">
                    <div className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                      {Math.round((water / dailyGoal) * 100)}%
                    </div>
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-200 mt-1">
                      {water.toFixed(1)}L / {dailyGoal}L
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button
                    onClick={() => addWater(250)}
                    className="py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800 transition-all cursor-pointer"
                  >
                    + 250 ml (Glass)
                  </button>
                  <button
                    onClick={() => addWater(500)}
                    className="py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold text-xs shadow-md shadow-accent/20 transition-all cursor-pointer"
                  >
                    + 500 ml (Bottle)
                  </button>
                </div>
                <button
                  onClick={() => setWater(0)}
                  className="w-full mt-2 text-[11px] text-slate-400 hover:text-slate-600 text-center cursor-pointer"
                >
                  Reset Today's Water
                </button>
              </div>
            </div>

            {/* Guided Zen Breathing */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <Wind className="text-purple-500" size={18} /> Guided 4-4-4 Zen Breathing
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                    Total: {formatSecs(totalDayMeditation)}
                  </span>
                </div>

                <div className="relative w-40 h-40 mx-auto my-4 flex items-center justify-center">
                  <div
                    className={`absolute rounded-full bg-purple-500/20 transition-all duration-1000 ${
                      isMeditating ? "animate-ping" : "scale-100"
                    }`}
                    style={{ width: isMeditating ? '140px' : '90px', height: isMeditating ? '140px' : '90px' }}
                  />
                  <div
                    className={`relative w-28 h-28 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex flex-col items-center justify-center shadow-lg transition-transform duration-1000 ${
                      isMeditating && breathPhase.includes("Inhale") ? "scale-125" : isMeditating && breathPhase.includes("Exhale") ? "scale-90" : "scale-105"
                    }`}
                  >
                    <div className="text-xl font-mono font-black">{formatSecs(medTimer)}</div>
                    <div className="text-[10px] font-bold opacity-80 mt-0.5">
                      {isMeditating ? breathPhase.split(" ")[0] : "Ready"}
                    </div>
                  </div>
                </div>

                <div className="text-center font-bold text-sm text-purple-600 dark:text-purple-400 min-h-[20px]">
                  {isMeditating ? breathPhase : "Calm sympathetic nervous system"}
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={() => setIsMeditating(!isMeditating)}
                  className={`w-full py-3 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 ${
                    isMeditating
                      ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"
                      : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white shadow-purple-600/20"
                  }`}
                >
                  {isMeditating ? <><Square size={14} /> End Session</> : <><Play size={14} /> Start Mindfulness</>}
                </button>
              </div>
            </div>

            {/* Monthly Streak Calendar */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <Calendar className="text-amber-500" size={18} /> {monthName} {year}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <Flame size={14} /> {completedDays.length} Days Streak
                  </div>
                </div>

                <div className="grid grid-cols-7 text-center font-bold text-[11px] text-slate-400 mb-2">
                  {dayLabels.map(l => <span key={l}>{l}</span>)}
                </div>

                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {[...Array(startOffset)].map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}
                  {[...Array(daysInMonth)].map((_, i) => {
                    const dayNum = i + 1;
                    const dateKey = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
                    const isCompleted = completedDays.includes(dateKey);
                    const isToday = dayNum === todayDateNum;

                    return (
                      <div
                        key={dayNum}
                        className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all relative ${
                          isCompleted
                            ? "bg-emerald-500 text-white shadow-sm"
                            : isToday
                            ? "border-2 border-accent text-accent font-black"
                            : "bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {dayNum}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
                <span>Monthly Adherence:</span>
                <span className="font-bold text-emerald-600">
                  {Math.round((completedDays.length / daysInMonth) * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ══ MODAL 1: RECORD MANUAL VITALS ══ */}
      {showVitalsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-[480px] p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-fadeIn relative">
            <button
              onClick={() => setShowVitalsModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl font-bold w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>
            <div className="text-center mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-accent/10 text-accent">
                Clinical Vitals Entry
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                Record Today's Health Reading
              </h3>
              <p className="text-xs text-slate-500">
                Data updates your Biological Age Scorecard and live biometric cards immediately.
              </p>
            </div>

            <form onSubmit={handleSaveVitals} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Resting Heart Rate (BPM)
                  </label>
                  <input
                    type="number"
                    min="40"
                    max="200"
                    value={recordHeartRate}
                    onChange={(e) => setRecordHeartRate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Blood Oxygen SpO2 (%)
                  </label>
                  <input
                    type="number"
                    min="80"
                    max="100"
                    value={recordSpo2}
                    onChange={(e) => setRecordSpo2(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Blood Pressure (Systolic)
                  </label>
                  <input
                    type="number"
                    min="80"
                    max="220"
                    placeholder="120"
                    value={recordBpSys}
                    onChange={(e) => setRecordBpSys(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Blood Pressure (Diastolic)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="140"
                    placeholder="80"
                    value={recordBpDia}
                    onChange={(e) => setRecordBpDia(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Blood Glucose (mg/dL)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="400"
                    value={recordSugar}
                    onChange={(e) => setRecordSugar(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Sleep Last Night (Hours)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="2"
                    max="16"
                    value={recordSleep}
                    onChange={(e) => setRecordSleep(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Your Chronological Age (for Longevity Engine)
                </label>
                <input
                  type="number"
                  min="16"
                  max="99"
                  value={recordAge}
                  onChange={(e) => setRecordAge(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold outline-none focus:border-accent"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold text-xs shadow-md shadow-accent/25 transition-all cursor-pointer mt-3"
              >
                Save Reading & Recalculate Bio-Age (+20 pts)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL 2: ADD MEDICATION TO SHINCHAN TRACK ══ */}
      {showAddMedModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-[400px] p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-fadeIn relative">
            <button
              onClick={() => setShowAddMedModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl font-bold w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Add Medication to Shinchan's Track
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter name and time to create a new hopping pillar for Shinchan.
            </p>

            <form onSubmit={handleAddMed} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Medication Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metformin 500mg"
                  value={newMed.name}
                  onChange={(e) => setNewMed({...newMed, name: e.target.value})}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Scheduled Time *
                </label>
                <input
                  type="time"
                  required
                  value={newMed.time}
                  onChange={(e) => setNewMed({...newMed, time: e.target.value})}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm outline-none focus:border-accent"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-accent text-white font-bold text-xs hover:bg-accent/90 transition-all shadow-md shadow-accent/25 cursor-pointer mt-2"
              >
                Add Pill to Track (+15 pts)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL 3: EMERGENCY PARAMEDIC ICE QR ══ */}
      {showIceModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-[460px] p-6 shadow-2xl border-2 border-red-500/40 animate-fadeIn relative">
            <button
              onClick={() => setShowIceModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl font-bold w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>

            <div className="text-center mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400">
                🚨 Paramedic Emergency Medical Passport
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                ICE Lockscreen QR Code
              </h3>
              <p className="text-xs text-slate-500">
                Paramedics can scan this QR code to access your critical health data without unlocking device.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col items-center">
              <div className="w-36 h-36 bg-white p-2 rounded-xl shadow-md flex items-center justify-center">
                <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100">
                  <rect width="100" height="100" fill="#ffffff" />
                  <rect x="10" y="10" width="25" height="25" fill="#0f172a" />
                  <rect x="15" y="15" width="15" height="15" fill="#ffffff" />
                  <rect x="18" y="18" width="9" height="9" fill="#0f172a" />
                  <rect x="65" y="10" width="25" height="25" fill="#0f172a" />
                  <rect x="70" y="15" width="15" height="15" fill="#ffffff" />
                  <rect x="73" y="18" width="9" height="9" fill="#0f172a" />
                  <rect x="10" y="65" width="25" height="25" fill="#0f172a" />
                  <rect x="15" y="70" width="15" height="15" fill="#ffffff" />
                  <rect x="18" y="73" width="9" height="9" fill="#0f172a" />
                  <rect x="42" y="15" width="6" height="6" fill="#0f172a" />
                  <rect x="52" y="25" width="6" height="6" fill="#0f172a" />
                  <rect x="42" y="42" width="16" height="16" fill="#ef4444" rx="2" />
                  <path d="M47,50 L53,50 M50,47 L50,53" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  <rect x="65" y="45" width="8" height="8" fill="#0f172a" />
                  <rect x="78" y="55" width="10" height="6" fill="#0f172a" />
                  <rect x="45" y="68" width="12" height="6" fill="#0f172a" />
                  <rect x="65" y="75" width="15" height="12" fill="#0f172a" />
                </svg>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400 mt-2">
                UID: HEALTHAI-ICE-{Date.now().toString().slice(-6)}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-red-500/10 text-red-700 dark:text-red-300 font-bold">
                <span>Blood Group:</span>
                <span className="text-sm">O+ (Rh Positive)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                <span>Severe Allergies:</span>
                <span className="font-bold text-red-500">Penicillin, Peanuts</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                <span>Emergency Contact:</span>
                <span className="font-bold">+91 98765-43210 (Spouse)</span>
              </div>
            </div>

            <button
              onClick={() => setShowIceModal(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer"
            >
              Done & Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Meds;