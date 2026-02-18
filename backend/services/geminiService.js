const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

// IMPORTANT: make sure dotenv is loaded in your main server file
// require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let activeModel = null;

/* -------------------- MODEL SELECTOR -------------------- */
async function getWorkingModel() {
  if (activeModel) return activeModel;

  const modelPriority = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-pro"
  ];

  for (const name of modelPriority) {
    try {
      const model = genAI.getGenerativeModel({ model: name });

      // test request (very small)
      await model.generateContent("hello");

      console.log("Using model:", name);
      activeModel = model;
      return model;

    } catch (e) {
      console.log("Model not available:", name);
    }
  }

  throw new Error("No Gemini model available for this API key");
}

/* -------------------- SAFE GENERATE -------------------- */
async function safeGenerate(prompt, parts = null) {
  try {
    const model = await getWorkingModel();

    let result;

    // multimodal safe format
    if (parts) {
      result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{ text: prompt }, ...parts]
        }]
      });
    } else {
      result = await model.generateContent(prompt);
    }

    return result.response.text();

  } catch (error) {

    if (error.status === 429) {
      return "⚠️ AI quota finished for today. Please try again tomorrow.";
    }

    console.error("Gemini Error:", error.message);
    return "AI temporarily unavailable. Please try again later.";
  }
}

/* -------------------- REPORT ANALYSIS -------------------- */
async function analyzeReport(filePath, mimeType = "image/png") {
  const fileData = fs.readFileSync(filePath);

  const imageParts = [{
    inlineData: {
      data: fileData.toString("base64"),
      mimeType
    }
  }];

  const prompt =
    "Analyze this medical report in simple language. Suggest a specialist doctor and include an AI disclaimer.";

  return await safeGenerate(prompt, imageParts);
}

/* -------------------- SYMPTOMS -------------------- */
async function suggestDoctorBySymptoms(symptoms) {
  const prompt =
    `User symptoms: ${symptoms}. Suggest the correct specialist and give 2 basic care tips. Add AI disclaimer.`;

  return await safeGenerate(prompt);
}

/* -------------------- DIET PLAN -------------------- */
async function generateDietPlan(userData) {
  const prompt = `
You are a professional clinical nutritionist.

Height: ${userData.height} cm
Weight: ${userData.weight} kg
Medical Issues: ${(userData.medicalIssues || []).join(", ") || "None"}
Diet Type: ${userData.dietType}

Provide:
1. Estimated daily calories
2. 4-meal plan (Breakfast, Lunch, Snack, Dinner)
3. Advice based on medical conditions

Add AI disclaimer.
Format in Markdown.
`;

  return await safeGenerate(prompt);
}

/* -------------------- RECIPE -------------------- */
async function suggestRecipe(ingredients, dietType, condition) {
  const prompt = `
Act as a nutritionist.

Ingredients available: ${ingredients}
Diet preference: ${dietType}
Health condition: ${condition || "none"}

Suggest one healthy recipe using these ingredients.
Provide:
- Recipe name
- Ingredients list
- Step-by-step cooking instructions

Add AI disclaimer.
Format in Markdown.
`;

  return await safeGenerate(prompt);
}

module.exports = {
  analyzeReport,
  suggestDoctorBySymptoms,
  generateDietPlan,
  suggestRecipe
};
