const EMERGENCY_KEYWORDS = [
  "chest pain",
  "difficulty breathing",
  "unconscious",
  "severe bleeding",
  "stroke",
];

const DANGER_KEYWORDS = [
  "suicide",
  "overdose",
  "poisoning",
  "self-harm",
  "heart attack",
  "seizure",
  "not breathing",
];

const isEmergency = (text) => {
  return EMERGENCY_KEYWORDS.some(word =>
    text.toLowerCase().includes(word)
  );
};

const detectDanger = (text) => {
  const lower = text.toLowerCase();
  return DANGER_KEYWORDS.some(word => lower.includes(word)) || isEmergency(text);
};

module.exports = { isEmergency, detectDanger };
