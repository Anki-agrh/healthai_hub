const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Report = require("../models/Report");

router.get("/pending-doctors", async (req, res) => {
  try {
    const pendingDocs = await User.find({ role: "doctor", status: "pending" });
    res.json({ success: true, doctors: pendingDocs });
  } catch (error) { res.status(500).json({ success: false }); }
});

router.post("/approve-doctor", async (req, res) => {
  try {
    const { doctorId } = req.body;
    await User.findByIdAndUpdate(doctorId, { status: "approved" });
    res.json({ success: true, message: "Approved!" });
  } catch (error) { res.status(500).json({ success: false }); }
});

router.delete("/reject-doctor/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Doctor profile deleted." });
  } catch (error) { res.status(500).json({ success: false }); }
});

router.get("/reports", async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 }).populate("reporterId", "name email");
    res.json({ success: true, reports });
  } catch (error) { res.status(500).json({ success: false }); }
});

module.exports = router;
