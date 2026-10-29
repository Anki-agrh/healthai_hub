import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Camera, Zap, BarChart2, Calendar, Target, Flame, ChevronRight, Check } from "lucide-react";

const API_BASE = process.env.REACT_APP_API || "https://healthai-hub.onrender.com";

// ──────────── EXTRAORDINARY FEATURE 1: Live Macro Calculator ────────────
function calcTDEE(weight, height, age, gender, activity) {
  let bmr = gender === 'female'
    ? 10 * weight + 6.25 * height - 5 * age - 161
    : 10 * weight + 6.25 * height - 5 * age + 5;
  const mult = { 'no exercise': 1.2, 'walking': 1.375, 'yoga': 1.465, 'gym': 1.725 };
  return Math.round(bmr * (mult[activity] || 1.2));
}
function calcMacros(tdee, goal, preference) {
  const cals = goal === 'loss' ? tdee - 500 : goal === 'gain' ? tdee + 300 : tdee;
  const protein = goal === 'gain' ? Math.round(cals * 0.35 / 4) : Math.round(cals * 0.3 / 4);
  const fat = Math.round(cals * 0.25 / 9);
  const carbs = Math.round((cals - protein * 4 - fat * 9) / 4);
  return { cals, protein, carbs, fat };
}

// ──────────── EXTRAORDINARY FEATURE 2: AI Food Scanner (Image Analysis) ────────────
// ──────────── EXTRAORDINARY FEATURE 3: 7-Day Meal Schedule Builder ────────────
const MEAL_TEMPLATES = {
  vegetarian: {
    mon: { breakfast: 'Oats + banana + almond milk', lunch: 'Dal + roti + salad', dinner: 'Paneer sabzi + brown rice', snack: 'Apple + walnuts' },
    tue: { breakfast: 'Idli + sambar', lunch: 'Rajma + brown rice', dinner: 'Mixed veg curry + roti', snack: 'Sprouts chaat' },
    wed: { breakfast: 'Upma + coconut chutney', lunch: 'Chole + jeera rice', dinner: 'Palak paneer + roti', snack: 'Makhana' },
    thu: { breakfast: 'Poha + peanuts', lunch: 'Moong dal + roti + curd', dinner: 'Aloo gobi + brown rice', snack: 'Banana' },
    fri: { breakfast: 'Dosa + sambar', lunch: 'Kadhi + jeera rice', dinner: 'Tofu stir fry + roti', snack: 'Mixed nuts' },
    sat: { breakfast: 'Besan chilla + mint chutney', lunch: 'Lemon rice + papad', dinner: 'Veg biryani + raita', snack: 'Guava' },
    sun: { breakfast: 'Smoothie bowl + granola', lunch: 'Khichdi + ghee', dinner: 'Masoor dal + roti + salad', snack: 'Dates + almonds' },
  },
  'non-veg': {
    mon: { breakfast: 'Eggs scrambled + toast', lunch: 'Chicken curry + rice', dinner: 'Grilled fish + salad', snack: 'Boiled eggs' },
    tue: { breakfast: 'Egg omelet + oats', lunch: 'Mutton curry + roti', dinner: 'Chicken stir fry + brown rice', snack: 'Greek yogurt' },
    wed: { breakfast: 'Chicken sandwich + juice', lunch: 'Fish curry + rice', dinner: 'Egg bhurji + roti', snack: 'Cheese + crackers' },
    thu: { breakfast: 'Boiled eggs + banana', lunch: 'Egg fried rice', dinner: 'Grilled chicken + veggies', snack: 'Peanut butter toast' },
    fri: { breakfast: 'Omelette + toast', lunch: 'Chicken biryani', dinner: 'Fish tikka + dal', snack: 'Cottage cheese' },
    sat: { breakfast: 'Egg dosa', lunch: 'Mutton rogan josh + roti', dinner: 'Baked chicken + salad', snack: 'Protein bar' },
    sun: { breakfast: 'Eggs benedict', lunch: 'Chicken pulao + raita', dinner: 'Grilled prawns + rice', snack: 'Nuts & fruits' },
  },
  vegan: {
    mon: { breakfast: 'Chia pudding + berries', lunch: 'Lentil soup + quinoa', dinner: 'Tofu curry + brown rice', snack: 'Apple + almond butter' },
    tue: { breakfast: 'Smoothie + granola', lunch: 'Chickpea salad', dinner: 'Black bean tacos', snack: 'Edamame' },
    wed: { breakfast: 'Oats + flaxseed + berries', lunch: 'Hummus wrap + veggies', dinner: 'Veggie stir fry + tofu', snack: 'Mixed nuts' },
    thu: { breakfast: 'Avocado toast', lunch: 'Quinoa bowl', dinner: 'Lentil dal + roti', snack: 'Dates + cashews' },
    fri: { breakfast: 'Banana pancakes', lunch: 'Falafel + pita', dinner: 'Tempeh curry + rice', snack: 'Mango' },
    sat: { breakfast: 'Acai bowl', lunch: 'Buddha bowl', dinner: 'Mushroom biryani', snack: 'Trail mix' },
    sun: { breakfast: 'Green smoothie', lunch: 'Lentil tacos', dinner: 'Stuffed peppers', snack: 'Coconut yogurt' },
  }
};
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const GOAL_PRESETS = [
  { id: 'loss', label: 'Fat Loss', desc: '-500 cal deficit', color: 'text-red-600' },
  { id: 'maintain', label: 'Maintain', desc: 'Calorie balanced', color: 'text-amber-600' },
  { id: 'gain', label: 'Muscle Gain', desc: '+300 cal surplus', color: 'text-emerald-600' },
];

// Macro Donut Chart Component
function MacroDonut({ protein, carbs, fat, cals }) {
  const total = protein * 4 + carbs * 4 + fat * 9;
  const proteinPct = Math.round((protein * 4 / total) * 100);
  const carbsPct = Math.round((carbs * 4 / total) * 100);
  const fatPct = 100 - proteinPct - carbsPct;
  const r = 52, cx = 64, cy = 64;
  const circ = 2 * Math.PI * r;

  const segments = [
    { pct: proteinPct, color: '#0a4db8', label: 'Protein' },
    { pct: carbsPct, color: '#10b981', label: 'Carbs' },
    { pct: fatPct, color: '#f59e0b', label: 'Fat' },
  ];

  let offset = 0;
  return (
    <div className="flex items-center gap-6 flex-wrap justify-center">
      <div className="relative">
        <svg width="128" height="128" className="-rotate-90">
          {segments.map((s, i) => {
            const strokeDash = (s.pct / 100) * circ;
            const el = (
              <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color}
                strokeWidth="16" strokeDasharray={`${strokeDash} ${circ - strokeDash}`}
                strokeDashoffset={-offset * circ / 100} strokeLinecap="round" style={{ transition: 'all 0.6s ease' }} />
            );
            offset += s.pct;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <span className="text-xl font-extrabold text-slate-800 dark:text-white">{cals}</span>
          <span className="text-[10px] text-slate-400 font-semibold">kcal</span>
        </div>
      </div>
      <div className="space-y-2">
        {[
          { label: 'Protein', value: `${protein}g`, pct: proteinPct, color: 'bg-accent', textColor: 'text-accent' },
          { label: 'Carbs', value: `${carbs}g`, pct: carbsPct, color: 'bg-emerald-500', textColor: 'text-emerald-600' },
          { label: 'Fat', value: `${fat}g`, pct: fatPct, color: 'bg-amber-500', textColor: 'text-amber-600' },
        ].map((m, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${m.color}`} />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 w-12">{m.label}</span>
            <span className={`text-xs font-bold ${m.textColor}`}>{m.value}</span>
            <span className="text-xs text-slate-400">({m.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Diet() {
  const [form, setForm] = useState({ height: '', weight: '', age: '', gender: 'male', activity: 'no exercise', condition: '', preference: 'vegetarian' });
  const [ingredients, setIngredients] = useState('');
  const [recipeResult, setRecipeResult] = useState('');
  const [dietPlan, setDietPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipeLoading, setRecipeLoading] = useState(false);

  // Feature 1: Macro targets
  const [macros, setMacros] = useState(null);
  const [goalMode, setGoalMode] = useState('maintain');
  const [showMacroPanel, setShowMacroPanel] = useState(false);

  // Feature 2: AI Food Scanner
  const [foodImage, setFoodImage] = useState(null);
  const [foodAnalysis, setFoodAnalysis] = useState('');
  const [foodLoading, setFoodLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Feature 3: Meal Schedule
  const [showMealSchedule, setShowMealSchedule] = useState(false);
  const [activeDay, setActiveDay] = useState('mon');

  const resultRef = useRef(null);
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const calcAndShowMacros = () => {
    if (!form.height || !form.weight || !form.age) { alert('Enter height, weight, and age first.'); return; }
    const tdee = calcTDEE(+form.weight, +form.height, +form.age, form.gender, form.activity);
    const m = calcMacros(tdee, goalMode, form.preference);
    setMacros({ ...m, tdee });
    setShowMacroPanel(true);
  };

  const generateDiet = async () => {
    if (!form.height || !form.weight) { alert('Please enter height and weight.'); return; }
    setLoading(true);
    setDietPlan('');
    if (!macros) calcAndShowMacros();
    try {
      const response = await fetch(`${API_BASE}/api/ai/generate-diet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ height: +form.height, weight: +form.weight, age: +form.age, gender: form.gender, activityLevel: form.activity, medicalIssues: form.condition ? [form.condition] : [], dietType: form.preference }),
      });
      const data = await response.json();
      if (data.success) { setDietPlan(data.result); setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 200); }
      else alert(`Error: ${data.message}`);
    } catch { alert('Backend connection error.'); }
    finally { setLoading(false); }
  };

  const suggestRecipe = async () => {
    if (!ingredients) { alert('Type some ingredients first!'); return; }
    setRecipeLoading(true); setRecipeResult('');
    try {
      const response = await fetch(`${API_BASE}/api/ai/suggest-recipe`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients, dietType: form.preference, condition: form.condition }),
      });
      const data = await response.json();
      if (data.success) setRecipeResult(data.result);
      else alert('Failed to find a recipe.');
    } catch { alert('Error connecting to Recipe AI.'); }
    finally { setRecipeLoading(false); }
  };

  // Feature 2: Food Scanner
  const scanFood = async () => {
    if (!foodImage) { alert('Please select a food image first.'); return; }
    setFoodLoading(true); setFoodAnalysis('');
    try {
      const formData = new FormData();
      formData.append('report', foodImage);
      const res = await fetch(`${API_BASE}/api/ai/analyze-report`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) setFoodAnalysis(data.result);
      else setFoodAnalysis('AI could not analyze the image. Please try with a clearer food photo.');
    } catch { setFoodAnalysis('AI analysis offline. Please check backend connection.'); }
    finally { setFoodLoading(false); }
  };

  const mealSchedule = MEAL_TEMPLATES[form.preference] || MEAL_TEMPLATES.vegetarian;
  const bmi = form.height && form.weight ? (parseFloat(form.weight) / ((parseFloat(form.height) / 100) ** 2)).toFixed(1) : null;
  const bmiInfo = bmi ? (bmi < 18.5 ? { label: 'Underweight', color: 'text-amber-500' } : bmi < 25 ? { label: 'Normal ✓', color: 'text-emerald-600' } : bmi < 30 ? { label: 'Overweight', color: 'text-orange-500' } : { label: 'Obese', color: 'text-red-500' }) : null;

  const inputCls = "w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all";
  const labelCls = "block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 mt-4";

  return (
    <div className="max-w-[900px] mx-auto py-8 px-4 sm:px-6 animate-fadeSlideIn">

      {/* ── Page Header ── */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent mb-3">
          <Zap size={13} /> AI-Powered Nutrition Engine
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Smart Diet Planner</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Clinically-informed nutrition plans · Live macro tracking · AI food scanner · Weekly meal planner
        </p>
      </div>

      {/* ══ EXTRAORDINARY FEATURE 1: Live Macro & TDEE Calculator ══ */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 border border-blue-200 dark:border-slate-700 rounded-2xl p-5 mb-5 shadow-sm">
        <button onClick={() => setShowMacroPanel(s => !s)} className="w-full flex items-center justify-between text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
              <BarChart2 size={20} className="text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Live Macro & TDEE Calculator</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Real-time calorie targets with personalized macro split (Protein/Carbs/Fat)</p>
            </div>
          </div>
          <ChevronRight size={18} className={`text-slate-400 transition-transform ${showMacroPanel ? 'rotate-90' : ''}`} />
        </button>

        {showMacroPanel && (
          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-slate-700">
            {/* Goal selector */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {GOAL_PRESETS.map(g => (
                <button key={g.id} onClick={() => setGoalMode(g.id)}
                  className={`flex-1 min-w-[100px] px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-center ${goalMode === g.id ? 'bg-accent text-white border-accent shadow-md shadow-accent/25' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-accent/40'}`}>
                  {g.label}<br /><span className="font-normal opacity-70">{g.desc}</span>
                </button>
              ))}
            </div>
            <button onClick={calcAndShowMacros}
              className="w-full py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-bold transition-colors mb-4">
              ⚡ Calculate My Targets
            </button>
            {macros && (
              <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-4">
                  <Flame size={16} className="text-orange-500" />
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Your TDEE: <span className="text-accent">{macros.tdee} kcal/day</span></span>
                  <span className="text-xs text-slate-400">→ Target: <strong className="text-slate-700 dark:text-slate-200">{macros.cals} kcal</strong></span>
                </div>
                <MacroDonut {...macros} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ EXTRAORDINARY FEATURE 2: AI Food Scanner ══ */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-800 border border-emerald-200 dark:border-slate-700 rounded-2xl p-5 mb-5 shadow-sm">
        <button onClick={() => setShowScanner(s => !s)} className="w-full flex items-center justify-between text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <Camera size={20} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm"> AI Food Scanner — Snap to Analyze</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Upload a food photo to get instant AI nutritional breakdown & calories</p>
            </div>
          </div>
          <ChevronRight size={18} className={`text-slate-400 transition-transform ${showScanner ? 'rotate-90' : ''}`} />
        </button>

        {showScanner && (
          <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-slate-700">
            <div className="flex gap-3 flex-wrap sm:flex-nowrap items-center">
              <label className="flex-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-emerald-300 dark:border-slate-600 rounded-xl p-5 cursor-pointer hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors">
                {foodImage
                  ? <span className="text-sm font-semibold text-emerald-600">{foodImage.name}</span>
                  : <>
                    <Camera size={28} className="text-emerald-400" />
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Click to upload food photo</span>
                    <span className="text-xs text-slate-400">PNG, JPG, JPEG</span>
                  </>}
                <input type="file" hidden accept=".jpg,.jpeg,.png,.webp" onChange={e => { setFoodImage(e.target.files[0]); setFoodAnalysis(''); }} />
              </label>
              <button onClick={scanFood} disabled={!foodImage || foodLoading}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors whitespace-nowrap">
              {foodLoading ? 'Scanning…' : 'Analyze Food'}
              </button>
            </div>
            {foodAnalysis && (
              <div className="mt-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Check size={16} className="text-emerald-600" />
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">AI Nutrition Analysis</span>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{foodAnalysis}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ EXTRAORDINARY FEATURE 3: 7-Day AI Meal Schedule ══ */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-800 border border-purple-200 dark:border-slate-700 rounded-2xl p-5 mb-5 shadow-sm">
        <button onClick={() => setShowMealSchedule(s => !s)} className="w-full flex items-center justify-between text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
              <Calendar size={20} className="text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">7-Day Smart Meal Schedule</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Auto-generated weekly meal plan based on your dietary preference</p>
            </div>
          </div>
          <ChevronRight size={18} className={`text-slate-400 transition-transform ${showMealSchedule ? 'rotate-90' : ''}`} />
        </button>

        {showMealSchedule && (
          <div className="mt-4 pt-4 border-t border-purple-200 dark:border-slate-700">
            {/* Day Tabs */}
            <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
              {DAYS.map((d, i) => (
                <button key={d} onClick={() => setActiveDay(d)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${activeDay === d ? 'bg-accent text-white shadow-md shadow-accent/25' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-accent/40'}`}>
                  {DAY_LABELS[i]}
                </button>
              ))}
            </div>

            {/* Day Meals */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {[
                { meal: 'Breakfast', key: 'breakfast', color: 'border-amber-400' },
                { meal: 'Lunch', key: 'lunch', color: 'border-accent' },
                { meal: 'Snack', key: 'snack', color: 'border-emerald-400' },
                { meal: 'Dinner', key: 'dinner', color: 'border-purple-400' },
              ].map((m, i) => (
                <div key={i} className={`flex items-center gap-4 p-4 border-l-4 ${m.color} ${i < 3 ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}>
                  <span className="text-2xl shrink-0">{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{m.meal}</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5 truncate">
                      {mealSchedule[activeDay]?.[m.key] || '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-400 mt-3 text-center">
              Meal plan auto-generated for <strong className="text-accent">{form.preference}</strong> preference · Tap days to switch
            </p>
          </div>
        )}
      </div>

      {/* ── Main Diet Form ── */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm mb-5">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">Your Health Profile</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">AI uses this to calculate exact macro & micronutrient targets</p>

        {/* BMI Badge */}
        {bmi && bmiInfo && (
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-bold mb-4 ${bmiInfo.label.includes('Normal') ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
            <Target size={14} className={bmiInfo.color} />
            <span className={bmiInfo.color}>BMI {bmi} — {bmiInfo.label}</span>
          </div>
        )}

        <label className={labelCls}>Physical Stats</label>
        <div className="grid grid-cols-3 gap-3">
          <input className={inputCls} name="height" type="number" placeholder="Height (cm)" value={form.height} onChange={handleChange} />
          <input className={inputCls} name="weight" type="number" placeholder="Weight (kg)" value={form.weight} onChange={handleChange} />
          <input className={inputCls} name="age" type="number" placeholder="Age" value={form.age} onChange={handleChange} />
        </div>

        <label className={labelCls}>Biological & Lifestyle</label>
        <div className="grid grid-cols-2 gap-3">
          <select className={inputCls} name="gender" value={form.gender} onChange={handleChange}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <select className={inputCls} name="activity" value={form.activity} onChange={handleChange}>
            <option value="no exercise">Sedentary (No Exercise)</option>
            <option value="walking">Light (Walking)</option>
            <option value="yoga">Moderate (Yoga)</option>
            <option value="gym">Active (Gym/Sports)</option>
          </select>
        </div>

        <label className={labelCls}>Health Conditions</label>
        <input className={inputCls} name="condition" placeholder="e.g., diabetes, hypertension, PCOS" value={form.condition} onChange={handleChange} />

        <label className={labelCls}>Dietary Preference</label>
        <div className="grid grid-cols-4 gap-2">
          {['vegetarian', 'vegan', 'eggitarian', 'non-veg'].map(p => (
            <button key={p} onClick={() => setForm({ ...form, preference: p })}
              className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${form.preference === p ? 'bg-accent text-white border-accent shadow-md shadow-accent/20' : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-accent/40'}`}>
              {p === 'vegetarian' ? 'Veg' : p === 'vegan' ? 'Vegan' : p === 'eggitarian' ? 'Egg' : 'Non-Veg'}
            </button>
          ))}
        </div>

        <button onClick={generateDiet} disabled={loading}
          className={`w-full mt-6 py-4 rounded-xl text-base font-bold transition-all ${loading ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-accent to-indigo-700 text-white hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(10,77,184,0.3)]'}`}>
          {loading ? 'Generating Your Personalized Plan…' : 'Generate AI Diet Plan'}
        </button>
      </div>

      {/* ── Smart Recipe Finder ── */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm mb-5">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1"> Smart Recipe Finder</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">Type ingredients you have — AI crafts the perfect healthy recipe.</p>
        <div className="flex gap-3 flex-wrap sm:flex-nowrap">
          <input className={`${inputCls} flex-1`} placeholder="Oats, banana, honey..." value={ingredients} onChange={e => setIngredients(e.target.value)} />
          <button onClick={suggestRecipe} disabled={recipeLoading}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-colors whitespace-nowrap">
            {recipeLoading ? '…' : 'Find Recipe'}
          </button>
        </div>
        {recipeResult && (
          <div className="mt-4 p-5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border-l-4 border-emerald-500 text-emerald-800 dark:text-emerald-100 prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{recipeResult}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* ── Diet Plan Result ── */}
      {dietPlan && (
        <div ref={resultRef} className="bg-white dark:bg-slate-800 border border-accent/30 rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center"><Flame size={22} className="text-accent" /></div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Your Personalized Diet Plan</h3>
              <p className="text-xs text-slate-400">Generated by Gemini AI · Based on your unique health profile</p>
            </div>
          </div>
          <div className="prose prose-slate dark:prose-invert max-w-none prose-th:bg-slate-100 dark:prose-th:bg-slate-900 prose-th:text-accent prose-th:p-3 prose-td:p-3 prose-td:border-b prose-td:border-slate-100 dark:prose-td:border-slate-700 prose-tr:hover:bg-slate-50 dark:prose-tr:hover:bg-slate-800/50">
            <ReactMarkdown>{dietPlan}</ReactMarkdown>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-slate-400 mt-6 italic">
        ⚠️ AI suggestions are for guidance only. Consult a registered dietitian or doctor for medical conditions.
      </p>
    </div>
  );
}

export default Diet;