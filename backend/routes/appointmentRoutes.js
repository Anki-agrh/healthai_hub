const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const { sendAppointmentEmail } = require("../utils/emailService");
const auth = require("../middleware/auth");

router.post("/", async (req, res) => {
  try {
    const { doctorId, date, patientId, patientName, phoneNumber, problem, patientEmail } = req.body;
    const bookingDate = new Date(date).toISOString().split('T')[0];
    
    const count = await Appointment.countDocuments({ doctorId: doctorId.toString(), date: bookingDate });
    const tokenNumber = count + 1;
    const qrCodeData = `HEALTH-DOC-${doctorId}-PAT-${patientId}-TKN-${tokenNumber}`;

    const appointment = new Appointment({
      doctorId: doctorId.toString(),
      patientId: patientId.toString(),
      patientName,
      phoneNumber, problem,
      date: bookingDate,
      tokenNumber,
      qrCode: qrCodeData,
      status: "approved"
    });

    await appointment.save();

    const totalToday = await Appointment.countDocuments({ doctorId, date: bookingDate });
    const doctor = await User.findById(doctorId);
    const remaining = totalToday - (doctor.currentLiveToken || 0);

    const activeIo = req.app.get("io");
    if(activeIo) {
      activeIo.emit("queue_updated", {
        doctorId: doctorId,
        newLiveToken: doctor.currentLiveToken || 0,
        remainingCount: remaining > 0 ? remaining : 0
      });
    }

    if (patientEmail) await sendAppointmentEmail(patientEmail, patientName, tokenNumber, qrCodeData);

    res.json({ success: true, tokenNumber, qrCode: qrCodeData });
  } catch (error) { res.status(500).json({ success: false, message: "Booking failed" }); }
});

router.post("/check-in", async (req, res) => {
  try {
    const { qrData } = req.body; 
    const appointment = await Appointment.findOneAndUpdate({ qrCode: qrData }, { status: "checked-in" }, { new: true });
    if (!appointment) return res.status(404).json({ success: false, message: "Invalid QR Code" });
    res.json({ success: true, message: `Patient ${appointment.patientName} Checked-in!` });
  } catch (error) { res.status(500).json({ success: false }); }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const appointment = await Appointment.findOne({ patientId: req.params.userId, date: today }).sort({ createdAt: -1 });
    if (!appointment) return res.json({ success: false, message: "No appointment today" });
    res.json({ success: true, appointment });
  } catch (error) { res.status(500).json({ success: false }); }
});

router.get("/live-status/:doctorId", async (req, res) => {
  try {
    const doctor = await User.findById(req.params.doctorId);
    const today = new Date().toISOString().split('T')[0];
    const totalTokens = await Appointment.countDocuments({ doctorId: req.params.doctorId, date: today });
    const waiting = totalTokens > (doctor.currentLiveToken || 0) ? totalTokens - (doctor.currentLiveToken || 0) : 0;
    res.json({ success: true, totalTokens, waiting, currentToken: doctor.currentLiveToken || 0 });
  } catch (error) { res.status(500).json({ success: false }); }
});

router.post("/call-next", async (req, res) => {
  try {
    const { doctorId } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const totalToday = await Appointment.countDocuments({ doctorId, date: today });
    const doctor = await User.findById(doctorId);
    if (doctor.currentLiveToken < totalToday) {
      doctor.currentLiveToken = (doctor.currentLiveToken || 0) + 1;
      await doctor.save();
    }
    res.json({ success: true, currentLiveToken: doctor.currentLiveToken });
  } catch (error) { res.status(500).json({ success: false }); }
});

router.get("/doctor/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "doctor") return res.status(403).json({ message: "Access denied" });
    if (req.user.id !== req.params.id) return res.status(403).json({ message: "Unauthorized doctor" });
    const today = new Date().toISOString().split('T')[0];
    const appointments = await Appointment.find({ doctorId: req.params.id, date: today }).sort({ tokenNumber: 1 });
    res.json(appointments);
  } catch (error) { res.status(500).json({ message: "Server error" }); }
});

module.exports = router;
