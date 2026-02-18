const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  reporterId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  reportedUserId: { 
    type: String, // Kept as String to handle "Patient" or "Doctor" IDs flexibly
    required: true 
  },
  roomId: { 
    type: String, 
    required: true 
  },
  reason: { 
    type: String, 
    required: true 
  },
  chatTranscript: {
    type: Array,
    default: []
  },
  status: { 
    type: String, 
    default: "pending" 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// ✅ FIX: Use mongoose.model, NOT mongoose.Schema here
module.exports = mongoose.model("Report", reportSchema);
