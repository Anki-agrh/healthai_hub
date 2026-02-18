import { useState } from "react";
import ReactMarkdown from "react-markdown"; 
import "./Diet.css";
const API_BASE = process.env.REACT_APP_API || "https://healthai-hub.onrender.com";

function Diet() {
  const [form, setForm] = useState({
    height: "",
    weight: "",
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
    <div className="diet-page-wrapper">
      <div className="diet-container">
        
        {/* SECTION 1: DIET GENERATOR */}
        <div className="diet-section-card">
          <h2>AI Diet Generator</h2>
          <div className="form-group">
            <label>Physical Stats</label>
            <div className="stats-row">
              <input name="height" type="number" placeholder="Height (cm)" value={form.height} onChange={handleChange} />
              <input name="weight" type="number" placeholder="Weight (kg)" value={form.weight} onChange={handleChange} />
            </div>

            <label>Health Conditions</label>
            <input name="condition" placeholder="e.g., diabetese, stone" value={form.condition} onChange={handleChange} />

            <label>Dietary Preference</label>
            <select name="preference" value={form.preference} onChange={handleChange}>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="eggitarian">Eggitarian</option>
              <option value="non-veg">Non-Vegetarian</option>
            </select>

            <button className="primary-btn" onClick={generateDiet} disabled={loading}>
              {loading ? " Preparing Your Plan..." : "Generate Diet Plan"}
            </button>
          </div>
        </div>

        {/* SECTION 2: SMART RECIPE FINDER */}
        <div className="diet-section-card">
          <h2>Smart Recipe Finder</h2>
          <p className="sub-text">Type ingredients to get a healthy recipe based on your profile.</p>
          
          <div className="recipe-input-group">
            <input 
              placeholder="Oats, Apple, Honey..." 
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
            />
            <button className="recipe-btn" onClick={suggestRecipe} disabled={recipeLoading}>
              {recipeLoading ? "..." : "Find Recipe"}
            </button>
          </div>

          {recipeResult && (
            <div className="recipe-result">
              <ReactMarkdown>{recipeResult}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* DIET PLAN RESULT */}
        {dietPlan && (
          <div className="diet-result">
            <h3> Your Personalized Plan</h3>
            <ReactMarkdown>{dietPlan}</ReactMarkdown>
          </div>
        )}

        <p className="diet-note">⚠️ AI suggestions are for guidance only. Consult a doctor for medical conditions.</p>
      </div>
    </div>
  );
}

export default Diet;