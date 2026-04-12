const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Otp = require("../models/Otp");
const otpGenerator = require("otp-generator");
const { transporter } = require("../utils/emailService");

const registerUser = async (req, res) => {
  try {
    const email = req.body.email.toLowerCase().trim();
    let password = req.body.password?.trim();

    if (!email || !password)
      return res.status(400).json({ message: "Email & Password required" });

    const exists = await User.findOne({ email: { $regex: `^${email}$`, $options: "i" } });
    if (exists)
      return res.status(400).json({ message: "User exists" });

    const otpDoc = await Otp.findOne({ email });
    if (!otpDoc)
      return res.status(400).json({ message: "OTP expired. Please request again" });

    if (otpDoc.otp !== req.body.otp)
      return res.status(400).json({ message: "Invalid OTP" });

    if (otpDoc.expiresAt < new Date())
      return res.status(400).json({ message: "OTP expired" });

    await Otp.deleteMany({ email });

    const user = new User({
      name: req.body.name,
      email,
      password,
      role: req.body.role,
      specialization: req.body.specialization || "",
      experience: req.body.experience || "",
      degree: req.body.degree || "",
      hospitalName: req.body.hospitalName || "",
      hospitalAddress: req.body.hospitalAddress || "",
      city: req.body.city || "",
      phone: req.body.phone || "",
      bio: req.body.bio || "",
      status: req.body.role === "doctor" ? "pending" : "approved",
      image: req.files?.image?.[0]?.filename || null,
      aadhaarCard: req.files?.aadhaar?.[0]?.filename || null,
      medicalLicense: req.files?.license?.[0]?.filename || null,
      degreeCertificate: req.files?.degreeCert?.[0]?.filename || null,
    });

    await user.save();
    console.log("USER CREATED:", email);

    res.status(201).json({
      success: true,
      message: req.body.role === "doctor"
        ? "Registered! Waiting for admin approval"
        : "Registration successful"
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "User exists" });
    }
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Registration failed" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.trim().toLowerCase(), password });

    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (user.role === "doctor" && user.status !== "approved")
      return res.status(403).json({ message: "Doctor not approved yet by admin" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user });
  } catch (error) { 
    res.status(500).json({ message: "Login error" }); 
  }
};

const sendOtp = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "Email required" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Email already registered" });

    const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });

    await Otp.deleteMany({ email });
    await Otp.create({
      email,
      otp,
      data: req.body, 
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await transporter.sendMail({
      to: email,
      subject: "HealthAI Hub OTP Verification",
      html: `<h2>Your OTP is ${otp}</h2><p>Valid for 10 minutes</p>`
    });

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

module.exports = { registerUser, loginUser, sendOtp };
