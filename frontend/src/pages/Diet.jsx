import { useState } from "react";
import ReactMarkdown from "react-markdown"; 

const API_BASE = process.env.REACT_APP_API || "https://healthai-hub.onrender.com";

function Diet() {
  const [form, setForm] = useState({
    height: "",
    weight: "",
    age: "",
    gender: "male", 
    activity: "no exercise",
    condition: "",
    preference: "vegetarian",
  });
  
  const [ingredients, setIngredients] = useState("");
  const [recipeResult, setRecipeResult] = useState("");
  const [dietPlan, setDietPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [recipeLoading, setRecipeLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const generateDiet = async () => {
    if (!form.height || !form.weight) {
      alert("Please enter both height and weight.");
      return;
    }
    setLoading(true);
    setDietPlan("");

    try {
      const response = await fetch(`${API_BASE}/api/ai/generate-diet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          height: Number(form.height),
          weight: Number(form.weight),
          age: Number(form.age), 
          gender: form.gender, 
          activityLevel: form.activity,
          medicalIssues: form.condition ? [form.condition] : [],
          dietType: form.preference
        }),
      });
      const data = await response.json();
      if (data.success) setDietPlan(data.result);
      else alert(`Error: ${data.message || "Failed to generate diet plan"}`);
    } catch (error) {
      alert("Backend server connection error.");
    } finally {
      setLoading(false);
    }
  };

  const suggestRecipe = async () => {
    if (!ingredients) {
      alert("Please type some ingredients first!");
      return;
    }
    setRecipeLoading(true);
    setRecipeResult("");

    try {
      const response = await fetch(`${API_BASE}/api/ai/suggest-recipe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ingredients, 
          dietType: form.preference,
          condition: form.condition 
        }),
      });
      const data = await response.json();
      if (data.success) setRecipeResult(data.result);
      else alert("Failed to find a suitable recipe.");
    } catch (error) {
      alert("Error connecting to Recipe AI.");
    } finally {
      setRecipeLoading(false);
    }
  };

  return (
    <div className="bg-primary-light dark:bg-primary-dark min-h-screen py-10 px-5 transition-colors duration-300">
      <div className="max-w-[850px] mx-auto font-sans">
        
        {/* SECTION 1: DIET GENERATOR */}
        <div className="bg-white dark:bg-slate-800 p-[30px] rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.05)] mb-[30px] border border-slate-200 dark:border-slate-700 transition-colors duration-300">
          <h2 className="mt-0 text-accent text-2xl mb-2.5 text-center font-bold">AI Diet Generator</h2>
          <div className="flex flex-col">
            <label className="block font-semibold my-[15px] mb-2 text-slate-800 dark:text-slate-200 text-sm">Physical Stats</label>
            <div className="flex flex-col sm:flex-row gap-[15px] items-stretch sm:items-end">
              <input className="flex-1 w-full p-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-[15px] text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 transition-all focus:border-accent focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:shadow-[0_0_0_4px_rgba(10,77,184,0.1)]" name="height" type="number" placeholder="Height (cm)" value={form.height} onChange={handleChange} />
              <input className="flex-1 w-full p-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-[15px] text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 transition-all focus:border-accent focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:shadow-[0_0_0_4px_rgba(10,77,184,0.1)]" name="weight" type="number" placeholder="Weight (kg)" value={form.weight} onChange={handleChange} />
              <input className="flex-1 w-full p-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-[15px] text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 transition-all focus:border-accent focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:shadow-[0_0_0_4px_rgba(10,77,184,0.1)]" name="age" type="number" placeholder="Age" value={form.age} onChange={handleChange} />
            </div>

            <div className="flex flex-col sm:flex-row gap-[15px] items-stretch sm:items-end mt-2.5">
              <select className="flex-1 w-full p-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-[15px] text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 transition-all focus:border-accent focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:shadow-[0_0_0_4px_rgba(10,77,184,0.1)]" name="gender" value={form.gender} onChange={handleChange}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>

              <select className="flex-1 w-full p-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-[15px] text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 transition-all focus:border-accent focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:shadow-[0_0_0_4px_rgba(10,77,184,0.1)]" name="activity" value={form.activity} onChange={handleChange}>
                <option value="no exercise">No Exercise</option>
                <option value="walking">Walking</option>
                <option value="yoga">Yoga</option>
                <option value="gym">Gym / Heavy Workout</option>
              </select>
            </div>

            <label className="block font-semibold my-[15px] mb-2 text-slate-800 dark:text-slate-200 text-sm">Health Conditions</label>
            <input className="w-full p-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-[15px] text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 transition-all focus:border-accent focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:shadow-[0_0_0_4px_rgba(10,77,184,0.1)]" name="condition" placeholder="e.g., diabetes, stone" value={form.condition} onChange={handleChange} />

            <label className="block font-semibold my-[15px] mb-2 text-slate-800 dark:text-slate-200 text-sm">Dietary Preference</label>
            <select className="w-full p-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-[15px] text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 transition-all focus:border-accent focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:shadow-[0_0_0_4px_rgba(10,77,184,0.1)]" name="preference" value={form.preference} onChange={handleChange}>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="eggitarian">Eggitarian</option>
              <option value="non-veg">Non-Vegetarian</option>
            </select>

            <button 
              className={`bg-gradient-to-br from-accent to-indigo-700 text-white border-none p-4 w-full rounded-xl text-base font-bold cursor-pointer mt-6 transition-all ${loading ? 'bg-slate-300 cursor-not-allowed transform-none' : 'hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(10,77,184,0.3)]'}`} 
              onClick={generateDiet} 
              disabled={loading}
            >
              {loading ? " Preparing Your Plan..." : "Generate Diet Plan"}
            </button>
          </div>
        </div>

        {/* SECTION 2: SMART RECIPE FINDER */}
        <div className="bg-white dark:bg-slate-800 p-[30px] rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.05)] mb-[30px] border border-slate-200 dark:border-slate-700 transition-colors duration-300">
          <h2 className="mt-0 text-accent text-2xl mb-2.5 text-center font-bold">Smart Recipe Finder</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">Type ingredients to get a healthy recipe based on your profile.</p>
          
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input 
              className="flex-[3] w-full p-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-[15px] text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 transition-all focus:border-accent focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:shadow-[0_0_0_4px_rgba(10,77,184,0.1)]"
              placeholder="Oats, Apple, Honey..." 
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
            />
            <button 
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white border-none p-3 rounded-xl font-bold cursor-pointer transition-colors" 
              onClick={suggestRecipe} 
              disabled={recipeLoading}
            >
              {recipeLoading ? "..." : "Find Recipe"}
            </button>
          </div>

          {recipeResult && (
            <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-5 mt-5 border-l-4 border-emerald-500 text-emerald-800 dark:text-emerald-100 prose prose-emerald dark:prose-invert max-w-none">
              <ReactMarkdown>{recipeResult}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* DIET PLAN RESULT */}
        {dietPlan && (
          <div className="bg-white dark:bg-slate-800 p-[30px] rounded-2xl mt-[30px] border border-slate-200 dark:border-slate-700 shadow-[0_4px_20px_rgba(0,0,0,0.05)] overflow-x-auto transition-colors duration-300">
            <h3 className="text-slate-900 dark:text-slate-100 border-b-2 border-accent inline-block pb-1.5 mb-5 font-bold text-xl"> Your Personalized Plan</h3>
            <div className="prose prose-slate dark:prose-invert max-w-none prose-th:bg-slate-100 dark:prose-th:bg-slate-800 prose-th:text-accent prose-th:p-4 prose-th:border-b-2 prose-th:border-slate-300 dark:prose-th:border-slate-600 prose-td:p-3 prose-td:border-b prose-td:border-slate-100 dark:prose-td:border-slate-700 prose-tr:hover:bg-slate-50 dark:prose-tr:hover:bg-slate-800/50">
              <ReactMarkdown>{dietPlan}</ReactMarkdown>
            </div>
          </div>
        )}

        <p className="text-center text-[13px] text-slate-400 mt-[30px] italic">⚠️ AI suggestions are for guidance only. Consult a doctor for medical conditions.</p>
      </div>
    </div>
  );
}

export default Diet;