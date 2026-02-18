// =====================
// IMPORTS
// =====================
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const path = require("path");
const fs = require('fs');
const axios = require('axios');
const http = require("http");
const { Server } = require("socket.io");
const nodemailer = require("nodemailer");
const QRCode = require('qrcode');
require("dotenv").config();
const cron = require("node-cron");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const createMeeting = require("./utils/googleMeet");
const auth = require("./middleware/auth");

// Models
const User = require("./models/User");
const Appointment = require("./models/Appointment");
const Report = require("./models/Report");
const Consultation = require("./models/Consultation");
const PatientReport = require("./models/PatientReport");
const Otp = require("./models/Otp");
const otpGenerator = require("otp-generator");

// Services
const upload = require("./services/reportParser");
const { 
  analyzeReport, 
  suggestDoctorBySymptoms, 
  generateDietPlan,
  suggestRecipe
} = require("./services/geminiService");

// =====================
// APP SETUP
// =====================
const app = express();
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
  maxHttpBufferSize: 1e8 
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =====================
// EMAIL CONFIGURATION
// =====================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
});

const sendAppointmentEmail = async (patientEmail, patientName, tokenNumber, qrData) => {
  try {
    const qrImage = await QRCode.toDataURL(qrData);
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: patientEmail,
      subject: `Appointment Confirmed - Token #${tokenNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 500px;">
          <h2 style="color: #0a4db8;">HealthAI Hub - Appointment Confirmed</h2>
          <p>Hi <strong>${patientName}</strong>,</p>
          <p>Your token number is <strong>${tokenNumber}</strong>. Scan this QR at reception.</p>
          <div style="margin: 20px 0; text-align: center;">
            <img src="cid:qr_image" alt="QR Code" style="width: 200px;" />
          </div>
        </div>
      `,
      attachments: [{
        filename: 'qrcode.png',
        content: qrImage.split("base64,")[1],
        encoding: 'base64',
        cid: 'qr_image'
      }]
    };
    await transporter.sendMail(mailOptions);
  } catch (error) { console.error("Email error:", error); }
};

// =====================
// DATABASE & CRON
// =====================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch((err) => console.error("MongoDB Error ❌:", err));

cron.schedule("0 0 * * *", async () => {
  const today = new Date().toISOString().split("T")[0];
  await User.updateMany({}, { $set: { points: 0, lastReset: today } });
});

// =====================
// 💬 SOCKET.IO LOGIC
// =====================
io.on("connection", (socket) => {
  socket.on("join_consultation", (roomId) => socket.join(roomId));

  socket.on("send_message", (data) => io.to(data.roomId).emit("receive_message", data));

  socket.on("typing", (data) => socket.to(data.roomId).emit("display_typing", data));

  socket.on("send_emergency_sos", (data) => {
    io.emit("receive_emergency_alert", { ...data, time: new Date().toLocaleTimeString() });
  });

  socket.on("call_next_patient", async (data) => {
    try {
      const { doctorId } = data;
      const today = new Date().toISOString().split('T')[0];
      const doctor = await User.findById(doctorId);
      if (doctor) {
        doctor.currentLiveToken = (doctor.currentLiveToken || 0) + 1;
        await doctor.save();

        const totalTokens = await Appointment.countDocuments({ doctorId, date: today });
        const remainingCount = totalTokens - doctor.currentLiveToken;

        io.emit("queue_updated", {
          doctorId: doctorId,
          newLiveToken: doctor.currentLiveToken,
          remainingCount: remainingCount > 0 ? remainingCount : 0
        });
      }
    } catch (err) { console.error(err); }
  });
});

// =====================
// 🔐 LOGIN ROUTE (WITH ADMIN)
// =====================
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email.trim().toLowerCase();

    // 🕵️ 1. ADMIN CHECK (Secret Login)
    if (cleanEmail === "admin@healthai.com" && password === "Admin@123") {
      const adminUser = { _id: "admin_root", name: "Super Admin", email: cleanEmail, role: "admin" };
      const token = jwt.sign({ id: "admin_root", role: "admin" }, process.env.JWT_SECRET);
      return res.json({ success: true, token, user: adminUser });
    }

    // 2. NORMAL LOGIN
    const user = await User.findOne({ email: cleanEmail, password });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    if (user.role === "doctor" && user.status !== "approved")
      return res.status(403).json({ message: "Doctor not approved yet" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user });
  } catch (error) { res.status(500).json({ message: "Login error" }); }
});

// =====================
// 🩺 APPOINTMENTS
// =====================
app.post("/api/appointments", async (req, res) => {
  try {
    const { doctorId, date, patientId, patientName, phoneNumber, problem, patientEmail } = req.body;
    const bookingDate = new Date(date).toISOString().split('T')[0];
    
    const count = await Appointment.countDocuments({ doctorId, date: bookingDate });
    const tokenNumber = count + 1;
    const qrCodeData = `HEALTH-DOC-${doctorId}-PAT-${patientId}-TKN-${tokenNumber}`;

    const appointment = new Appointment({
      doctorId, patientId, patientName, phoneNumber, problem, date: bookingDate, tokenNumber, qrCode: qrCodeData, status: "approved"
    });
    await appointment.save();

    // Broadcast Queue update to everyone
    const doctor = await User.findById(doctorId);
    const totalToday = await Appointment.countDocuments({ doctorId, date: bookingDate });
    const remaining = totalToday - (doctor.currentLiveToken || 0);

    io.emit("queue_updated", {
      doctorId,
      newLiveToken: doctor.currentLiveToken || 0,
      remainingCount: remaining > 0 ? remaining : 0
    });

    if (patientEmail) await sendAppointmentEmail(patientEmail, patientName, tokenNumber, qrCodeData);

    res.json({ success: true, tokenNumber, qrCode: qrCodeData });
  } catch (error) { res.status(500).json({ success: false }); }
});

// =====================
// OTHER ROUTES (Simplified for brevity - keep your existing logic for these)
// =====================
// (Yahan aapke OTP, Register, Admin, AI, and Location routes aayenge jo aapne pehle likhe the)
// Inhe bas existing sequence mein rehne dein.

app.get("/api/doctors/approved", async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor', status: 'approved' }).lean();
    const today = new Date().toISOString().split('T')[0];
    const doctorsWithQueue = await Promise.all(doctors.map(async (doc) => {
      const count = await Appointment.countDocuments({ doctorId: doc._id.toString(), date: today });
      return { ...doc, queueLength: count, currentLiveToken: doc.currentLiveToken || 0 };
    }));
    res.json({ success: true, doctors: doctorsWithQueue }); 
  } catch (error) { res.status(500).json({ success: false }); }
});

// START SERVER
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));