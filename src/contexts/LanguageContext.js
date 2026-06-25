import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    welcome: "Welcome to Advanced Wellness AI",
    login: "Login",
    register: "Register", 
    email: "Email",
    password: "Password",
    fullName: "Full Name",
    createAccount: "Create Account",
    haveAccount: "Already have an account?",
    noAccount: "Don't have an account?",
    mentalWellness: "Mental Wellness",
    fitnessCoach: "Fitness Coach",
    brainGames: "Brain Games", 
    community: "Community",
    healthPredictor: "Health Predictor",
    profile: "Profile",
    logout: "Logout",
    points: "Points",
    streak: "Streak",
    days: "days",
    welcomeBack: "Welcome back",
    emotionalSupport: "Emotional support with AI analysis",
    feeling: "How are you feeling?",
    feelingDown: "Feeling Down",
    stressedOut: "Stressed",
    shareJoy: "Happy", 
    anxious: "Anxious",
    shareFeelings: "Share your feelings...",
    getSupport: "Get Support",
    voiceInput: "Voice Input",
    stopListening: "Stop",
    detectingVoice: "Listening...",
    speakNow: "Speak now...",
    fitnessGoal: "Select goal",
    weightLoss: "Weight Loss",
    strengthBuilding: "Strength",
    flexibility: "Flexibility",
    generateWorkout: "Get Workout",
    workoutPlan: "Your Plan",
    brainChallenge: "Brain exercises",
    startGame: "Start Game",
    endGame: "End Game", 
    score: "Score",
    communityConnect: "Connect with community",
    healthInsights: "AI health insights",
    getInsight: "Get Insight",
    updateProfile: "Update",
    memberSince: "Member since",
    wellnessLevel: "Level",
    beginner: "Beginner",
    // NEW ADDITIONS
    welcomeMental: "Hello! I'm your mental wellness assistant. How are you feeling today?",
    selectGoal: "Select your fitness goal",
    emotionalAnalysis: "Emotional analysis and support",
    copingStrategies: "Coping strategies",
    mindfulness: "Mindfulness exercises",
    breathing: "Breathing techniques",
    meditation: "Meditation guide",
    progress: "Progress tracking",
    achievements: "Achievements",
    dailyTips: "Daily wellness tips",
    nutrition: "Nutrition advice",
    sleep: "Sleep quality",
    hydration: "Hydration reminder",
    stressLevel: "Stress level",
    moodTracking: "Mood tracking",
    wellnessScore: "Wellness score",
    challenges: "Wellness challenges",
    reminders: "Reminders",
    resources: "Resources",
    support: "Support network",
    settings: "Settings",
    notifications: "Notifications",
    privacy: "Privacy",
    help: "Help",
    about: "About",
    contact: "Contact us",
    feedback: "Feedback"
  },
  hi: {
    welcome: "एडवांस्ड वेलनेस एआई में स्वागत है",
    login: "लॉगिन",
    register: "रजिस्टर",
    email: "ईमेल",
    password: "पासवर्ड", 
    fullName: "पूरा नाम",
    createAccount: "खाता बनाएं",
    haveAccount: "पहले से खाता है?",
    noAccount: "खाता नहीं है?",
    mentalWellness: "मानसिक स्वास्थ्य",
    fitnessCoach: "फिटनेस कोच",
    brainGames: "ब्रेन गेम्स",
    community: "कम्युनिटी",
    healthPredictor: "हेल्थ प्रेडिक्टर",
    profile: "प्रोफाइल",
    logout: "लॉगआउट",
    points: "पॉइंट्स",
    streak: "स्ट्रीक",
    days: "दिन",
    welcomeBack: "वापसी पर स्वागत",
    emotionalSupport: "भावनात्मक सहायता",
    feeling: "आप कैसा महसूस कर रहे हैं?",
    feelingDown: "उदास",
    stressedOut: "तनाव",
    shareJoy: "खुश",
    anxious: "चिंतित",
    shareFeelings: "अपनी भावनाएं साझा करें...",
    getSupport: "सहायता लें",
    voiceInput: "आवाज इनपुट",
    stopListening: "रोकें",
    detectingVoice: "सुन रहा हूं...",
    speakNow: "अब बोलें...",
    fitnessGoal: "लक्ष्य चुनें",
    weightLoss: "वजन घटाना",
    strengthBuilding: "ताकत",
    flexibility: "लचीलापन",
    generateWorkout: "वर्कआउट लें",
    workoutPlan: "आपकी योजना",
    brainChallenge: "दिमागी व्यायाम",
    startGame: "गेम शुरू करें",
    endGame: "गेम बंद करें",
    score: "स्कोर",
    communityConnect: "कम्युनिटी से जुड़ें",
    healthInsights: "एआई स्वास्थ्य सलाह",
    getInsight: "सलाह लें",
    updateProfile: "अपडेट करें",
    memberSince: "सदस्य since",
    wellnessLevel: "स्तर",
    beginner: "शुरुआती",
    // NEW ADDITIONS IN HINDI
    welcomeMental: "नमस्ते! मैं आपकी मानसिक स्वास्थ्य सहायक हूं। आज आप कैसा महसूस कर रहे हैं?",
    selectGoal: "अपना लक्ष्य चुनें",
    emotionalAnalysis: "भावनात्मक विश्लेषण और सहायता",
    copingStrategies: "सामना करने की रणनीतियाँ",
    mindfulness: "माइंडफुलनेस व्यायाम",
    breathing: "श्वास तकनीक",
    meditation: "ध्यान मार्गदर्शिका",
    progress: "प्रगति ट्रैकिंग",
    achievements: "उपलब्धियाँ",
    dailyTips: "दैनिक वेलनेस टिप्स",
    nutrition: "पोषण सलाह",
    sleep: "नींद की गुणवत्ता",
    hydration: "हाइड्रेशन रिमाइंडर",
    stressLevel: "तनाव स्तर",
    moodTracking: "मूड ट्रैकिंग",
    wellnessScore: "वेलनेस स्कोर",
    challenges: "वेलनेस चुनौतियाँ",
    reminders: "रिमाइंडर्स",
    resources: "संसाधन",
    support: "सहायता नेटवर्क",
    settings: "सेटिंग्स",
    notifications: "नोटिफिकेशन",
    privacy: "प्राइवेसी",
    help: "मदद",
    about: "हमारे बारे में",
    contact: "हमसे संपर्क करें",
    feedback: "फीडबैक"
  }
};

export const LanguageProvider = ({ children }) => {
  const [currentLang, setCurrentLang] = useState('en');

  const changeLanguage = (lang) => {
    setCurrentLang(lang);
  };

  const t = (key) => {
    return translations[currentLang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ currentLang, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};