// DietPlan.js
const dietPlanSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  profile: {
    height: { type: Number, required: true, min: 50, max: 300 },
    weight: { type: Number, required: true, min: 10, max: 500 },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true }, // Added required
    age: { type: Number, required: true, min: 1, max: 120 }, // ✅ Added Age
    medicalIssues: { type: [String], default: [] },
    dietType: { 
      type: String, 
      enum: ['vegetarian', 'non-veg', 'eggitarian', 'vegan'],
      required: true 
    },
    // ✅ Added Activity Level
    activityLevel: { 
      type: String, 
      enum: ['gym', 'walking', 'yoga', 'no exercise'],
      default: 'no exercise'
    }
  },
  
  plan: {
    dailyCalories: { type: Number, default: 0 },
    macros: { 
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 }, 
      fats: { type: Number, default: 0 } 
    },
    meals: [{
      time: { type: String, required: true },
      suggestions: { type: String, required: true },
      calories: { type: Number, default: 0 }
    }]
  },
  createdAt: { type: Date, default: Date.now }
});