const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Report = require("../models/Report");

const PROTECTED_EMAILS = [
  "admin@healthai.com",
  "healthai.hub.info@gmail.com",
];

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

// List all registered users (for admin view)
router.get("/all-users", async (req, res) => {
  try {
    const users = await User.find({}, "name email role status createdAt").sort({ role: 1 });
    res.json({ success: true, users });
  } catch (err) { res.status(500).json({ success: false }); }
});

// Purge test patient accounts (keep protected emails + all doctors + all admins)
router.post("/purge-test-users", async (req, res) => {
  try {
    const extraProtected = req.body.protectedEmails || [];
    const allProtected = [...PROTECTED_EMAILS, ...extraProtected].map(e => e.toLowerCase());

    const result = await User.deleteMany({
      role: "patient",
      email: { $nin: allProtected }
    });

    res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Purged ${result.deletedCount} test patient account(s). Doctors, admins, and protected emails preserved.`
    });
  } catch (err) {
    console.error("Purge error:", err);
    res.status(500).json({ success: false, message: "Purge failed." });
  }
});

module.exports = router;
