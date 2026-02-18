const mongoose = require("mongoose");
const User = require("./models/User"); // Ensure path is correct
require("dotenv").config();

const dummyDoctors = [
  {
    name: "Dr. Anil Sharma",
    email: "anil@hub.com",
    password: "password123", // In industry, use hashed passwords
    role: "doctor",
    specialization: "Cardiologist",
    degree: "MD, MBBS, Ph.D.",
    experience: 15,
    hospitalName: "City Heart Center",
    image: "doc1.jpg", // This filename must exist in backend/uploads/
    status: "approved",
    averageRating: 4.9
  },
  {
    name: "Dr. Neha Verma",
    email: "neha@hub.com",
    password: "password123",
    role: "doctor",
    specialization: "Neurologist",
    degree: "MD, MBBS",
    experience: 10,
    hospitalName: "Neuro Care Hospital",
    image: "doc2.jpg",
    status: "approved",
    averageRating: 4.7
  },
  {
    name: "Dr. Sarah Khan",
    email: "sarah@hub.com",
    password: "password123",
    role: "doctor",
    specialization: "Pediatrician",
    degree: "MD (Pediatrics)",
    experience: 8,
    hospitalName: "Kids Health Clinic",
    image: "doc3.jpg",
    status: "approved",
    averageRating: 4.8
  },
  {
    name: "Dr. Amit Roy",
    email: "amit@hub.com",
    password: "password123",
    role: "doctor",
    specialization: "Dermatologist",
    degree: "MBBS, DDVL",
    experience: 5,
    hospitalName: "Skin & Soul Clinic",
    image: "doc4.jpg",
    status: "approved",
    averageRating: 4.5
  },
  {
    name: "Dr. Elena Gilbert",
    email: "elena@hub.com",
    password: "password123",
    role: "doctor",
    specialization: "General Physician",
    degree: "MBBS",
    experience: 12,
    hospitalName: "General Wellness Hospital",
    image: "doc5.jpg",
    status: "approved",
    averageRating: 4.9
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding... ⚡");

    // INDUSTRY TIP: Always delete the old dummy data first to avoid duplicates
    await User.deleteMany({ role: "doctor" }); 
    
    await User.insertMany(dummyDoctors);
    console.log("Database Seeded with 5 Professional Doctor Profiles! ✅");
    
    process.exit();
  } catch (error) {
    console.error("Seeding Error ❌:", error);
    process.exit(1);
  }
};

seedDB();