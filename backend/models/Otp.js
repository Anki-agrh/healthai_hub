const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: String,
  otp: String,
  data: Object,
  expiresAt: Date
});

module.exports = mongoose.model("Otp", otpSchema);
