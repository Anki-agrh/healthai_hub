const express = require("express");
const router = express.Router();
const upload = require("../services/reportParser");
const { 
  analyzeReport, 
  suggestDoctorBySymptoms, 
  generateDietPlan,
  suggestRecipe
} = require("../services/geminiService");

router.post("/symptom-check", async (req, res) => {
  try {
    const result = await suggestDoctorBySymptoms(req.body.symptoms);
    res.json({ success: true, result });
  } catch (error) { res.status(500).json({ success: false, message: "AI Assistant unavailable." }); }
});

router.post("/analyze-report", upload.single("report"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No report provided" });
    const result = await analyzeReport(req.file.path, req.file.mimetype);
    res.json({ success: true, result });
  } catch (error) { res.status(500).json({ success: false, message: "AI Analysis failed." }); }
});

router.post("/analyze-existing-report", async (req, res) => {
  try {
    const path = require("path");
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ message: "No filename provided" });
    
    const filePath = path.join(__dirname, "../uploads", filename);
    const ext = path.extname(filename).toLowerCase();
    const mimeType = ext === '.pdf' ? 'application/pdf' : (ext === '.png' ? 'image/png' : 'image/jpeg');

    const result = await analyzeReport(filePath, mimeType);
    res.json({ success: true, result });
  } catch (error) { 
    console.error("Existing Report AI Error:", error);
    res.status(500).json({ success: false, message: "AI Analysis failed." }); 
  }
});

router.post("/generate-diet", async (req, res) => {
  try {
    const { height, weight, age, gender, activityLevel, medicalIssues, dietType } = req.body;
    if (!height || !weight || !age) {
      return res.status(400).json({ success: false, message: "Missing required fields (height, weight, or age)." });
    }
    const result = await generateDietPlan({ height, weight, age, gender, activityLevel, medicalIssues, dietType });
    res.json({ success: true, result });
  } catch (error) {
    console.error("Diet API Error:", error);
    res.status(500).json({ success: false, message: "AI generation failed. Please try again." });
  }
});

router.post("/suggest-recipe", async (req, res) => {
  try {
    const { ingredients, dietType, condition } = req.body;
    const result = await suggestRecipe(ingredients, dietType, condition);
    res.json({ success: true, result });
  } catch (error) {
    console.error("Recipe Route Error:", error.message);
    res.status(500).json({ success: false, message: "Recipe generation failed" });
  }
});

module.exports = router;
