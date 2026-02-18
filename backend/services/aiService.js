const axios = require("axios");

async function analyzeSymptoms(symptoms) {
  const prompt = `
You are a medical assistant.
Explain symptoms simply.
Suggest OTC medicine category.
Suggest doctor specialty.
NO dosage.

Symptoms: ${symptoms}
`;

  try {
    const res = await axios.post(
      "https://api-inference.huggingface.co/models/google/flan-t5-base",
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.data?.[0]?.generated_text || "General illness detected.";
  } catch {
    return "Mild illness. Rest and hydration advised.";
  }
}

module.exports = { analyzeSymptoms };