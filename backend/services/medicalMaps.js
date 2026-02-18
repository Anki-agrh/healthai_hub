function getDoctorType(symptoms) {
  const s = symptoms.toLowerCase();

  if (s.includes("chest") || s.includes("heart")) return "Cardiologist";
  if (s.includes("skin") || s.includes("rash")) return "Dermatologist";
  if (s.includes("stomach") || s.includes("acidity")) return "Gastroenterologist";

  return "General Physician";
}

function getOTC(symptoms) {
  const s = symptoms.toLowerCase();

  if (s.includes("fever") || s.includes("cold")) return ["Paracetamol"];
  if (s.includes("acidity")) return ["Antacids"];

  return [];
}

module.exports = { getDoctorType, getOTC };
