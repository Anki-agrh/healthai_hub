const express = require("express");
const router = express.Router();
const { registerUser, loginUser, sendOtp } = require("../controllers/authController");
const doctorUpload = require("../middleware/doctorUpload");

router.post("/register", doctorUpload.fields([
  { name: "image", maxCount: 1 },
  { name: "aadhaar", maxCount: 1 },
  { name: "license", maxCount: 1 },
  { name: "degreeCert", maxCount: 1 }
]), registerUser);

router.post("/login", loginUser);
router.post("/send-otp", doctorUpload.none(), (req, res, next) => {
  console.log("SEND_OTP BODY:", req.body);
  next();
}, sendOtp);

module.exports = router;
