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

module.exports = { isEmergency };


const EMERGENCY_TERMS = [
  "critical",
  "very high",
  "very low",
  "life threatening",
  "emergency",
];

function detectDanger(text) {
  return EMERGENCY_TERMS.some(word =>
    text.toLowerCase().includes(word)
  );
}

module.exports = { detectDanger };
