const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  patientId: String,
  patientName: String,
  doctorId: String,
  doctorName: String,
  date: String,
  time: String,
  // --- NEW FIELDS FOR QUEUE LOGIC ---
  tokenNumber: { type: Number },
  qrCode: { type: String }, // Unique ID for scanning
  isArrived: { type: Boolean, default: false }, // Triggers priority
  status: {
    type: String,
    default: "pending" // pending, approved, completed, skipped
  }
});

module.exports = mongoose.model("Appointment", appointmentSchema);