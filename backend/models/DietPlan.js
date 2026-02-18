const mongoose = require('mongoose');

const dietPlanSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true // ✅ Speeds up lookups for a specific user's history
  },
  profile: {
    height: { type: Number, required: true, min: 50, max: 300 }, // cm
    weight: { type: Number, required: true, min: 10, max: 500 }, // kg
    gender: { type: String, enum: ['male', 'female', 'other'] },
    medicalIssues: { type: [String], default: [] },
    // ✅ Lowercase enums to match your frontend <select> values
    dietType: { 
      type: String, 
      enum: ['vegetarian', 'non-veg', 'eggitarian', 'vegan'],
      required: true 
    }
  },
  plan: {
    dailyCalories: { type: Number, default: 0 },
    macros: { 
      protein: { type: Number, default: 0 }, // Changed to Number for easier math
      carbs: { type: Number, default: 0 }, 
      fats: { type: Number, default: 0 } 
    },
    meals: [{
      time: { type: String, required: true }, // e.g., "Breakfast"
      suggestions: { type: String, required: true },
      calories: { type: Number, default: 0 }
    }]
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DietPlan', dietPlanSchema);