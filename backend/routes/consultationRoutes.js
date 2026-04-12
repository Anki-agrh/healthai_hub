const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Consultation = require("../models/Consultation");
const createMeeting = require("../utils/googleMeet");
const { sendMeetingEmail } = require("../utils/emailService");

router.post("/schedule", async (req, res) => {
  try {
    const { doctorId, patientId, patientEmail, mode, date, time } = req.body;
    const doctor = await User.findById(doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });

    const meetLink = await createMeeting(doctor.email, patientEmail, date, time);
    const session = new Consultation({ doctorId, patientId, doctorEmail: doctor.email, patientEmail, mode, date, time, meetLink });
    await session.save();

    await sendMeetingEmail(patientEmail, doctor.name, date, time, meetLink);

    res.json({ success: true, message: "Consultation scheduled", meetLink });
  } catch (error) { 
    console.error("Schedule error:", error);
    res.status(500).json({ success: false }); 
  }
});

module.exports = router;
