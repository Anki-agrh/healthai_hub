const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
require("dotenv").config();

const dummyDoctors = [
  {
    name: "Dr. Anil Sharma",
    email: "anil@hub.com",
    role: "doctor",
    specialization: "Cardiologist",
    degree: "MD, MBBS, Ph.D.",
    experience: 15,
    hospitalName: "City Heart Center",
    hospitalAddress: "Gomti Nagar, Sector 4",
    city: "Lucknow",
    bio: "Chief Cardiologist with 15+ years experience in interventional cardiology and cardiac health rehabilitation.",
    image: "doc1.jpg",
    status: "approved",
    verificationStatus: "approved",
    averageRating: 4.9
  },
  {
    name: "Dr. Neha Verma",
    email: "neha@hub.com",
    role: "doctor",
    specialization: "Neurologist",
    degree: "MD, MBBS",
    experience: 10,
    hospitalName: "Neuro Care Hospital",
    hospitalAddress: "Hazratganj Main Road",
    city: "Lucknow",
    bio: "Senior Neurologist specializing in neurodegenerative disorders, migraines, and cognitive wellness.",
    image: "doc2.jpg",
    status: "approved",
    verificationStatus: "approved",
    averageRating: 4.7
  },
  {
    name: "Dr. Sarah Khan",
    email: "sarah@hub.com",
    role: "doctor",
    specialization: "Pediatrician",
    degree: "MD (Pediatrics), MBBS",
    experience: 8,
    hospitalName: "Kids Health Clinic",
    hospitalAddress: "Aliganj Sector B",
    city: "Lucknow",
    bio: "Dedicated child health specialist focused on developmental milestones and pediatric preventive care.",
    image: "doc3.jpg",
    status: "approved",
    verificationStatus: "approved",
    averageRating: 4.8
  },
  {
    name: "Dr. Amit Roy",
    email: "amit@hub.com",
    role: "doctor",
    specialization: "Dermatologist",
    degree: "MBBS, DDVL",
    experience: 5,
    hospitalName: "Skin & Soul Clinic",
    hospitalAddress: "Indira Nagar",
    city: "Lucknow",
    bio: "Clinical dermatologist and aesthetician specializing in clinical allergy care and skin health.",
    image: "doc4.jpg",
    status: "approved",
    verificationStatus: "approved",
    averageRating: 4.5
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding... ⚡");

    // Remove existing dummy doctor accounts with these emails to avoid duplicates
    const doctorEmails = dummyDoctors.map(d => d.email.toLowerCase());
    await User.deleteMany({ email: { $in: doctorEmails } });

    // Hash password securely
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password123", salt);

    const doctorsToInsert = dummyDoctors.map(doc => ({
      ...doc,
      password: hashedPassword
    }));

    await User.insertMany(doctorsToInsert);
    console.log("Database Seeded with 4 Professional Dummy Doctors! ✅");

    const all = await User.find({}, 'name email role status');
    console.log("\nCurrent DB Users:");
    all.forEach(u => console.log(`  [${u.role.toUpperCase()}] ${u.email} - ${u.name}`));

    process.exit(0);
  } catch (error) {
    console.error("Seeding Error ❌:", error);
    process.exit(1);
  }
};

seedDB();