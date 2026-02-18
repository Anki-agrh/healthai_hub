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
const QRCode = require('qrcode'); // ✅ ADDED: Import for generating QR images
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


// Services
const upload = require("./services/reportParser");
const { 
  analyzeReport, 
  suggestDoctorBySymptoms, 
  generateDietPlan,
  suggestRecipe
} = require("./services/geminiService");


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

transporter.verify(function (error, success) {
  if (error) {
    console.log("❌ Connection error:", error);
  } else {
    console.log("✅ Server is ready to take our messages");
  }
});

const sendAppointmentEmail = async (patientEmail, patientName, tokenNumber, qrData) => {
  console.log(`📧 Attempting to send email to: ${patientEmail}`);

  try {
    // ✅ NEW: Generate QR Code image as a Data URL
    const qrImage = await QRCode.toDataURL(qrData);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: patientEmail,
      subject: `Appointment Confirmed - Token #${tokenNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 500px;">
          <h2 style="color: #0a4db8;">HealthAI Hub - Appointment Confirmed</h2>
          <p>Hi <strong>${patientName}</strong>,</p>
          <p>Your appointment has been successfully booked for today.</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; text-align: center;">
            <h3 style="margin: 0;">Token Number: ${tokenNumber}</h3>
            <p style="color: #666;">Scan this QR code at the reception to check-in:</p>
            
            <div style="margin: 20px 0;">
              <img src="cid:qr_image" alt="QR Code" style="width: 200px; height: 200px; border: 1px solid #ddd; padding: 5px; background: white;" />
            </div>

            <code style="background: #fff; padding: 10px; border: 1px dashed #0a4db8; display: block; font-size: 14px;">${qrData}</code>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #888;">Note: Scanning your QR activates your priority "Next-But-One" status in the live queue.</p>
        </div>
      `,
      // ✅ NEW: Attach the image data so it shows up in the email body
      attachments: [
        {
          filename: 'qrcode.png',
          content: qrImage.split("base64,")[1],
          encoding: 'base64',
          cid: 'qr_image' // Must match the img src above
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email with QR image sent successfully!");
    console.log("📧 Message ID:", info.messageId); 
    console.log("📧 Server Response:", info.response); 
    
  } catch (error) {
    console.error("❌ Nodemailer/QR Error:", error.message);
    if (error.code === 'EAUTH') {
      console.error("💡 TIP: Check if your App Password in .env is correct.");
    }
  }
};

// =====================
// APP SETUP
// =====================
const app = express();

app.get("/", (req, res) => {
  res.send("HealthAI Hub Backend Running 🚀");
});

app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors({
  origin: true,// origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: true, methods: ["GET", "POST"] },
  maxHttpBufferSize: 1e8 
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// =====================
// DATABASE
// =====================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch((err) => console.error("MongoDB Connection Error ❌:", err));

// =====================
// 🌙 DAILY POINT RESET
// =====================
cron.schedule("0 0 * * *", async () => {
  console.log("🌙 Midnight reset running...");

  const today = new Date().toISOString().split("T")[0];

  try {
    await User.updateMany({}, { 
      $set: { points: 0, lastReset: today }
    });

    console.log("✅ All users points reset");
  } catch (err) {
    console.error("❌ Reset failed:", err);
  }
});

// =====================
// 💬 REAL-TIME CONSULTATION (SOCKET.IO)
// =====================
io.on("connection", (socket) => {
  console.log("⚡ User Connected to Socket:", socket.id);

  socket.on("join_consultation", (roomId) => {
    socket.join(roomId);
    console.log(`👤 User joined room: ${roomId}`);
  });

  socket.on("send_message", (data) => {
    io.to(data.roomId).emit("receive_message", data);
  });

  socket.on("typing", (data) => {
    socket.to(data.roomId).emit("display_typing", data);
  });

  socket.on("disconnect", () => {
    console.log("🔌 User Disconnected");
  });

  socket.on("send_emergency_sos", (data) => {
  console.log("🚨 SOS Received, Broadcasting to all Doctors...");
  // io.emit sends it to EVERY connected socket, including the sender
  io.emit("receive_emergency_alert", {
    ...data,
    time: new Date().toLocaleTimeString()
  });
});

socket.on("call_next_patient", async (data) => {
  try {
    const { doctorId } = data;
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Find doctor and increment the live token
    const doctor = await User.findById(doctorId);
    if (doctor) {
      doctor.currentLiveToken = (doctor.currentLiveToken || 0) + 1;
      await doctor.save();

      const totalTokens = await Appointment.countDocuments({ doctorId, date: today });
      const remainingCount = totalTokens > doctor.currentLiveToken 
        ? totalTokens - doctor.currentLiveToken 
        : 0;

      // 2. Broadcast the NEW token number to ALL users
      io.emit("queue_updated", {
        doctorId: doctorId,
        newLiveToken: doctor.currentLiveToken,
        remainingCount: remainingCount
      });
      
      console.log(`📈 Doctor ${doctorId} called token ${doctor.currentLiveToken}`);
    }
  } catch (err) {
    console.error("Queue update failed:", err);
  }
});

});

// =====================
// AUTH ROUTES
// =====================
const doctorUpload = require("./middleware/doctorUpload");

app.post("/api/register", doctorUpload.fields([
  { name: "image", maxCount: 1 },
  { name: "aadhaar", maxCount: 1 },
  { name: "license", maxCount: 1 },
  { name: "degreeCert", maxCount: 1 }
]), async (req, res) => {

  try {

    // ✅ Normalize email
    const email = req.body.email.toLowerCase().trim();
    let password = req.body.password?.trim();

    if (!email || !password)
      return res.status(400).json({ message: "Email & Password required" });

    // ✅ Proper existence check
    const exists = await User.findOne({ email: { $regex: `^${email}$`, $options: "i" } });
    if (exists)
      return res.status(400).json({ message: "User exists" });

    // ================= OTP VERIFY =================
const otpDoc = await Otp.findOne({ email });

if (!otpDoc)
  return res.status(400).json({ message: "OTP expired. Please request again" });

if (otpDoc.otp !== req.body.otp)
  return res.status(400).json({ message: "Invalid OTP" });

if (otpDoc.expiresAt < new Date())
  return res.status(400).json({ message: "OTP expired" });

// delete OTP after successful verification
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

    // ✅ Duplicate index error handle
    if (err.code === 11000) {
      return res.status(400).json({ message: "User exists" });
    }

    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Registration failed" });
  }
});


app.put("/api/doctors/update-profile", doctorUpload.single("image"), async (req, res) => {
  try {
    const { userId, name, degree, specialization, hospitalName, experience, bio } = req.body;

    const updateData = {
      name,
      degree,
      specialization,
      hospitalName,
      experience,
      bio
    };

    // if new image uploaded
    if (req.file) {
      updateData.image = req.file.filename;
    }

    const updatedDoctor = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    res.json({ success: true, doctor: updatedDoctor });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});



app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({
      email: email.trim().toLowerCase(),password
});

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    if (user.role === "doctor" && user.status !== "approved")
      return res.status(403).json({ message: "Doctor not approved yet by admin" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user });
  } catch (error) { res.status(500).json({ message: "Login error" }); }
});

const Otp = require("./models/Otp");
const otpGenerator = require("otp-generator");

app.post("/api/send-otp", doctorUpload.none(), async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "Email required" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Email already registered" });

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false
    });

    await Otp.deleteMany({ email });

    await Otp.create({
      email,
      otp,
      data: req.body, // store full form data temporarily
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
});


// =====================
// 🏆 USER POINTS API
// =====================

// get current points
app.get("/api/user/points/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json({ success: true, points: user?.points || 0 });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// add/subtract points
app.post("/api/user/add-points", async (req, res) => {
  try {
    const { userId, value } = req.body;

    await User.findByIdAndUpdate(userId, {
      $inc: { points: value }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});


// =====================
// 👑 ADMIN OPERATIONS
// =====================
app.get("/api/admin/pending-doctors", async (req, res) => {
  try {
    const pendingDocs = await User.find({ role: "doctor", status: "pending" });
    res.json({ success: true, doctors: pendingDocs });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.post("/api/admin/approve-doctor", async (req, res) => {
  try {
    const { doctorId } = req.body;
    await User.findByIdAndUpdate(doctorId, { status: "approved" });
    res.json({ success: true, message: "Approved!" });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.delete("/api/admin/reject-doctor/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Doctor profile deleted." });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.get("/api/admin/reports", async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 }).populate("reporterId", "name email");
    res.json({ success: true, reports });
  } catch (error) { res.status(500).json({ success: false }); }
});

// =====================
// 🤖 AI ROUTES (GEMINI)
// =====================
app.post("/api/ai/symptom-check", async (req, res) => {
  try {
    const result = await suggestDoctorBySymptoms(req.body.symptoms);
    res.json({ success: true, result });
  } catch (error) { res.status(500).json({ success: false, message: "AI Assistant unavailable." }); }
});

app.post("/api/ai/analyze-report", upload.single("report"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No report provided" });
    const result = await analyzeReport(req.file.path, req.file.mimetype);
    res.json({ success: true, result });
  } catch (error) { res.status(500).json({ success: false, message: "AI Analysis failed." }); }
});

app.post("/api/ai/generate-diet", async (req, res) => {
  try {
    const result = await generateDietPlan(req.body);
    res.json({ success: true, result });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.post("/api/ai/suggest-recipe", async (req, res) => {
  try {
    const { ingredients, dietType, condition } = req.body;

    const result = await suggestRecipe(ingredients, dietType, condition);

    res.json({ success: true, result });

  } catch (error) {
    console.error("Recipe Route Error:", error.message);
    res.status(500).json({ success: false, message: "Recipe generation failed" });
  }
});

// =====================
// 📅 SCHEDULE ONLINE CONSULTATION
// =====================
app.post("/api/consult/schedule", async (req, res) => {
  try {
    const { doctorId, patientId, patientEmail, mode, date, time } = req.body;

    const doctor = await User.findById(doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });

    // Create Google Meet
    const meetLink = await createMeeting(
      doctor.email,
      patientEmail,
      date,
      time
    );

    // Save session
    const session = new Consultation({
      doctorId,
      patientId,
      doctorEmail: doctor.email,
      patientEmail,
      mode,
      date,
      time,
      meetLink
    });

    await session.save();

    res.json({
      success: true,
      message: "Consultation scheduled",
      meetLink
    });

  } catch (error) {
    console.error("Schedule error:", error);
    res.status(500).json({ success: false });
  }
});



// =====================
// 📍 LOCATION & NEARBY SEARCH
// =====================
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

app.get("/api/doctors/search", async (req, res) => {
  try {
    let { lat, lng, city } = req.query;
    if (city) {
      const geoRes = await axios.get(`https://nominatim.openstreetmap.org/search`, {
        params: { q: city, format: 'json', limit: 1 },
        headers: { 'User-Agent': 'HealthAI-Hub-Project' }
      });
      if (geoRes.data.length > 0) {
        lat = geoRes.data[0].lat;
        lng = geoRes.data[0].lon;
      }
    }
    if (!lat || !lng) return res.status(400).json({ message: "Coordinates required." });

    const radius = 15000;
    const overpassQuery = `[out:json];(node["amenity"="hospital"](around:${radius}, ${lat}, ${lng});node["amenity"="doctors"](around:${radius}, ${lat}, ${lng}););out body;`;
    const overpassRes = await axios.post('https://overpass-api.de/api/interpreter', overpassQuery);

    const doctorList = overpassRes.data.elements.map(el => ({
      id: el.id,
      name: el.tags.name || "Clinic/Hospital",
      address: el.tags["addr:street"] || "Nearby Area",
      distance: calculateDistance(lat, lng, el.lat, el.lon).toFixed(2),
      lat: el.lat, lng: el.lon,
      rating: (Math.random() * (5 - 3.5) + 3.5).toFixed(1)
    }));
    res.json({ success: true, doctors: doctorList });
  } catch (error) { res.status(500).json({ success: false, message: "Search Error" }); }
});

// =====================
// 🩺 DOCTOR DATA & QUEUE SYNC
// =====================
app.get("/api/doctors/approved", async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor', status: 'approved' }).lean();
    const today = new Date().toISOString().split('T')[0];

    const doctorsWithQueue = await Promise.all(doctors.map(async (doc) => {
      const count = await Appointment.countDocuments({ 
        doctorId: doc._id.toString(), 
        date: today 
      });
      return { ...doc, queueLength: count, currentLiveToken: doc.currentLiveToken || 0 };
    }));

    res.status(200).json({ success: true, doctors: doctorsWithQueue }); 
  } catch (error) { 
    res.status(500).json({ success: false, message: "Server error" }); 
  }
});


// GET doctor profile by id
app.get("/api/doctors/:id", async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id).lean();

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    res.json({
      _id: doctor._id,
      name: doctor.name,
      degree: doctor.degree,
      specialization: doctor.specialization,
      experience: doctor.experience,
      hospitalName: doctor.hospitalName,
      bio: doctor.bio,
      age: doctor.age,
      image: doctor.image || null   // 🔥 IMPORTANT
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch doctor profile" });
  }
});


// =====================
// 🛡️ SAFETY & REPORTING
// =====================
app.post("/api/reports/submit", async (req, res) => {
  try {
    const { reporterId, reportedUserId, roomId, reason, chatTranscript } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: "Reason required" });
    const newReport = new Report({ reporterId, reportedUserId, roomId, reason, chatTranscript });
    await newReport.save();
    res.json({ success: true, message: "Reported successfully" });
  } catch (error) { res.status(500).json({ success: false }); }
});

// =====================
// 🩺 APPOINTMENTS, TOKENS & EMAIL
// =====================

app.post("/api/appointments", async (req, res) => {
  try {
    const { doctorId, date, patientId, patientName, phoneNumber, problem, patientEmail } = req.body;
    const bookingDate = new Date(date).toISOString().split('T')[0];
    
    const count = await Appointment.countDocuments({ doctorId: doctorId.toString(), date: bookingDate });
    const tokenNumber = count + 1;
    const qrCodeData = `HEALTH-DOC-${doctorId}-PAT-${patientId}-TKN-${tokenNumber}`;

    const appointment = new Appointment({
      doctorId: doctorId.toString(),
      patientId: patientId.toString(),
      patientName,
      phoneNumber, problem,
      date: bookingDate,
      tokenNumber,
      qrCode: qrCodeData,
      status: "approved"
    });

    await appointment.save();

    const totalToday = await Appointment.countDocuments({ doctorId, date: bookingDate });
const doctor = await User.findById(doctorId);
const remaining = totalToday - (doctor.currentLiveToken || 0);

io.emit("queue_updated", {
  doctorId: doctorId,
  newLiveToken: doctor.currentLiveToken || 0,
  remainingCount: remaining > 0 ? remaining : 0
});

    // Send the Professional Email with QR image
    if (patientEmail) {
      await sendAppointmentEmail(patientEmail, patientName, tokenNumber, qrCodeData);
    }

    res.json({ success: true, tokenNumber, qrCode: qrCodeData });
  } catch (error) {
    console.error("Booking Error:", error);
    res.status(500).json({ success: false, message: "Booking failed" });
  }
});

// Route to Check-in a patient via QR data string
app.post("/api/appointments/check-in", async (req, res) => {
  try {
    const { qrData } = req.body; 
    const appointment = await Appointment.findOneAndUpdate(
      { qrCode: qrData },
      { status: "checked-in" }, 
      { new: true }
    );
    if (!appointment) return res.status(404).json({ success: false, message: "Invalid QR Code" });
    res.json({ success: true, message: `Patient ${appointment.patientName} Checked-in!` });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.get("/api/appointments/user/:userId", async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // ✅ Matches 2026-02-12
    
    // Find the latest appointment for THIS user for TODAY
    const appointment = await Appointment.findOne({ 
      patientId: req.params.userId, 
      date: today 
    }).sort({ createdAt: -1 }); // Get the very last one booked

    if (!appointment) return res.json({ success: false, message: "No appointment today" });
    
    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

app.get("/api/appointments/live-status/:doctorId", async (req, res) => {
  try {
    const doctor = await User.findById(req.params.doctorId);
    const today = new Date().toISOString().split('T')[0];
    const totalTokens = await Appointment.countDocuments({ doctorId: req.params.doctorId, date: today });
    const waiting = totalTokens > (doctor.currentLiveToken || 0) ? totalTokens - (doctor.currentLiveToken || 0) : 0;
    res.json({ success: true, totalTokens, waiting, currentToken: doctor.currentLiveToken || 0 });
  } catch (error) { res.status(500).json({ success: false }); }
});

app.post("/api/appointments/call-next", async (req, res) => {
  try {
    const { doctorId } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const totalToday = await Appointment.countDocuments({ doctorId, date: today });
    const doctor = await User.findById(doctorId);
    if (doctor.currentLiveToken < totalToday) {
      doctor.currentLiveToken = (doctor.currentLiveToken || 0) + 1;
      await doctor.save();
    }
    res.json({ success: true, currentLiveToken: doctor.currentLiveToken });
  } catch (error) { res.status(500).json({ success: false }); }
});

// =====================
// 👨‍⚕️ DOCTOR APPOINTMENTS (PROTECTED)
// =====================
app.get("/api/doctor/appointments/:id", auth, async (req, res) => {
  try {

    // Only doctor allowed
    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Doctor can only access his own patients
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: "Unauthorized doctor" });
    }

    const today = new Date().toISOString().split('T')[0];

    const appointments = await Appointment.find({
      doctorId: req.params.id,
      date: today
    }).sort({ tokenNumber: 1 });

    res.json(appointments);

  } catch (error) {
    console.error("Doctor appointments error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// =====================
// 📷 PATIENT UPLOAD MEDICAL REPORT (FIXED)
// =====================
const multer = require("multer");

// single clean storage
const reportUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, "./uploads/"),
    filename: (req, file, cb) => {
      cb(null, "report-" + Date.now() + "-" + file.originalname);
    }
  })
});


// Upload report
app.post("/api/patient/upload-report", reportUpload.single("report"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const { patientId, doctorId, appointmentId, date } = req.body;

    const newReport = new PatientReport({
      patientId,
      doctorId,
      appointmentId,
      date,
      file: req.file.filename
    });

    await newReport.save();

    res.json({ success: true, file: req.file.filename });

  } catch (err) {
    console.error("Upload report error:", err);
    res.status(500).json({ success: false });
  }
});


// Fetch patient reports (Medical History)
app.get("/api/patient/reports/:patientId", async (req, res) => {
  try {
    const reports = await PatientReport.find({
      patientId: req.params.patientId
    }).sort({ createdAt: -1 });

    res.json({ success: true, reports });

  } catch (err) {
    console.error("Fetch reports error:", err);
    res.status(500).json({ success: false });
  }
});

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 HealthAI Hub Backend running on port ${PORT}`);
});