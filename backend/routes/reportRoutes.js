const express = require("express");
const router = express.Router();
const Report = require("../models/Report");

router.post("/submit", async (req, res) => {
  try {
    const { reporterId, reportedUserId, roomId, reason, chatTranscript } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: "Reason required" });
    const newReport = new Report({ reporterId, reportedUserId, roomId, reason, chatTranscript });
    await newReport.save();
    res.json({ success: true, message: "Reported successfully" });
  } catch (error) { res.status(500).json({ success: false }); }
});

module.exports = router;
