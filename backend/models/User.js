const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["patient", "doctor", "admin"], default: "patient" },

  // --- 🏆 HEALTH TRACKER POINT SYSTEM ---
  points: { type: Number, default: 0 },
  lastReset: { type: String, default: "" },

  // --- DOCTOR SPECIFIC FIELDS ---
  specialization: String,
  degree: String,
  experience: Number,
  hospitalName: String,
  hospitalAddress: String,
  city: String,
  bio: { type: String, default: "" },
  phone: { type: String, required: false },
  image: String,
  medicalLicense: String,
  aadhaarCard: String,
  degreeCertificate: String,
  verificationStatus: { type: String, default: "pending" },

  ratings: [
  {
    patientId: String,
    value: Number,
    createdAt: { type: Date, default: Date.now }
  }
],
averageRating: { type: Number, default: 0 },

  status: { type: String, default: "approved" }

});

module.exports = mongoose.model("User", userSchema);
