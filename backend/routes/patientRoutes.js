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
    const { patientId, doctorId, appointmentId, date } = req.body;
    const newReport = new PatientReport({ patientId, doctorId, appointmentId, date, file: req.file.filename });
    await newReport.save();
    res.json({ success: true, file: req.file.filename });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.get("/reports/:patientId", async (req, res) => {
  try {
    const reports = await PatientReport.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (err) { res.status(500).json({ success: false }); }
});

module.exports = router;
