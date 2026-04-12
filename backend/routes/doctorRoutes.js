const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const axios = require("axios");
const doctorUpload = require("../middleware/doctorUpload");

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

router.put("/update-profile", doctorUpload.single("image"), async (req, res) => {
  try {
    const { userId, name, degree, specialization, hospitalName, experience, bio } = req.body;
    const updateData = { name, degree, specialization, hospitalName, experience, bio };
    if (req.file) updateData.image = req.file.filename;
    const updatedDoctor = await User.findByIdAndUpdate(userId, updateData, { new: true });
    res.json({ success: true, doctor: updatedDoctor });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.get("/search", async (req, res) => {
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

router.get("/approved", async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor', status: 'approved' }).lean();
    const today = new Date().toISOString().split('T')[0];
    const doctorsWithQueue = await Promise.all(doctors.map(async (doc) => {
      const count = await Appointment.countDocuments({ doctorId: doc._id.toString(), date: today });
      return { ...doc, queueLength: count, currentLiveToken: doc.currentLiveToken || 0 };
    }));
    res.status(200).json({ success: true, doctors: doctorsWithQueue }); 
  } catch (error) { res.status(500).json({ success: false, message: "Server error" }); }
});

router.get("/:id", async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id).lean();
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json({
      _id: doctor._id, name: doctor.name, degree: doctor.degree, specialization: doctor.specialization,
      experience: doctor.experience, hospitalName: doctor.hospitalName, bio: doctor.bio, age: doctor.age, image: doctor.image || null
    });
  } catch (err) { res.status(500).json({ message: "Failed to fetch doctor profile" }); }
});

module.exports = router;
