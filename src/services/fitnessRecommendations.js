export const getFitnessResponse = async (message, goal, fitnessLevel) => {
  const messageLower = message.toLowerCase();
  
  if (messageLower.includes('exercise') || messageLower.includes('workout')) {
    return getExerciseRecommendation(goal, fitnessLevel);
  }
  
  if (messageLower.includes('nutrition') || messageLower.includes('diet') || messageLower.includes('eat')) {
    return getNutritionAdvice(goal, fitnessLevel);
  }
  
  if (messageLower.includes('meditation') || messageLower.includes('stress') || messageLower.includes('calm')) {
    return getMeditationGuide(messageLower);
  }
  
  if (messageLower.includes('motivation') || messageLower.includes('tired') || messageLower.includes('lazy')) {
    return getMotivationalMessage(goal);
  }
  
  return "I'm here to help with your fitness journey! Ask me about exercises, nutrition, meditation, or motivation.";
};

const getExerciseRecommendation = (goal, level) => {
  const exercises = {
    beginner: {
      weightloss: "Try 30 minutes of brisk walking, 15 minutes of bodyweight exercises (squats, push-ups, lunges), and 10 minutes of stretching. Do this 4-5 times weekly.",
      strength: "Start with basic bodyweight exercises: 3 sets of 10 squats, 3 sets of 5 push-ups, 3 sets of 10 lunges. Rest 60 seconds between sets.",
      wellness: "Gentle yoga flows, 20-minute walks in nature, and basic stretching routines will build a great foundation."
    },
    intermediate: {
      weightloss: "HIIT workout: 30 seconds work, 30 seconds rest - burpees, mountain climbers, jump squats, high knees. Repeat 4 rounds.",
      strength: "Push-pull routine: Day 1 - push exercises, Day 2 - pull exercises, Day 3 - legs. Include progressive overload.",
      wellness: "Vinyasa yoga, 30-45 minute runs, and circuit training will enhance your overall fitness."
    }
  };

  return exercises[level]?.[goal] || "Let me create a personalized exercise plan for you. What's your main fitness goal?";
};

const getNutritionAdvice = (goal, level) => {
  const advice = {
    weightloss: "Focus on protein-rich foods, plenty of vegetables, and healthy fats. Eat mindfully and stay hydrated. Avoid processed foods and sugary drinks.",
    strength: "Prioritize protein (1.6-2.2g per kg of body weight), complex carbs for energy, and healthy fats. Eat every 3-4 hours.",
    wellness: "Balanced meals with colorful vegetables, lean proteins, whole grains, and healthy fats. Listen to your body's hunger cues."
  };

  return advice[goal] || "Nutrition is key to your fitness success. What specific nutritional guidance are you looking for?";
};