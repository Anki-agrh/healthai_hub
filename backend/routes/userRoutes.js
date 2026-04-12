const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.get("/points/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json({ success: true, points: user?.points || 0 });
  } catch (error) { res.status(500).json({ success: false }); }
});

router.post("/add-points", async (req, res) => {
  try {
    const { userId, value } = req.body;
    await User.findByIdAndUpdate(userId, { $inc: { points: value } });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false }); }
});

module.exports = router;
