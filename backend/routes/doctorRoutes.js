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
    const { userId, name, degree, specialization, hospitalName, hospitalAddress, city, experience, bio, phone, age, bloodGroup, emergencyContact, allergies } = req.body;
    const updateData = { name, degree, specialization, hospitalName, hospitalAddress, city, bio, phone, age, bloodGroup, emergencyContact, allergies };
    if (experience !== undefined && experience !== "") {
      updateData.experience = parseInt(String(experience).replace(/[^\d]/g, "")) || 0;
    }
    if (req.file) updateData.image = req.file.filename;
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select("-password");
    res.json({ success: true, user: updatedUser, doctor: updatedUser });
  } catch (err) { 
    console.error("UPDATE_PROFILE ERROR:", err);
    res.status(500).json({ success: false, message: err.message }); 
  }
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

// ✅ Nearby healthcare proxy — avoids CORS issues with Overpass API
router.get("/nearby", async (req, res) => {
  try {
    let { lat, lng, city } = req.query;

    // If city is provided, geocode it first via Nominatim
    if (city && (!lat || !lng)) {
      const geoRes = await axios.get(`https://nominatim.openstreetmap.org/search`, {
        params: { q: city, format: 'json', limit: 1 },
        headers: { 'User-Agent': 'HealthAI-Hub-Project' }
      });
      if (geoRes.data.length > 0) {
        lat = geoRes.data[0].lat;
        lng = geoRes.data[0].lon;
      } else {
        return res.json({ success: false, message: "Location not found.", doctors: [] });
      }
    }

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: "Coordinates or city required.", doctors: [] });
    }

    // Query Overpass API for nearby healthcare facilities
    const overpassQuery = `[out:json];(node["amenity"="doctors"](around:5000, ${lat}, ${lng});node["amenity"="clinic"](around:5000, ${lat}, ${lng});node["amenity"="hospital"](around:5000, ${lat}, ${lng}););out body;`;
    
    let overpassRes;
    try {
      overpassRes = await axios.get('https://overpass-api.de/api/interpreter', {
        params: { data: overpassQuery },
        headers: { 'User-Agent': 'HealthAI-Hub-Project' }
      });
    } catch (apiErr) {
      console.warn("Primary Overpass failed, trying fallback...", apiErr.message);
      overpassRes = await axios.get('https://overpass.kumi.systems/api/interpreter', {
        params: { data: overpassQuery },
        headers: { 'User-Agent': 'HealthAI-Hub-Project' }
      });
    }

    const doctorList = (overpassRes.data.elements || []).map(el => ({
      id: el.id,
      name: el.tags?.name || "Healthcare Facility",
      type: el.tags?.amenity || "clinic",
      address: el.tags?.["addr:street"] || "Nearby Area",
      distance: calculateDistance(lat, lng, el.lat, el.lon).toFixed(2),
      lat: el.lat,
      lng: el.lon
    }));

    res.json({ 
      success: true, 
      doctors: doctorList,
      center: { lat: parseFloat(lat), lng: parseFloat(lng) }
    });
  } catch (error) {
    console.error("Nearby search error:", error.message);
    res.status(500).json({ success: false, message: `Nearby search failed: ${error.message}`, doctors: [] });
  }
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
    const user = await User.findById(req.params.id).select("-password").lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) { res.status(500).json({ message: "Failed to fetch profile" }); }
});

module.exports = router;
