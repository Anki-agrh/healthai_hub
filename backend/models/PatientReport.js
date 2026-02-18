const mongoose = require("mongoose");

const patientReportSchema = new mongoose.Schema({
  patientId: String,
  doctorId: String,
  appointmentId: String,
  date: String,
  file: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("PatientReport", patientReportSchema);