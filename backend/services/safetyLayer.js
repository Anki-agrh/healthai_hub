const EMERGENCY_KEYWORDS = [
  "chest pain",
  "difficulty breathing",
  "unconscious",
  "severe bleeding",
  "stroke",
];

const isEmergency = (text) => {
  return EMERGENCY_KEYWORDS.some(word =>
    text.toLowerCase().includes(word)
  );
};

module.exports = { isEmergency, detectDanger };
