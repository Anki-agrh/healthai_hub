// =====================
// IMPORTS
// =====================
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require('fs');
const http = require("http");
const { Server } = require("socket.io");
const cron = require("node-cron");
require("dotenv").config();

// Configs
const connectDB = require("./config/db");
const corsOptions = require("./config/corsOptions");

// Models & DB
const User = require("./models/User");
const Appointment = require("./models/Appointment");

// =====================
// APP SETUP
// =====================
const app = express();

app.get("/", (req, res) => {
  res.send("HealthAI Hub Backend Running 🚀");
});

app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors(corsOptions));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { 
    origin: corsOptions.origin,
    methods: ["GET", "POST"],
    credentials: true 
  },
  maxHttpBufferSize: 1e8 
});

// Pass io to request level for routes
app.set('io', io);

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
connectDB();

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
    io.emit("receive_emergency_alert", {
      ...data,
      time: new Date().toLocaleTimeString()
    });
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
        const remainingCount = totalTokens > doctor.currentLiveToken 
          ? totalTokens - doctor.currentLiveToken 
          : 0;

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
// ROUTES
// =====================
app.use("/api", require("./routes/authRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));
app.use("/api/doctors", require("./routes/doctorRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/patient", require("./routes/patientRoutes"));
app.use("/api/consult", require("./routes/consultationRoutes"));

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 HealthAI Hub Backend running on port ${PORT}`);
});