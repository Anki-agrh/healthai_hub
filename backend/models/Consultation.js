const mongoose = require("mongoose");

const consultationSchema = new mongoose.Schema({
  doctorId: String,
  patientId: String,
  doctorEmail: String,
  patientEmail: String,

  mode: {
    type: String,
    enum: ["voice", "video"]
  },

  date: String,
  time: String,
  meetLink: String,

  status: {
    type: String,
    default: "scheduled"
  }
}, { timestamps: true });

module.exports = mongoose.model("Consultation", consultationSchema);
