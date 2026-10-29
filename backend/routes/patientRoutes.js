const express = require("express");
const router = express.Router();
const PatientReport = require("../models/PatientReport");
const multer = require("multer");

const reportUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, "./uploads/"),
    filename: (req, file, cb) => cb(null, "report-" + Date.now() + "-" + file.originalname)
  })
});

router.post("/upload-report", reportUpload.single("report"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const { patientId, doctorId, doctorName, reportTitle, appointmentId, date } = req.body;
    const finalDoctor = doctorName || doctorId || "General Practice / Self-Upload";
    const newReport = new PatientReport({
      patientId,
      doctorId: finalDoctor,
      appointmentId: appointmentId || "Direct-Upload",
      date: date || new Date().toISOString().split("T")[0],
      file: req.file.filename
    });
    await newReport.save();
    res.json({ success: true, file: req.file.filename, report: newReport });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.get("/reports/:patientId", async (req, res) => {
  try {
    const reports = await PatientReport.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (err) { res.status(500).json({ success: false }); }
});

module.exports = router;
