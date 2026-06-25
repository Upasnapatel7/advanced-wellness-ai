import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from './services/firebase';
import './App.css';
import ChillZone from './components/ChillZone';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const professionalResources = {
  crisisHotlines: [
    {
      name: "National Suicide Prevention Lifeline",
      number: "988",
      description: "24/7 free and confidential support",
      url: "https://suicidepreventionlifeline.org",
      available: "24/7"
    },
    {
      name: "Crisis Text Line",
      number: "Text HOME to 741741",
      description: "Free, 24/7 crisis counseling via text",
      url: "https://www.crisistextline.org",
      available: "24/7"
    },
    {
      name: "SAMHSA National Helpline",
      number: "1-800-662-4357",
      description: "Treatment referral and information service",
      url: "https://www.samhsa.gov",
      available: "24/7"
    }
  ],
  onlineTherapy: [
    {
      name: "BetterHelp",
      description: "Online therapy platform with licensed professionals",
      url: "https://www.betterhelp.com",
      specializations: ["Anxiety", "Depression", "Stress", "Relationships"],
      cost: "$60-$90/week",
      availability: "24/7"
    },
    {
      name: "Talkspace",
      description: "Text, audio, and video therapy sessions",
      url: "https://www.talkspace.com",
      specializations: ["Trauma", "PTSD", "OCD", "Eating Disorders"],
      cost: "$65-$99/week",
      availability: "24/7"
    },
    {
      name: "Psychology Today Directory",
      description: "Find local therapists in your area",
      url: "https://www.psychologytoday.com",
      specializations: ["All specialties"],
      cost: "Varies",
      availability: "By appointment"
    }
  ],
  mentalHealthApps: [
    {
      name: "Wysa",
      description: "AI mental health coach with therapeutic techniques",
      url: "https://www.wysa.com",
      features: ["AI Chat", "Therapy Tools", "Mindfulness"],
      cost: "Free with premium options"
    },
    {
      name: "Headspace",
      description: "Meditation and mindfulness app",
      url: "https://www.headspace.com",
      features: ["Meditation", "Sleep", "Focus"],
      cost: "Subscription-based"
    },
    {
      name: "Calm",
      description: "Meditation, sleep, and relaxation app",
      url: "https://www.calm.com",
      features: ["Sleep Stories", "Meditation", "Music"],
      cost: "Subscription-based"
    }
  ]
};

// Voice Recognition Hook
const useVoiceRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      setIsListening(false);
      recognitionRef.current.stop();
    }
  };

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    hasRecognitionSupport: !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  };
};

// Text-to-Speech Function
const speakText = (text, onEnd = null) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    if (onEnd) {
      utterance.onend = onEnd;
    }
    
    speechSynthesis.speak(utterance);
    return true;
  }
  return false;
};

// Auth Component with Firebase Integration
const AuthSection = ({ onLogin, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }
    
    if (!isLogin && !formData.fullName) {
      setError('Please enter your full name');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        await onLogin(formData.email, formData.password);
      } else {
        await onRegister(formData.email, formData.password, formData.fullName);
      }
    } catch (error) {
      console.error('Auth error:', error);
      // Handle specific Firebase auth errors
      switch (error.code) {
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/user-disabled':
          setError('This account has been disabled');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password');
          break;
        case 'auth/email-already-in-use':
          setError('An account with this email already exists');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Please check your connection');
          break;
        default:
          setError(error.message || 'An error occurred during authentication');
      }
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({ email: '', password: '', fullName: '' });
    setError('');
  };

  return (
    <div style={styles.authContainer}>
      <div style={styles.authCard}>
        <div style={styles.authHeader}>
          <h1 style={styles.authTitle}>AAROHAN🪽</h1>
          <p style={styles.authSubtitle}>The rise of mind, body and soul as your higher self</p>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.authForm}>
          {!isLogin && (
            <div style={styles.inputGroup}>
              <input
                type="text"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                style={styles.input}
                required
                disabled={loading}
              />
            </div>
          )}
          
          <div style={styles.inputGroup}>
            <input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              style={styles.input}
              required
              disabled={loading}
            />
          </div>
          
          <div style={styles.inputGroup}>
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              style={styles.input}
              required
              disabled={loading}
              minLength="6"
            />
          </div>
          
          {error && (
            <div style={styles.error}>
              ⚠️ {error}
            </div>
          )}
          
          <button 
            type="submit" 
            style={{
              ...styles.primaryButton,
              ...(loading && styles.loadingButton)
            }} 
            disabled={loading}
          >
            {loading ? (
              <div style={styles.buttonLoading}>
                <div style={styles.spinner}></div>
                Processing...
              </div>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>
        
        <div style={styles.authFooter}>
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              resetForm();
            }} 
            style={styles.switchButton}
            disabled={loading}
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Profile Setup Component
const UserProfileSetup = ({ user, onComplete }) => {
  const [profileData, setProfileData] = useState({
    fullName: '',
    age: '',
    gender: '',
    fitnessGoal: 'strength'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profileData.fullName || !profileData.age || !profileData.gender) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        fullName: profileData.fullName,
        age: parseInt(profileData.age),
        gender: profileData.gender,
        fitnessGoal: profileData.fitnessGoal,
        points: 1250,
        streak: 7,
        profileCompleted: true,
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        activities: [],
        achievements: ['welcome']
      });
      onComplete();
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.authContainer}>
      <div style={{...styles.authCard, maxWidth: '500px'}}>
        <div style={styles.authHeader}>
          <h1 style={styles.authTitle}>Welcome to Aarohan</h1>
          <p style={styles.authSubtitle}>Tell us about yourself to get started</p>
        </div>
        
        {error && (
          <div style={styles.error}>
            ⚠️ {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={styles.authForm}>
          <div style={styles.inputGroup}>
            <input
              type="text"
              placeholder="Full Name *"
              value={profileData.fullName}
              onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
              style={styles.input}
              required
            />
          </div>
          
          <div style={styles.formRow}>
            <div style={styles.inputGroup}>
              <input
                type="number"
                placeholder="Age *"
                value={profileData.age}
                onChange={(e) => setProfileData({...profileData, age: e.target.value})}
                style={styles.input}
                min="1"
                max="120"
                required
              />
            </div>
            <div style={styles.inputGroup}>
              <select
                value={profileData.gender}
                onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
                style={styles.input}
                required
              >
                <option value="">Gender *</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div style={styles.goalsSection}>
            <label style={styles.sectionLabel}>Primary Fitness Goal</label>
            <div style={styles.goalsGrid}>
              {[
                { id: 'strength', label: 'Strength', icon: '💪' },
                { id: 'weightLoss', label: 'Weight Loss', icon: '🔥' },
                { id: 'flexibility', label: 'Flexibility', icon: '🧘' },
                { id: 'endurance', label: 'Endurance', icon: '🏃' }
              ].map(goal => (
                <div
                  key={goal.id}
                  style={{
                    ...styles.goalCard,
                    ...(profileData.fitnessGoal === goal.id && styles.activeGoalCard)
                  }}
                  onClick={() => setProfileData({...profileData, fitnessGoal: goal.id})}
                >
                  <div style={styles.goalIcon}>{goal.icon}</div>
                  <div style={styles.goalLabel}>{goal.label}</div>
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            style={{
              ...styles.primaryButton,
              ...(loading && styles.loadingButton)
            }}
            disabled={loading}
          >
            {loading ? (
              <div style={styles.buttonLoading}>
                <div style={styles.spinner}></div>
                Setting up your profile...
              </div>
            ) : (
              'Start My Wellness Journey'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const MentalWellness = ({ user, userData }) => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [showProfessionalHelp, setShowProfessionalHelp] = useState(false);
  const [crisisMode, setCrisisMode] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    hasRecognitionSupport 
  } = useVoiceRecognition();

  const messagesEndRef = useRef(null);

  // Update input text when voice transcript changes
  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  const shouldSuggestProfessionalHelp = (userMessage) => {
    const professionalKeywords = [
      'therapist', 'counselor', 'psychiatrist', 'professional help',
      'diagnosis', 'medication', 'therapy', 'cant cope'
    ];

    const message = (userMessage || '').toLowerCase();
    return professionalKeywords.some(keyword => message.includes(keyword));
  };

  // Enhanced simulated responses
  const generateEnhancedResponse = async (userMessage, isUrgent) => {
    // Analyze the user's message for emotional content
    const message = userMessage.toLowerCase();
    
    // Emotional pattern detection
    const emotionalPatterns = {
      anxiety: {
        keywords: ['anxious', 'worry', 'nervous', 'panic', 'overwhelm', 'scared', 'fear', 'racing thoughts', 'heart pounding', 'cant breathe', 'on edge'],
        validation: [
          "I can feel the anxiety in your words, and I want you to know I'm here with you right now.",
          "That sense of worry and unease you're describing sounds incredibly overwhelming.",
          "I hear the nervous energy in what you're sharing - that must feel so unsettling."
        ],
        copingStrategies: [
          "**Grounding Technique**: Name 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, and 1 thing you can taste.",
          "**Breathing Exercise**: Try 4-7-8 breathing: inhale for 4 counts, hold for 7, exhale for 8. Repeat 3 times.",
          "**Physical Release**: Shake out your hands and arms vigorously for 30 seconds to release nervous energy.",
          "**Thought Reframing**: Ask yourself: 'What's the actual evidence for this worry? What's more likely to happen?'"
        ]
      },
      depression: {
        keywords: ['sad', 'depressed', 'hopeless', 'empty', 'numb', 'cant feel', 'nothing matters', 'tired', 'exhausted', 'dont care', 'pointless'],
        validation: [
          "I can feel the heaviness in what you're sharing, and I want you to know I'm sitting with you in this.",
          "That sense of emptiness and numbness you're describing sounds incredibly difficult to carry.",
          "I hear the profound tiredness in your words - both emotional and physical exhaustion."
        ],
        copingStrategies: [
          "**Small Action**: What's one tiny thing you could do right now? Even just drinking a glass of water or opening a window.",
          "**Connection**: Reach out to one person, even just to say 'I'm having a hard day.' You don't have to explain everything.",
          "**Self-Compassion**: Place your hand on your heart and say 'This is really hard right now, and I'm doing the best I can.'",
          "**Nature**: If possible, step outside for 5 minutes. Notice the air, the sky, any natural elements around you."
        ]
      },
      stress: {
        keywords: ['stress', 'overwhelm', 'pressure', 'burnt out', 'exhausted', 'too much', 'cant handle', 'drowning', 'piled up'],
        validation: [
          "I can truly sense the weight you're carrying right now - it sounds like everything has been piling up.",
          "That feeling of being completely overwhelmed and stretched thin must be incredibly draining.",
          "I hear the pressure and demands you're facing - it sounds like you're carrying so much right now."
        ],
        copingStrategies: [
          "**Prioritize**: What's one thing you could let go of or postpone today? Give yourself permission to set something down.",
          "**Break It Down**: Take your biggest stressor and break it into the smallest possible next step.",
          "**Body Check**: Scan your body for tension - shoulders, jaw, forehead. Gently release each area.",
          "**Time Boundary**: Set a timer for 25 minutes of focused work, then 5 minutes of complete rest."
        ]
      },
      loneliness: {
        keywords: ['lonely', 'alone', 'isolated', 'no one understands', 'by myself', 'no friends', 'disconnected', 'separate', 'unseen'],
        validation: [
          "I hear the loneliness in your words, and I want you to know I'm here with you right now.",
          "That feeling of being alone with your thoughts and struggles can feel so heavy and isolating.",
          "I sense the disconnection you're describing - it's incredibly painful to feel unseen or misunderstood."
        ],
        copingStrategies: [
          "**Virtual Connection**: Join an online community or forum about something you enjoy, even if you just observe at first.",
          "**Self-Companionship**: Write a letter to yourself as if you were comforting a dear friend.",
          "**Shared Experience**: Listen to a podcast or watch a video where people discuss similar feelings.",
          "**Small Outreach**: Send a simple message to someone: 'Thinking of you' or 'Hope you're having an okay day.'"
        ]
      },
      anger: {
        keywords: ['angry', 'mad', 'frustrated', 'irritated', 'pissed', 'furious', 'rage', 'resentful', 'bitter', 'annoyed'],
        validation: [
          "I can hear the intensity and frustration in what you're sharing - your feelings make complete sense.",
          "That anger you're feeling is valuable information about what matters to you and what you need.",
          "I sense the justified frustration in your words - it sounds like your boundaries or values have been crossed."
        ],
        copingStrategies: [
          "**Physical Release**: Punch a pillow, scream into a towel, or do vigorous exercise to release the energy safely.",
          "**Write It Out**: Write everything you're feeling without filtering, then tear it up or delete it.",
          "**Cool Down**: Hold an ice cube in your hand or splash cold water on your face to reset your nervous system.",
          "**Channel Energy**: Use the angry energy for a productive task like cleaning or organizing."
        ]
      },
      grief: {
        keywords: ['grief', 'loss', 'miss', 'passed away', 'died', 'mourning', 'heartbroken', 'empty space', 'gone'],
        validation: [
          "I hear the profound loss in your words, and I'm sitting with you in this pain.",
          "That heartbreak and emptiness you're feeling honors the significance of what you've lost.",
          "I sense the depth of your mourning - grief has its own timeline and there's no right way to feel."
        ],
        copingStrategies: [
          "**Memory Honoring**: Light a candle, look at photos, or engage in an activity that connects you to what you've lost.",
          "**Gentle Movement**: Go for a slow walk, letting your body move at the pace your heart needs.",
          "**Small Rituals**: Create a daily small ritual - a particular tea, a specific song, a moment of silence.",
          "**Support Seeking**: Reach out to others who understand this specific loss, or consider a grief support group."
        ]
      },
      shame: {
        keywords: ['ashamed', 'embarrassed', 'humiliated', 'worthless', 'not good enough', 'failure', 'stupid', 'should have'],
        validation: [
          "I hear the shame and self-judgment in your words, and I want you to know I'm here without judgment.",
          "That feeling of embarrassment and self-criticism can feel so heavy and isolating.",
          "I sense the vulnerability in what you're sharing - it takes courage to speak about these feelings."
        ],
        copingStrategies: [
          "**Self-Compassion Break**: Say to yourself: 'This is a moment of suffering. Suffering is part of life. May I be kind to myself.'",
          "**Reality Check**: Ask: 'Would I judge a friend this harshly for the same situation? What would I say to them?'",
          "**Share Safely**: Consider telling one trusted person about your feelings - shame loses power when shared.",
          "**Values Reminder**: Connect with what you truly value, separate from this specific situation."
        ]
      }
    };

    // Find the best matching emotional pattern
    let bestMatch = 'general';
    let highestScore = 0;

    Object.entries(emotionalPatterns).forEach(([emotion, pattern]) => {
      const score = pattern.keywords.filter(keyword => message.includes(keyword)).length;
      if (score > highestScore) {
        highestScore = score;
        bestMatch = emotion;
      }
    });

    const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];
    
    const validation = getRandomElement(emotionalPatterns[bestMatch]?.validation || [
      "Thank you for sharing what's on your mind. I'm here to listen and support you.",
      "I hear you, and I want you to know that whatever you're feeling right now is valid.",
      "Thank you for trusting me with this. I'm here with you in whatever you're experiencing."
    ]);

    const copingStrategy = getRandomElement(emotionalPatterns[bestMatch]?.copingStrategies || [
      "**Mindful Breathing**: Take 3 deep breaths, noticing the sensation of air moving in and out of your body.",
      "**Grounding**: Look around and name 3 safe things you can see in your environment.",
      "**Self-Care Check**: What's one small act of kindness you could offer yourself right now?",
      "**Perspective**: Remember that feelings are temporary visitors - they come and go, even when they feel permanent."
    ]);

    const followUpQuestions = [
      "What's it like carrying these feelings right now?",
      "How long have you been feeling this way?",
      "What's been happening that might be contributing to these feelings?",
      "Is there someone in your life you feel comfortable talking to about this?",
      "What does support look like for you right now?",
      "Have you noticed any patterns in when these feelings come up?",
      "What usually helps you feel even a little bit better?",
      "What would feel supportive or helpful right now?"
    ];

    const followUp = getRandomElement(followUpQuestions);

    // Construct the response with emotional validation first, then coping strategies
    const response = `
${validation}

I want you to know that you're not alone in this. What you're experiencing is human, and it makes sense given what you're going through.

**Here's something you could try right now:**
${copingStrategy}

${followUp}

Remember: Your feelings are valid messengers, not permanent residents. You have survived 100% of your difficult days so far. 💙
    `.trim();

    return {
      response,
      needsProfessionalHelp: isUrgent || shouldSuggestProfessionalHelp(userMessage),
      isCrisis: false
    };
  };

  const generateAIResponse = async (userMessage) => {
    // Crisis detection first
    const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'want to die', 'harm myself', 'hurting myself'];
    const urgentKeywords = ['emergency', 'help now', 'immediately', 'cant cope', 'breaking down'];
    
    const message = (userMessage || '').toLowerCase();
    const isCrisis = crisisKeywords.some(keyword => message.includes(keyword));
    const isUrgent = urgentKeywords.some(keyword => message.includes(keyword));

    if (isCrisis) {
      return {
        response: `🚨 **I'm really concerned about what you're sharing**

I hear that you're in tremendous pain right now, and I want you to make sure you get immediate support from people who are trained to help in these situations.

**Please reach out to these resources right now:**
• **National Suicide Prevention Lifeline: 988**
• **Crisis Text Line: Text HOME to 741741**
• **Emergency Services: 911**

You don't have to face this alone. These services are available 24/7 with trained professionals who can provide the support you need right now.

Would you like me to stay here with you while you reach out for help?`,
        needsProfessionalHelp: true,
        isCrisis: true
      };
    }

    // Always use enhanced simulated responses
    return generateEnhancedResponse(userMessage, isUrgent);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = { 
      type: 'user', 
      text: inputText, 
      timestamp: new Date()
    };
    setChatHistory(prev => [...prev, userMessage]);
    
    setLoading(true);
    setConnectionError(false);

    try {
      const aiResponse = await generateAIResponse(inputText);
      
      const aiMessage = { 
        type: 'ai', 
        text: aiResponse?.response || "I'm here to listen. Could you tell me more about what you're experiencing?",
        timestamp: new Date(),
        needsProfessionalHelp: aiResponse?.needsProfessionalHelp || false,
        isCrisis: aiResponse?.isCrisis || false
      };
      
      setChatHistory(prev => [...prev, aiMessage]);

      // Handle crisis mode
      if (aiResponse?.isCrisis) {
        setCrisisMode(true);
        setShowProfessionalHelp(true);
      } else if (aiResponse?.needsProfessionalHelp) {
        setShowProfessionalHelp(true);
      }

      // Speak the response (if not in crisis mode)
      if (!aiResponse?.isCrisis) {
        const speakableText = (aiResponse?.response || '').replace(/\*\*/g, '').replace(/\n/g, '. ');
        speakText(speakableText);
      }

      // Save to Firebase
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          points: (userData?.points || 0) + 5,
          activities: arrayUnion({
            type: 'mental_wellness',
            points: 5,
            timestamp: new Date().toISOString(),
            message: inputText.substring(0, 200),
            aiResponse: aiResponse?.response?.substring(0, 200) || '',
            suggestedProfessionalHelp: aiResponse?.needsProfessionalHelp || false,
            isCrisis: aiResponse?.isCrisis || false
          })
        });
      }

      setInputText('');
      
    } catch (error) {
      console.error('Error in AI conversation:', error);
      const errorMessage = { 
        type: 'ai', 
        text: "I apologize, but I'm having trouble connecting to our support system right now. Please try again in a moment.", 
        timestamp: new Date(),
        isError: true
      };
      setChatHistory(prev => [...prev, errorMessage]);
    }
    
    setLoading(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  };

  const handleQuickAction = (action) => {
    const actions = {
      crisis: {
        text: "I need immediate help and support",
        setCrisis: true
      },
      anxiety: {
        text: "I'm feeling really anxious and overwhelmed right now",
        setCrisis: false
      },
      depression: {
        text: "I'm feeling really down and hopeless",
        setCrisis: false
      },
      stress: {
        text: "I'm completely stressed out and overwhelmed",
        setCrisis: false
      }
    };

    const selectedAction = actions[action];
    if (selectedAction) {
      setInputText(selectedAction.text);
      if (selectedAction.setCrisis) {
        setCrisisMode(true);
      }
    }
  };

  // Professional Help Component
  const ProfessionalHelpSection = () => (
    <div style={styles.professionalHelpSection}>
      <div style={styles.professionalHelpHeader}>
        <h3>💙 Professional Support Options</h3>
        <button 
          onClick={() => {
            setShowProfessionalHelp(false);
            setCrisisMode(false);
          }}
          style={styles.closeButton}
        >
          ×
        </button>
      </div>
      
      {crisisMode && (
        <div style={styles.crisisAlert}>
          <h4>🚨 Immediate Crisis Support</h4>
          <p>Please reach out to these resources right now. You don't have to face this alone.</p>
        </div>
      )}

      <div style={styles.resourceCategories}>
        {/* Crisis Resources */}
        <div style={styles.resourceCategory}>
          <h4>🆘 24/7 Crisis Support</h4>
          {professionalResources.crisisHotlines.map((resource, index) => (
            <div key={index} style={styles.resourceCard}>
              <h5 style={styles.resourceName}>{resource.name}</h5>
              <div style={styles.resourceNumber}>{resource.number}</div>
              <p style={styles.resourceDescription}>{resource.description}</p>
              <div style={styles.resourceMeta}>
                <span>Available: {resource.available}</span>
              </div>
              <a 
                href={resource.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={styles.resourceLink}
              >
                Visit Website →
              </a>
            </div>
          ))}
        </div>

        {/* Online Therapy */}
        <div style={styles.resourceCategory}>
          <h4>👥 Online Therapy Platforms</h4>
          {professionalResources.onlineTherapy.map((resource, index) => (
            <div key={index} style={styles.resourceCard}>
              <h5 style={styles.resourceName}>{resource.name}</h5>
              <p style={styles.resourceDescription}>{resource.description}</p>
              <div style={styles.resourceMeta}>
                <span>Cost: {resource.cost}</span>
                <span>Available: {resource.availability}</span>
              </div>
              <div style={styles.specializations}>
                {resource.specializations.map(spec => (
                  <span key={spec} style={styles.specializationTag}>{spec}</span>
                ))}
              </div>
              <a 
                href={resource.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={styles.resourceLink}
              >
                Visit Website →
              </a>
            </div>
          ))}
        </div>

        {/* Mental Health Apps */}
        <div style={styles.resourceCategory}>
          <h4>📱 Mental Health Apps</h4>
          {professionalResources.mentalHealthApps.map((resource, index) => (
            <div key={index} style={styles.resourceCard}>
              <h5 style={styles.resourceName}>{resource.name}</h5>
              <p style={styles.resourceDescription}>{resource.description}</p>
              <div style={styles.features}>
                {resource.features.map(feature => (
                  <span key={feature} style={styles.featureTag}>{feature}</span>
                ))}
              </div>
              <a 
                href={resource.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={styles.resourceLink}
              >
                Get App →
              </a>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.disclaimer}>
        <p><strong>Important:</strong> While I'm here to provide emotional support, I'm not a substitute for professional mental health care. These resources connect you with licensed professionals who can provide comprehensive support.</p>
      </div>
    </div>
  );

  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>AI Mental Health Assistant</h1>
        <p style={styles.pageSubtitle}>Compassionate AI support with connections to professional help when needed</p>
      </div>

      {/* Crisis Alert Banner */}
      {crisisMode && (
        <div style={styles.crisisBanner}>
          <div style={styles.crisisContent}>
            <span style={styles.crisisIcon}>🚨</span>
            <div>
              <strong>Urgent Support Available</strong>
              <p>Please reach out to crisis resources. You don't have to face this alone.</p>
            </div>
          </div>
        </div>
      )}

      {/* Connection Error Alert */}
      {connectionError && (
        <div style={styles.errorBanner}>
          <span>⚠️ Connection issue - using enhanced support mode</span>
        </div>
      )}

      <div style={styles.chatLayout}>
        {/* Quick Actions Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.quickActions}>
            <h4 style={styles.sidebarTitle}>Quick Support</h4>
            <button 
              onClick={() => handleQuickAction('crisis')}
              style={styles.crisisButton}
            >
              🚨 Crisis Support
            </button>
            <button 
              onClick={() => handleQuickAction('anxiety')}
              style={styles.quickButton}
            >
              😰 Anxiety Support
            </button>
            <button 
              onClick={() => handleQuickAction('depression')}
              style={styles.quickButton}
            >
              😔 Depression Support
            </button>
            <button 
              onClick={() => handleQuickAction('stress')}
              style={styles.quickButton}
            >
              😫 Stress Support
            </button>
            <button 
              onClick={() => setShowProfessionalHelp(true)}
              style={styles.professionalHelpButton}
            >
              👥 Professional Help
            </button>
          </div>

          {/* Voice Features */}
          {hasRecognitionSupport && (
            <div style={styles.voiceSection}>
              <h4 style={styles.sidebarTitle}>Voice Features</h4>
              <button 
                onClick={toggleListening}
                style={{
                  ...styles.voiceButton,
                  ...(isListening && styles.listeningButton)
                }}
              >
                {isListening ? '🛑 Stop Listening' : '🎤 Voice Input'}
              </button>
              <button 
                onClick={stopSpeech}
                style={styles.stopSpeechButton}
              >
                🔇 Stop Voice
              </button>
            </div>
          )}
        </div>

        {/* Main Chat Area */}
        <div style={styles.mainChatArea}>
          <div style={styles.chatSection}>
            <div style={styles.chatContainer}>
              <div style={styles.chatMessages}>
                {chatHistory.length === 0 ? (
                  <div style={styles.chatWelcomeMessage}>
                    <div style={styles.welcomeIcon}>💭</div>
                    <h3>Hello, I'm your mental health assistant</h3>
                    <p>I'm here to listen, provide emotional support, and help you navigate difficult feelings. You can share anything that's on your mind.</p>
                    <div style={styles.welcomeTips}>
                      <p><strong>You can:</strong></p>
                      <ul>
                        <li>Share your feelings and thoughts</li>
                        <li>Get empathetic support and validation</li>
                        <li>Learn coping strategies</li>
                        <li>Get connected to professional resources</li>
                        <li>Use voice input for easier conversation</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <>
                    {chatHistory.map((message, index) => (
                      <div key={index} style={{
                        ...styles.chatMessage,
                        ...(message.type === 'user' ? styles.userMessage : styles.aiMessage),
                        ...(message.isCrisis && styles.crisisMessage)
                      }}>
                        <div style={styles.messageContent}>
                          {(message.text || '').split('\n').map((line, lineIndex) => (
                            <p key={lineIndex} style={styles.messageLine}>{line}</p>
                          ))}
                        </div>
                        <div style={styles.messageTime}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {message.needsProfessionalHelp && !message.isCrisis && (
                          <button 
                            onClick={() => setShowProfessionalHelp(true)}
                            style={styles.suggestHelpButton}
                          >
                            💙 Explore Professional Support
                          </button>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              <div style={styles.chatInputContainer}>
                <div style={styles.inputArea}>
                  <div style={styles.inputWrapper}>
                    <input
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Share what's on your mind..."
                      style={styles.textInput}
                      disabled={loading}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    />
                    {hasRecognitionSupport && (
                      <button 
                        onClick={toggleListening}
                        style={{
                          ...styles.voiceInputButton,
                          ...(isListening && styles.listeningButton)
                        }}
                        disabled={loading}
                      >
                        {isListening ? '🛑' : '🎤'}
                      </button>
                    )}
                  </div>
                  <button 
                    onClick={handleSendMessage} 
                    style={{
                      ...styles.primaryButton,
                      ...(loading && styles.loadingButton)
                    }}
                    disabled={loading || !inputText.trim()}
                  >
                    {loading ? (
                      <div style={styles.buttonLoading}>
                        <div style={styles.spinner}></div>
                        Thinking...
                      </div>
                    ) : (
                      'Send'
                    )}
                  </button>
                </div>
                {isListening && (
                  <div style={styles.listeningIndicator}>
                    <div style={styles.pulsingDot}></div>
                    Listening... Speak now
                  </div>
                )}
                <p style={styles.disclaimerText}>
                  Note: This AI provides emotional support but is not a substitute for professional mental healthcare.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Help Modal */}
      {showProfessionalHelp && <ProfessionalHelpSection />}
    </div>
  );
};

// FitnessCoach Component - Updated and Cleaned
const FitnessCoach = ({ user, userData }) => {
  const [selectedLevel, setSelectedLevel] = useState('beginner');
  const [selectedGoal, setSelectedGoal] = useState(userData?.fitnessGoal || 'general');
  const [selectedDays, setSelectedDays] = useState('3');
  const [showFitnessPlan, setShowFitnessPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fitness goals from the screenshot
  const goals = [
    { id: 'weightLoss', label: 'Weight Loss', description: 'Lose weight and reduce body fat' },
    { id: 'weightGain', label: 'Weight Gain', description: 'Build muscle and gain healthy weight' },
    { id: 'strength', label: 'Strength Training', description: 'Increase overall strength and power' },
    { id: 'endurance', label: 'Endurance', description: 'Improve cardiovascular fitness' },
    { id: 'flexibility', label: 'Flexibility', description: 'Improve mobility and flexibility' },
    { id: 'general', label: 'General Fitness', description: 'Maintain overall health and wellness' }
  ];

  // Fitness levels
  const fitnessLevels = [
    { id: 'beginner', label: 'Beginner' },
    { id: 'intermediate', label: 'Intermediate' },
    { id: 'advanced', label: 'Advanced' }
  ];

  // Workout days per week
  const workoutDays = [
    { id: '2', label: '2 days' },
    { id: '3', label: '3 days' },
    { id: '4', label: '4 days' },
    { id: '5', label: '5 days' },
    { id: '6', label: '6 days' },
    { id: '7', label: '7 days' }
  ];

  // Generate fitness plan based on selections
  const generateFitnessPlan = async () => {
    setIsGenerating(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const planData = {
      goal: goals.find(g => g.id === selectedGoal)?.label,
      level: fitnessLevels.find(l => l.id === selectedLevel)?.label,
      days: selectedDays,
      exercises: [],
      recommendations: []
    };

    // Generate plan based on selections
    if (selectedGoal === 'weightLoss') {
      planData.exercises = [
        '30 min Cardio (Running/Cycling) - High Intensity',
        '20 min Strength Training - Full Body',
        '15 min Core Workout',
        '10 min Cool Down Stretching'
      ];
      planData.recommendations = [
        'Focus on calorie deficit diet',
        'Stay hydrated throughout the day',
        'Combine cardio with strength training'
      ];
    } else if (selectedGoal === 'weightGain') {
      planData.exercises = [
        'Heavy Weight Lifting - 45-60 minutes',
        'Compound Movements (Squats, Deadlifts)',
        'Progressive Overload Training',
        'Adequate Rest between workouts'
      ];
      planData.recommendations = [
        'Calorie surplus with protein focus',
        'Track your progress weekly',
        'Get 7-9 hours of sleep for recovery'
      ];
    } else if (selectedGoal === 'strength') {
      planData.exercises = [
        'Heavy Compound Lifts (Squats, Deadlifts, Bench Press)',
        'Accessory Exercises for muscle groups',
        'Progressive Overload Principle',
        'Adequate Rest between sets'
      ];
      planData.recommendations = [
        'Focus on protein-rich diet',
        'Ensure proper form to prevent injuries',
        'Gradually increase weight each week'
      ];
    } else if (selectedGoal === 'endurance') {
      planData.exercises = [
        'Long Distance Running/Cycling',
        'Interval Training',
        'Circuit Training',
        'Swimming or Rowing'
      ];
      planData.recommendations = [
        'Gradually increase duration',
        'Focus on breathing techniques',
        'Stay consistent with training'
      ];
    } else if (selectedGoal === 'flexibility') {
      planData.exercises = [
        'Dynamic Stretching Warm-up',
        'Yoga or Pilates Sessions',
        'Static Stretching Routine',
        'Mobility Drills'
      ];
      planData.recommendations = [
        'Stretch daily for best results',
        'Focus on breathing during stretches',
        'Don\'t push beyond your limits'
      ];
    } else {
      planData.exercises = [
        'Balanced Cardio and Strength Training',
        'Flexibility and Mobility Work',
        'Core Strengthening',
        'Active Recovery Days'
      ];
      planData.recommendations = [
        'Listen to your body',
        'Maintain consistency',
        'Focus on overall wellness'
      ];
    }

    // Adjust based on fitness level
    if (selectedLevel === 'beginner') {
      planData.exercises = planData.exercises.map(ex => ex + ' (Beginner Friendly)');
      planData.recommendations.push('Start slow and focus on form');
    } else if (selectedLevel === 'advanced') {
      planData.exercises = planData.exercises.map(ex => ex + ' (Advanced Intensity)');
      planData.recommendations.push('Push your limits safely');
    }

    // Adjust based on days
    const daysInt = parseInt(selectedDays);
    planData.weeklySchedule = `Train ${daysInt} days per week with ${7 - daysInt} rest days`;

    setGeneratedPlan(planData);
    setShowFitnessPlan(true);
    setIsGenerating(false);

    // Save to Firebase
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          points: (userData?.points || 0) + 20,
          activities: arrayUnion({
            type: 'fitness_plan_generated',
            points: 20,
            timestamp: new Date().toISOString(),
            goal: selectedGoal,
            level: selectedLevel,
            days: selectedDays
          })
        });
      } catch (error) {
        console.error('Error saving fitness plan:', error);
      }
    }
  };

  // Fitness Plan Display Component
  const FitnessPlanDisplay = () => (
    <div style={styles.fitnessPlanModal}>
      <div style={styles.modalHeader}>
        <h2>Your Personalized Fitness Plan</h2>
        <button 
          onClick={() => setShowFitnessPlan(false)}
          style={styles.closeModalButton}
        >
          ×
        </button>
      </div>
      
      <div style={styles.planOverview}>
        <div style={styles.planCard}>
          <h3 style={styles.planTitleHero}>Plan Overview</h3>
          <div style={styles.planDetails}>
            <div style={styles.planDetail}>
              <span style={styles.detailLabel}>Goal:</span>
              <span style={styles.detailValue}>{generatedPlan.goal}</span>
            </div>
            <div style={styles.planDetail}>
              <span style={styles.detailLabel}>Fitness Level:</span>
              <span style={styles.detailValue}>{generatedPlan.level}</span>
            </div>
            <div style={styles.planDetail}>
              <span style={styles.detailLabel}>Weekly Schedule:</span>
              <span style={styles.detailValue}>{generatedPlan.weeklySchedule}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.exerciseSection}>
        <h3 style={styles.sectionTitle}>Weekly Exercise Plan</h3>
        <div style={styles.exerciseList}>
          {generatedPlan.exercises.map((exercise, index) => (
            <div key={index} style={styles.exerciseItem}>
              <div style={styles.exerciseNumber}>{index + 1}</div>
              <div style={styles.exerciseContent}>{exercise}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.recommendationsSection}>
        <h3 style={styles.sectionTitle}>Recommendations</h3>
        <div style={styles.recommendationsList}>
          {generatedPlan.recommendations.map((rec, index) => (
            <div key={index} style={styles.recommendationItem}>
              <span style={styles.recommendationIcon}>✓</span>
              {rec}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.planActions}>
        <button style={styles.secondaryButton} onClick={() => setShowFitnessPlan(false)}>
          Close
        </button>
        <button style={styles.primaryButton} onClick={() => {
          alert('Plan saved successfully!');
          setShowFitnessPlan(false);
        }}>
          Save Plan
        </button>
      </div>
    </div>
  );

  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Create Your Fitness Plan</h1>
        <p style={styles.pageSubtitle}>Get a personalized workout plan based on your goals and fitness level</p>
      </div>

      {/* Goal Selection Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Select Your Goal</h2>
        <div style={styles.fitnessGoalsGrid}>
          {goals.map(goal => (
            <div
              key={goal.id}
              style={{
                ...styles.fitnessGoalCard,
                ...(selectedGoal === goal.id && styles.activeFitnessGoalCard)
              }}
              onClick={() => setSelectedGoal(goal.id)}
            >
              <h3 style={styles.goalTitle}>{goal.label}</h3>
              <p style={styles.goalDescription}>{goal.description}</p>
              {selectedGoal === goal.id && (
                <div style={styles.selectedIndicator}>✓ Selected</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.formSections}>
        {/* Fitness Level Section */}
        <div style={styles.formSection}>
          <h2 style={styles.sectionTitle}>Fitness Level</h2>
          <div style={styles.levelOptions}>
            {fitnessLevels.map(level => (
              <div
                key={level.id}
                style={{
                  ...styles.levelOption,
                  ...(selectedLevel === level.id && styles.activeLevelOption)
                }}
                onClick={() => setSelectedLevel(level.id)}
              >
                <div style={styles.levelRadio}>
                  {selectedLevel === level.id && <div style={styles.radioDot}></div>}
                </div>
                <span style={styles.levelLabel}>{level.label}</span>
                {selectedLevel === level.id && <span style={styles.checkmark}>✓</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Workout Days Section */}
        <div style={styles.formSection}>
          <h2 style={styles.sectionTitle}>Workout Days per Week</h2>
          <div style={styles.daysOptions}>
            {workoutDays.map(day => (
              <div
                key={day.id}
                style={{
                  ...styles.dayOption,
                  ...(selectedDays === day.id && styles.activeDayOption)
                }}
                onClick={() => setSelectedDays(day.id)}
              >
                <div style={styles.dayRadio}>
                  {selectedDays === day.id && <div style={styles.radioDot}></div>}
                </div>
                <span style={styles.dayLabel}>{day.label}</span>
                {selectedDays === day.id && <span style={styles.checkmark}>✓</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div style={styles.generateSection}>
        <button 
          style={styles.generateButton}
          onClick={generateFitnessPlan}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <div style={styles.buttonLoading}>
              <div style={styles.spinner}></div>
              Generating Plan...
            </div>
          ) : (
            'Generate Fitness Plan'
          )}
        </button>
      </div>

      {/* Fitness Plan Modal */}
      {showFitnessPlan && generatedPlan && <FitnessPlanDisplay />}
    </div>
  );
};

// Enhanced Brain Games Component with More Questions and Navigation
const BrainGames = ({ user, userData }) => {
  const [activeGame, setActiveGame] = useState('memory');
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('easy');
  const [gameOver, setGameOver] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionsCompleted, setQuestionsCompleted] = useState(0);
  
  // Memory Game State
  const [memoryCards, setMemoryCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  
  // Math Game State
  const [mathProblems, setMathProblems] = useState([]);
  const [currentMathProblem, setCurrentMathProblem] = useState(null);
  const [mathScore, setMathScore] = useState(0);
  
  // Riddles Game State
  const [riddles, setRiddles] = useState([]);
  const [currentRiddle, setCurrentRiddle] = useState(null);
  const [userRiddleAnswer, setUserRiddleAnswer] = useState('');
  const [riddlesSolved, setRiddlesSolved] = useState(0);
  const [showHint, setShowHint] = useState(false);
  
  // Reasoning Game State
  const [currentPuzzleType, setCurrentPuzzleType] = useState('syllogism');
  const [reasoningPuzzles, setReasoningPuzzles] = useState([]);
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState([]);
  const [reasoningScore, setReasoningScore] = useState(0);
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);
  const [reasoningFeedback, setReasoningFeedback] = useState({ message: '', type: '' });
  const [showNextButton, setShowNextButton] = useState(false);

  // Scramble Game State
  const [scrambleWords, setScrambleWords] = useState([]);
  const [scrambleWord, setScrambleWord] = useState('');
  const [originalWord, setOriginalWord] = useState('');
  const [userGuess, setUserGuess] = useState('');
  const [scrambleScore, setScrambleScore] = useState(0);
  const [scrambleLives, setScrambleLives] = useState(3);
  const [hintUsed, setHintUsed] = useState(false);

  // Feedback state
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  // Voice features
  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    hasRecognitionSupport 
  } = useVoiceRecognition();

  // Game constants
  const games = [
    { id: 'memory', name: 'Memory Match', icon: '🎯', description: 'Find matching pairs' },
    { id: 'math', name: 'Quick Math', icon: '➗', description: 'Solve math problems' },
    { id: 'riddles', name: 'Riddles', icon: '🤔', description: 'Solve tricky riddles' },
    { id: 'reasoning', name: 'Reasoning', icon: '🧠', description: 'Logical thinking puzzles' },
    { id: 'scramble', name: 'Word Scramble', icon: '🔤', description: 'Unscramble words' }
  ];

  const levels = {
    easy: { points: 10, time: 60, lives: 5 },
    medium: { points: 20, time: 45, lives: 3 },
    hard: { points: 30, time: 30, lives: 2 }
  };

  // Enhanced Word lists for scramble game (20+ words)
  const wordLists = {
    easy: [
      'APPLE', 'HOUSE', 'TIGER', 'RIVER', 'SMILE', 'MUSIC', 'PHONE', 'WATER', 'BRAIN', 'GAMES',
      'CLOUD', 'PLANT', 'STONE', 'LIGHT', 'NIGHT', 'DREAM', 'EARTH', 'OCEAN', 'SPACE', 'HEART'
    ],
    medium: [
      'PYTHON', 'RABBIT', 'ORANGE', 'PURPLE', 'SILVER', 'TEMPLE', 'WINDOW', 'BOTTLE', 'GARDEN', 'PENCIL',
      'ROCKET', 'BUTTER', 'CIRCLE', 'DANGER', 'ENERGY', 'FAMILY', 'GALAXY', 'HAPPY', 'ISLAND', 'JUNGLE'
    ],
    hard: [
      'ELEPHANT', 'COMPUTER', 'UNIVERSE', 'MOUNTAIN', 'HOSPITAL', 'BUTTERFLY', 'CHOCOLATE', 'ADVENTURE', 'KNOWLEDGE', 'BEAUTIFUL',
      'CALENDAR', 'DIAMOND', 'ELEGANT', 'FESTIVAL', 'GYMNASTIC', 'HARMONY', 'ILLUSION', 'JOURNEY', 'KANGAROO', 'LANDSCAPE'
    ]
  };

  // Enhanced Riddles database (20+ riddles)
  const riddlesDatabase = {
    easy: [
      {
        question: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
        answer: "echo",
        hint: "You often hear me in mountains and empty halls"
      },
      {
        question: "What has keys but can't open locks?",
        answer: "piano",
        hint: "Musicians use me to create beautiful music"
      },
      {
        question: "What has a head, a tail, is brown, and has no legs?",
        answer: "penny",
        hint: "It's a type of coin"
      },
      {
        question: "The more you take, the more you leave behind. What am I?",
        answer: "footsteps",
        hint: "Think about walking"
      },
      {
        question: "What has an eye but cannot see?",
        answer: "needle",
        hint: "Used for sewing"
      },
      {
        question: "I'm tall when I'm young and short when I'm old. What am I?",
        answer: "candle",
        hint: "It produces light"
      },
      {
        question: "What has hands but can't clap?",
        answer: "clock",
        hint: "It tells time"
      },
      {
        question: "What gets wetter as it dries?",
        answer: "towel",
        hint: "Used after bathing"
      },
      {
        question: "What has a neck but no head?",
        answer: "bottle",
        hint: "Used for storing liquids"
      },
      {
        question: "What can you catch but not throw?",
        answer: "cold",
        hint: "It's an illness"
      },
      {
        question: "What goes up but never comes down?",
        answer: "age",
        hint: "It increases with time"
      },
      {
        question: "What has cities but no houses, forests but no trees, and water but no fish?",
        answer: "map",
        hint: "Used for navigation"
      },
      {
        question: "What has a thumb and four fingers but is not alive?",
        answer: "glove",
        hint: "Worn on hands"
      },
      {
        question: "What has to be broken before you can use it?",
        answer: "egg",
        hint: "Common breakfast food"
      },
      {
        question: "I'm light as a feather, but the strongest person can't hold me for more than 5 minutes. What am I?",
        answer: "breath",
        hint: "It's something you do automatically"
      },
      {
        question: "The more you have of it, the less you see. What is it?",
        answer: "darkness",
        hint: "Opposite of light"
      },
      {
        question: "What has a heart that doesn't beat?",
        answer: "artichoke",
        hint: "It's a vegetable"
      },
      {
        question: "What can travel around the world while staying in a corner?",
        answer: "stamp",
        hint: "Found on envelopes"
      },
      {
        question: "What has words but never speaks?",
        answer: "book",
        hint: "Contains stories and information"
      },
      {
        question: "What has a ring but no finger?",
        answer: "phone",
        hint: "Used for communication"
      }
    ],
    medium: [
      {
        question: "I have cities but no houses, forests but no trees, and rivers but no water. What am I?",
        answer: "map",
        hint: "Used for navigation"
      },
      {
        question: "What comes once in a minute, twice in a moment, but never in a thousand years?",
        answer: "m",
        hint: "Think about the letters in these words"
      },
      {
        question: "What can be cracked, made, told, and played?",
        answer: "joke",
        hint: "Makes people laugh"
      },
      {
        question: "I'm not alive, but I can grow; I don't have lungs, but I need air; I don't have a mouth, but water kills me. What am I?",
        answer: "fire",
        hint: "Can be dangerous if not controlled"
      },
      {
        question: "What has keys but can't open locks, space but no room, and you can enter but not go outside?",
        answer: "keyboard",
        hint: "Used with computers"
      }
    ],
    hard: [
      {
        question: "I have rivers with no water, forests with no trees, mountains with no rocks, and cities with no people. What am I?",
        answer: "map",
        hint: "Used to represent geographical features"
      },
      {
        question: "What can run but never walks, has a mouth but never talks, has a head but never weeps, has a bed but never sleeps?",
        answer: "river",
        hint: "Flows through landscapes"
      }
    ]
  };

  // Enhanced Reasoning puzzles database (20+ puzzles)
  const reasoningExamDatabase = {
    syllogism: {
      easy: [
        {
          question: "All roses are flowers. Some flowers fade quickly. Therefore:",
          options: [
            "All roses fade quickly",
            "Some roses fade quickly", 
            "No roses fade quickly",
            "Some roses do not fade quickly"
          ],
          answer: 1,
          explanation: "Since all roses are flowers and some flowers fade quickly, it follows that some roses (which are a subset of flowers) may fade quickly."
        },
        {
          question: "No reptiles are mammals. All snakes are reptiles. Therefore:",
          options: [
            "Some snakes are mammals",
            "All snakes are mammals",
            "No snakes are mammals",
            "Some snakes are not mammals"
          ],
          answer: 2,
          explanation: "If no reptiles are mammals and all snakes are reptiles, then no snakes can be mammals."
        },
        {
          question: "All birds have feathers. Penguins are birds. Therefore:",
          options: [
            "Penguins can fly",
            "Penguins have feathers",
            "Penguins are mammals",
            "Penguins don't have feathers"
          ],
          answer: 1,
          explanation: "Since all birds have feathers and penguins are birds, penguins must have feathers."
        },
        {
          question: "Some teachers are writers. All writers are creative people. Therefore:",
          options: [
            "All teachers are creative",
            "Some teachers are creative",
            "No teachers are creative",
            "All creative people are teachers"
          ],
          answer: 1,
          explanation: "Since some teachers are writers and all writers are creative, some teachers must be creative."
        }
      ],
      medium: [
        {
          question: "Some doctors are researchers. All researchers are scientists. Which conclusion follows?",
          options: [
            "All doctors are scientists",
            "Some scientists are doctors",
            "No doctors are scientists", 
            "Some doctors are not researchers"
          ],
          answer: 1,
          explanation: "Since some doctors are researchers and all researchers are scientists, some doctors must be scientists."
        }
      ],
      hard: [
        {
          question: "No artists are bankers. Some bankers are collectors. All collectors are investors. Therefore:",
          options: [
            "Some artists are investors",
            "Some investors are not bankers",
            "No collectors are artists",
            "Some bankers are investors"
          ],
          answer: 3,
          explanation: "Since all collectors are investors and some bankers are collectors, it follows that some bankers are investors."
        }
      ]
    },
    
    sequence: {
      easy: [
        {
          question: "Complete the sequence: 2, 4, 6, 8, ?",
          options: ["9", "10", "12", "14"],
          answer: 1,
          explanation: "The sequence increases by 2 each time: 2+2=4, 4+2=6, 6+2=8, 8+2=10"
        },
        {
          question: "Complete the sequence: 5, 10, 15, 20, ?",
          options: ["25", "30", "35", "40"],
          answer: 0,
          explanation: "The sequence increases by 5 each time: 5+5=10, 10+5=15, 15+5=20, 20+5=25"
        }
      ],
      medium: [
        {
          question: "Find the missing number: 1, 1, 2, 3, 5, 8, ?",
          options: ["11", "12", "13", "14"],
          answer: 2,
          explanation: "Fibonacci sequence: each number is the sum of the two preceding ones"
        }
      ],
      hard: [
        {
          question: "Find the pattern: 2, 5, 10, 17, 26, ?",
          options: ["35", "37", "39", "41"],
          answer: 1,
          explanation: "Add consecutive odd numbers: +3, +5, +7, +9, +11 → 26+11=37"
        }
      ]
    },
    
    analogy: {
      easy: [
        {
          question: "Book is to Read as Food is to:",
          options: ["Cook", "Eat", "Buy", "Store"],
          answer: 1,
          explanation: "The relationship is object to its primary action"
        },
        {
          question: "Pen is to Write as Knife is to:",
          options: ["Sharp", "Cut", "Metal", "Kitchen"],
          answer: 1,
          explanation: "The relationship is tool to its primary function"
        }
      ],
      medium: [
        {
          question: "Water is to Ice as Steam is to:",
          options: ["Cloud", "Water", "Air", "Heat"],
          answer: 1,
          explanation: "Different states of the same substance"
        }
      ],
      hard: [
        {
          question: "Oxygen is to Humans as Carbon Dioxide is to:",
          options: ["Animals", "Plants", "Water", "Air"],
          answer: 1,
          explanation: "Plants consume carbon dioxide like humans consume oxygen"
        }
      ]
    },
    
    deduction: {
      easy: [
        {
          question: "If all cats are animals, and some animals are pets, which must be true?",
          options: [
            "All cats are pets",
            "Some cats are pets", 
            "No cats are pets",
            "Some pets are cats"
          ],
          answer: 3,
          explanation: "Since cats are animals and some animals are pets, it's possible that some of those pets are cats."
        }
      ],
      medium: [
        {
          question: "Three people - A, B, C. A is taller than B. C is shorter than B. Who is tallest?",
          options: ["A", "B", "C", "Cannot determine"],
          answer: 0,
          explanation: "A > B and B > C, so A > B > C"
        }
      ],
      hard: [
        {
          question: "In a race: Tom finished before Jerry but after Spike. Who won?",
          options: ["Tom", "Jerry", "Spike", "Cannot determine"],
          answer: 2,
          explanation: "Spike > Tom > Jerry, so Spike finished first"
        }
      ]
    }
  };

  // Enhanced Math problems database
  const mathProblemsDatabase = {
    easy: [
      { question: "5 + 7 = ?", answer: 12, options: ["11", "12", "13", "14"] },
      { question: "9 - 3 = ?", answer: 6, options: ["5", "6", "7", "8"] },
      { question: "4 × 3 = ?", answer: 12, options: ["10", "12", "14", "16"] },
      { question: "15 ÷ 3 = ?", answer: 5, options: ["3", "4", "5", "6"] },
      { question: "8 + 6 = ?", answer: 14, options: ["12", "13", "14", "15"] },
      { question: "11 - 4 = ?", answer: 7, options: ["6", "7", "8", "9"] },
      { question: "7 × 2 = ?", answer: 14, options: ["12", "13", "14", "15"] },
      { question: "18 ÷ 2 = ?", answer: 9, options: ["8", "9", "10", "11"] },
      { question: "9 + 8 = ?", answer: 17, options: ["16", "17", "18", "19"] },
      { question: "14 - 5 = ?", answer: 9, options: ["8", "9", "10", "11"] }
    ],
    medium: [
      { question: "12 × 4 = ?", answer: 48, options: ["44", "46", "48", "50"] },
      { question: "56 ÷ 7 = ?", answer: 8, options: ["7", "8", "9", "10"] },
      { question: "15 + 23 = ?", answer: 38, options: ["36", "37", "38", "39"] },
      { question: "45 - 18 = ?", answer: 27, options: ["25", "26", "27", "28"] },
      { question: "9 × 7 = ?", answer: 63, options: ["61", "62", "63", "64"] }
    ],
    hard: [
      { question: "125 ÷ 5 = ?", answer: 25, options: ["23", "24", "25", "26"] },
      { question: "17 × 6 = ?", answer: 102, options: ["100", "101", "102", "103"] },
      { question: "89 + 45 = ?", answer: 134, options: ["132", "133", "134", "135"] },
      { question: "156 - 78 = ?", answer: 78, options: ["76", "77", "78", "79"] },
      { question: "14 × 12 = ?", answer: 168, options: ["166", "167", "168", "169"] }
    ]
  };

  // Puzzle type descriptions
  const puzzleTypes = [
    { 
      id: 'syllogism', 
      name: 'Syllogisms', 
      icon: '🔀',
      description: 'Logical conclusions from given statements'
    },
    { 
      id: 'sequence', 
      name: 'Sequences', 
      icon: '🔢',
      description: 'Identify patterns in number/letter sequences'
    },
    { 
      id: 'analogy', 
      name: 'Analogies', 
      icon: '⚖️',
      description: 'Find relationships between pairs of words'
    },
    { 
      id: 'deduction', 
      name: 'Deduction', 
      icon: '🧩',
      description: 'Solve puzzles using logical deduction'
    }
  ];

  // Show feedback function
  const showFeedback = (message, type = 'info') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: '', type: '' }), 3000);
  };

  // Update user guess when voice transcript changes
  useEffect(() => {
    if (transcript && activeGame === 'riddles') {
      setUserRiddleAnswer(transcript);
    }
  }, [transcript, activeGame]);

  // Reset game state when active game changes
  useEffect(() => {
    resetGameState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGame]);

  const resetGameState = () => {
    setGameActive(false);
    setGameOver(false);
    setScore(0);
    setMathScore(0);
    setRiddlesSolved(0);
    setUserRiddleAnswer('');
    setShowHint(false);
    setPuzzlesSolved(0);
    setReasoningScore(0);
    setScrambleScore(0);
    setScrambleLives(levels[selectedLevel].lives);
    setFeedback({ message: '', type: '' });
    setReasoningFeedback({ message: '', type: '' });
    setShowNextButton(false);
    setCurrentQuestionIndex(0);
    setQuestionsCompleted(0);
    
    // Reset game-specific states
    setMemoryCards([]);
    setFlippedCards([]);
    setMatchedCards([]);
    setMathProblems([]);
    setCurrentMathProblem(null);
    setRiddles([]);
    setCurrentRiddle(null);
    setCurrentPuzzle(null);
    setReasoningPuzzles([]);
    setScrambleWords([]);
    setScrambleWord('');
    setOriginalWord('');
    setUserGuess('');
    setHintUsed(false);
  };

  // Memory Game Functions
  const initializeMemoryGame = () => {
    const cardCounts = { easy: 8, medium: 12, hard: 16 };
    const fruits = ['🍎', '🍌', '🍒', '🍇', '🍊', '🍓', '🥭', '🍍', '🥝', '🍑', '🍐', '🥥'];
    const count = cardCounts[selectedLevel];
    const selectedFruits = fruits.slice(0, count / 2);
    
    const cards = [...selectedFruits, ...selectedFruits]
      .sort(() => Math.random() - 0.5)
      .map((fruit, index) => ({
        id: index,
        fruit,
        flipped: false,
        matched: false
      }));
    setMemoryCards(cards);
    setFlippedCards([]);
    setMatchedCards([]);
  };

  const handleMemoryCardClick = (index) => {
    if (!gameActive || memoryCards[index].flipped || memoryCards[index].matched || gameOver) return;
    
    const newCards = [...memoryCards];
    newCards[index].flipped = true;
    setMemoryCards(newCards);
    
    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);
    
    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (newCards[first].fruit === newCards[second].fruit) {
        // Match found
        newCards[first].matched = true;
        newCards[second].matched = true;
        setMemoryCards(newCards);
        setMatchedCards([...matchedCards, first, second]);
        
        // Add points only for correct match
        const pointsEarned = levels[selectedLevel].points;
        setScore(score + pointsEarned);
        showFeedback(`🎉 Great! Match found! +${pointsEarned} points`, 'success');
        
        // Check if all cards are matched
        if (matchedCards.length + 2 === memoryCards.length) {
          setTimeout(() => endGame(true), 500);
        }
      } else {
        // No match - wait a bit then flip back
        showFeedback('❌ No match! Try again.', 'error');
        setTimeout(() => {
          newCards[first].flipped = false;
          newCards[second].flipped = false;
          setMemoryCards(newCards);
          setFlippedCards([]);
        }, 1000);
        return; // Don't clear flipped cards immediately
      }
      setFlippedCards([]);
    }
  };

  // Math Game Functions
  const initializeMathGame = () => {
    const problems = mathProblemsDatabase[selectedLevel];
    const shuffledProblems = [...problems].sort(() => Math.random() - 0.5).slice(0, 10);
    setMathProblems(shuffledProblems);
    setCurrentMathProblem(shuffledProblems[0]);
  };

  const handleMathAnswer = (selectedAnswer) => {
    if (!gameActive || !currentMathProblem || gameOver) return;
    
    if (selectedAnswer === currentMathProblem.answer) {
      const pointsEarned = levels[selectedLevel].points;
      setMathScore(mathScore + pointsEarned);
      setScore(score + pointsEarned);
      setQuestionsCompleted(questionsCompleted + 1);
      showFeedback(`✅ Correct! +${pointsEarned} points`, 'success');
      
      // Move to next question or end game
      if (currentQuestionIndex < mathProblems.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setCurrentMathProblem(mathProblems[currentQuestionIndex + 1]);
        }, 1500);
      } else {
        setTimeout(() => endGame(true), 1500);
      }
    } else {
      showFeedback(`❌ Incorrect! The answer was ${currentMathProblem.answer}`, 'error');
      // End game immediately on wrong answer for math game
      setTimeout(() => endGame(false), 1500);
    }
  };

  // Riddles Game Functions
  const initializeRiddlesGame = () => {
    const riddlesList = riddlesDatabase[selectedLevel];
    const shuffledRiddles = [...riddlesList].sort(() => Math.random() - 0.5).slice(0, 10);
    setRiddles(shuffledRiddles);
    setCurrentRiddle(shuffledRiddles[0]);
  };

  const checkRiddleAnswer = () => {
    if (!gameActive || !currentRiddle || gameOver) return;
    
    const userAnswer = userRiddleAnswer.toLowerCase().trim();
    const correctAnswer = currentRiddle.answer.toLowerCase();
    
    if (userAnswer === correctAnswer) {
      const pointsEarned = levels[selectedLevel].points * 2;
      setRiddlesSolved(riddlesSolved + 1);
      setScore(score + pointsEarned);
      setQuestionsCompleted(questionsCompleted + 1);
      showFeedback(`🎉 Correct! +${pointsEarned} points`, 'success');
      
      if (currentQuestionIndex < riddles.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setCurrentRiddle(riddles[currentQuestionIndex + 1]);
          setUserRiddleAnswer('');
          setShowHint(false);
        }, 1500);
      } else {
        setTimeout(() => endGame(true), 1500);
      }
    } else {
      showFeedback(`❌ Wrong answer! ${showHint ? `Hint: ${currentRiddle.hint}` : 'Try again!'}`, 'error');
    }
  };

  const nextRiddle = () => {
    if (currentQuestionIndex < riddles.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentRiddle(riddles[currentQuestionIndex + 1]);
      setUserRiddleAnswer('');
      setShowHint(false);
      setFeedback({ message: '', type: '' });
    } else {
      endGame(true);
    }
  };

  // Reasoning Game Functions
  const initializeReasoningGame = () => {
    const puzzles = reasoningExamDatabase[currentPuzzleType][selectedLevel];
    const shuffledPuzzles = [...puzzles].sort(() => Math.random() - 0.5).slice(0, 10);
    setReasoningPuzzles(shuffledPuzzles);
    setCurrentPuzzle(shuffledPuzzles[0]);
    setMultipleChoiceOptions(shuffledPuzzles[0].options);
  };

  const checkReasoningAnswer = (selectedOptionIndex) => {
    if (!gameActive || !currentPuzzle || gameOver) return;
    
    if (selectedOptionIndex === currentPuzzle.answer) {
      const pointsEarned = levels[selectedLevel].points * 2;
      setReasoningScore(reasoningScore + pointsEarned);
      setScore(score + pointsEarned);
      setPuzzlesSolved(puzzlesSolved + 1);
      setQuestionsCompleted(questionsCompleted + 1);
      setReasoningFeedback({ 
        message: `✅ Correct! +${pointsEarned} points`, 
        type: 'success' 
      });
      setShowNextButton(true);
      
    } else {
      setReasoningFeedback({ 
        message: `❌ Incorrect! ${currentPuzzle.explanation}`, 
        type: 'error' 
      });
      setShowNextButton(true);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < reasoningPuzzles.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentPuzzle(reasoningPuzzles[currentQuestionIndex + 1]);
      setMultipleChoiceOptions(reasoningPuzzles[currentQuestionIndex + 1].options);
      setReasoningFeedback({ message: '', type: '' });
      setShowNextButton(false);
    } else {
      endGame(true);
    }
  };

  // Scramble Game Functions
  const initializeScrambleGame = () => {
    const words = wordLists[selectedLevel];
    const shuffledWords = [...words].sort(() => Math.random() - 0.5).slice(0, 10);
    setScrambleWords(shuffledWords);
    const firstWord = shuffledWords[0];
    setOriginalWord(firstWord);
    
    // Scramble the word
    const scrambled = firstWord.split('').sort(() => Math.random() - 0.5).join('');
    setScrambleWord(scrambled);
    setUserGuess('');
    setHintUsed(false);
  };

  const handleScrambleGuess = () => {
    if (!gameActive || gameOver) return;
    
    if (userGuess.toUpperCase() === originalWord) {
      const pointsEarned = levels[selectedLevel].points;
      setScrambleScore(scrambleScore + pointsEarned);
      setScore(score + pointsEarned);
      setQuestionsCompleted(questionsCompleted + 1);
      showFeedback(`🎉 Correct! +${pointsEarned} points`, 'success');
      
      if (currentQuestionIndex < scrambleWords.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          const nextWord = scrambleWords[currentQuestionIndex + 1];
          setOriginalWord(nextWord);
          const scrambled = nextWord.split('').sort(() => Math.random() - 0.5).join('');
          setScrambleWord(scrambled);
          setUserGuess('');
          setHintUsed(false);
        }, 1500);
      } else {
        setTimeout(() => endGame(true), 1500);
      }
    } else {
      const newLives = scrambleLives - 1;
      setScrambleLives(newLives);
      showFeedback(`❌ Wrong guess! ${newLives} ${newLives === 1 ? 'life' : 'lives'} remaining.`, 'error');
      if (newLives <= 0) {
        setTimeout(() => endGame(false), 1500);
      } else {
        setUserGuess('');
      }
    }
  };

  const nextScrambleWord = () => {
    if (currentQuestionIndex < scrambleWords.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      const nextWord = scrambleWords[currentQuestionIndex + 1];
      setOriginalWord(nextWord);
      const scrambled = nextWord.split('').sort(() => Math.random() - 0.5).join('');
      setScrambleWord(scrambled);
      setUserGuess('');
      setHintUsed(false);
      setFeedback({ message: '', type: '' });
    } else {
      endGame(true);
    }
  };

  const useHint = () => {
    if (!hintUsed) {
      const hint = originalWord[0] + ' _ '.repeat(originalWord.length - 2) + originalWord[originalWord.length - 1];
      alert(`Hint: ${hint}`);
      setHintUsed(true);
      setScore(score - 5); // Penalty for using hint
      showFeedback('💡 Hint used! -5 points', 'info');
    }
  };

  // Game Management
  const startGame = (gameId) => {
    setActiveGame(gameId);
    setGameActive(true);
    setGameOver(false);
    setScore(0);
    setCurrentQuestionIndex(0);
    setQuestionsCompleted(0);
    
    // Reset individual game scores
    setMathScore(0);
    setRiddlesSolved(0);
    setPuzzlesSolved(0);
    setReasoningScore(0);
    setScrambleScore(0);
    setScrambleLives(levels[selectedLevel].lives);
    setFeedback({ message: '', type: '' });
    
    switch(gameId) {
      case 'memory':
        initializeMemoryGame();
        break;
      case 'math':
        initializeMathGame();
        break;
      case 'riddles':
        initializeRiddlesGame();
        break;
      case 'reasoning':
        initializeReasoningGame();
        break;
      case 'scramble':
        initializeScrambleGame();
        break;
      default:
        // Do nothing for unknown game
        break;
    }
  };

  const endGame = async (won = false) => {
    setGameOver(true);
    setGameActive(false);
    
    if (score > 0) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          points: (userData?.points || 0) + score,
          activities: arrayUnion({
            type: 'brain_game',
            game: activeGame,
            score: score,
            level: selectedLevel,
            won: won,
            questionsCompleted: questionsCompleted,
            timestamp: new Date().toISOString()
          })
        });
      } catch (error) {
        console.error('Error updating score:', error);
      }
    }
  };

  const resetGame = () => {
    resetGameState();
  };

  const getGameInstructions = (gameId) => {
    const instructions = {
      memory: [
        '🎯 Find matching pairs of fruits',
        '👆 Click on cards to flip them',
        '🧠 Remember the positions',
        '⏱️ Wrong matches will flip back',
        '🏆 Complete all pairs to win!'
      ],
      math: [
        '➗ Solve math problems quickly',
        '✅ Choose the correct answer',
        '➡️ Use Next button to continue',
        '🏆 Answer all questions to win!'
      ],
      riddles: [
        '🤔 Solve tricky riddles',
        '💡 Use hints if you get stuck',
        '🎤 Use voice input for answers',
        '➡️ Use Next button to continue',
        '🏆 Solve all riddles to win!'
      ],
      reasoning: [
        '🧠 Solve logical puzzles',
        '💭 Use critical thinking',
        '✅ Select the correct answer',
        '➡️ Use Next button to continue',
        '🏆 Solve all puzzles to win!'
      ],
      scramble: [
        '🔤 Unscramble the hidden word',
        '⌨️ Type your guess and submit',
        '💡 Use hints carefully',
        '➡️ Use Next button to continue',
        '🎯 Solve words to score points!'
      ]
    };

    return (
      <div style={styles.instructionsList}>
        {instructions[gameId].map((instruction, index) => (
          <div key={index} style={styles.instructionItem}>
            <span style={styles.instructionBullet}>•</span>
            {instruction}
          </div>
        ))}
      </div>
    );
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const renderGame = () => {
    // Show intro screen when no game is active and not in game over state
    if (!gameActive && !gameOver) {
      const currentGame = games.find(g => g.id === activeGame);
      
      return (
        <div style={styles.gameIntro}>
          <div style={styles.gameIntroHeader}>
            <div style={styles.gameIntroIcon}>{currentGame.icon}</div>
            <h2 style={styles.gameIntroTitle}>{currentGame.name}</h2>
            <p style={styles.gameIntroDescription}>{currentGame.description}</p>
          </div>
          
          <div style={styles.gameInstructions}>
            {getGameInstructions(activeGame)}
          </div>
          
          <div style={styles.levelSelection}>
            <h3 style={styles.gameTitle}>Select Difficulty Level</h3>
            <div style={styles.levelsGrid}>
              {Object.entries(levels).map(([level, config]) => (
                <div
                  key={level}
                  style={{
                    ...styles.levelCard,
                    ...(selectedLevel === level && styles.activeLevelCard)
                  }}
                  onClick={() => setSelectedLevel(level)}
                >
                  <div style={styles.levelName}>{level.toUpperCase()}</div>
                  <div style={styles.levelInfo}>
                    <div>Points: {config.points}</div>
                    <div>Lives: {config.lives}</div>
                  </div>
                </div>
              ))}
            </div>
            <button style={styles.primaryButton} onClick={() => startGame(activeGame)}>
              Start {currentGame.name}
            </button>
          </div>
        </div>
      );
    }

    if (gameOver) {
      return (
        <div style={styles.gameOver}>
          <h2 style={styles.gameOverTitle}>Game Over!</h2>
          <p style={styles.finalScore}>Final Score: {score} points</p>
          <p style={styles.questionsCompleted}>Questions Completed: {questionsCompleted}</p>
          <div style={styles.gameOverButtons}>
            <button style={styles.primaryButton} onClick={() => startGame(activeGame)}>
              Play Again
            </button>
            <button style={styles.secondaryButton} onClick={resetGame}>
              Choose Another Game
            </button>
          </div>
        </div>
      );
    }

    switch(activeGame) {
      case 'memory':
        return (
          <div style={styles.gameArea}>
            <h3 style={styles.gameTitle}>Memory Match - {selectedLevel.toUpperCase()}</h3>
            <p>Find matching pairs of fruits</p>
            <div style={styles.memoryGrid}>
              {memoryCards.map((card, index) => (
                <div 
                  key={card.id}
                  style={{
                    ...styles.memoryCard,
                    ...((card.flipped || card.matched) && styles.memoryCardFlipped)
                  }}
                  onClick={() => handleMemoryCardClick(index)}
                >
                  {card.flipped || card.matched ? card.fruit : '?'}
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'math':
        return (
          <div style={styles.gameArea}>
            <h3 style={styles.gameTitle}>Quick Math - {selectedLevel.toUpperCase()}</h3>
            <p>Question {currentQuestionIndex + 1} of {mathProblems.length}</p>
            {currentMathProblem && (
              <div style={styles.mathGame}>
                <h2 style={styles.mathProblem}>{currentMathProblem.question}</h2>
                <div style={styles.mathAnswers}>
                  {currentMathProblem.options.map((answer, idx) => (
                    <button
                      key={idx}
                      style={styles.mathButton}
                      onClick={() => handleMathAnswer(answer)}
                    >
                      {answer}
                    </button>
                  ))}
                </div>
                <p style={styles.mathScore}>Score: {mathScore}</p>
              </div>
            )}
          </div>
        );
      
      case 'riddles':
        return (
          <div style={styles.gameArea}>
            <h3 style={styles.gameTitle}>Riddles - {selectedLevel.toUpperCase()}</h3>
            <p>Riddle {currentQuestionIndex + 1} of {riddles.length}</p>
            {currentRiddle && (
              <div style={styles.riddleGame}>
                <div style={styles.riddleQuestion}>
                  <h4>Riddle:</h4>
                  <p style={styles.riddleText}>"{currentRiddle.question}"</p>
                </div>
                
                <div style={styles.riddleInput}>
                  <input
                    type="text"
                    value={userRiddleAnswer}
                    onChange={(e) => setUserRiddleAnswer(e.target.value)}
                    placeholder="Type your answer..."
                    style={styles.textInput}
                    onKeyPress={(e) => e.key === 'Enter' && checkRiddleAnswer()}
                  />
                  {hasRecognitionSupport && (
                    <button 
                      onClick={toggleListening}
                      style={{
                        ...styles.voiceButton,
                        ...(isListening && styles.listeningButton)
                      }}
                    >
                      {isListening ? '🛑' : '🎤'}
                    </button>
                  )}
                  <button style={styles.primaryButton} onClick={checkRiddleAnswer}>
                    Submit Answer
                  </button>
                </div>

                {isListening && (
                  <div style={styles.listeningIndicator}>
                    <div style={styles.pulsingDot}></div>
                    Listening... Speak your answer
                  </div>
                )}
                
                <div style={styles.riddleActions}>
                  <button 
                    style={styles.hintButton} 
                    onClick={() => setShowHint(!showHint)}
                  >
                    💡 {showHint ? 'Hide Hint' : 'Show Hint'}
                  </button>
                  <button 
                    style={styles.secondaryButton} 
                    onClick={nextRiddle}
                    disabled={!feedback.message}
                  >
                    Next Riddle →
                  </button>
                </div>
                
                {showHint && (
                  <div style={styles.hintBox}>
                    <strong>Hint:</strong> {currentRiddle.hint}
                  </div>
                )}

                <div style={styles.progressInfo}>
                  <p>Riddles Solved: {riddlesSolved}/{riddles.length}</p>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'reasoning':
        return (
          <div style={styles.gameArea}>
            <h3 style={styles.gameTitle}>Logical Reasoning - {selectedLevel.toUpperCase()}</h3>
            <p>Puzzle {currentQuestionIndex + 1} of {reasoningPuzzles.length}</p>
            
            {/* Puzzle Type Selection */}
            <div style={styles.puzzleTypeGrid}>
              {puzzleTypes.map(type => (
                <div
                  key={type.id}
                  style={{
                    ...styles.puzzleTypeCard,
                    ...(currentPuzzleType === type.id && styles.activePuzzleTypeCard)
                  }}
                  onClick={() => {
                    setCurrentPuzzleType(type.id);
                    initializeReasoningGame();
                  }}
                >
                  <div style={styles.puzzleTypeIcon}>{type.icon}</div>
                  <div style={styles.puzzleTypeName}>{type.name}</div>
                  <div style={styles.puzzleTypeDesc}>{type.description}</div>
                </div>
              ))}
            </div>

            {currentPuzzle && (
              <div style={styles.reasoningGame}>
                <div style={styles.reasoningQuestion}>
                  <h4>{puzzleTypes.find(t => t.id === currentPuzzleType)?.name} Puzzle:</h4>
                  <p style={styles.reasoningText}>"{currentPuzzle.question}"</p>
                </div>
                
                {/* Reasoning Feedback - Positioned near the question */}
                {reasoningFeedback.message && (
                  <div style={{
                    ...styles.reasoningFeedback,
                    background: reasoningFeedback.type === 'success' ? '#d4edda' : 
                               reasoningFeedback.type === 'error' ? '#f8d7da' : '#d1ecf1',
                    color: reasoningFeedback.type === 'success' ? '#155724' : 
                          reasoningFeedback.type === 'error' ? '#721c24' : '#0c5460',
                    border: reasoningFeedback.type === 'success' ? '1px solid #c3e6cb' : 
                           reasoningFeedback.type === 'error' ? '1px solid #f5c6cb' : '1px solid #bee5eb'
                  }}>
                    {reasoningFeedback.message}
                  </div>
                )}
                
                <div style={styles.multipleChoiceGrid}>
                  {multipleChoiceOptions.map((option, index) => (
                    <button
                      key={index}
                      style={{
                        ...styles.multipleChoiceButton,
                        ...(reasoningFeedback.message && styles.disabledButton)
                      }}
                      onClick={() => checkReasoningAnswer(index)}
                      disabled={reasoningFeedback.message !== ''}
                    >
                      <span style={styles.optionLetter}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      {option}
                    </button>
                  ))}
                </div>

                {/* Next Question Button */}
                {showNextButton && (
                  <div style={styles.nextButtonContainer}>
                    <button 
                      style={styles.nextButton}
                      onClick={handleNextQuestion}
                    >
                      {currentQuestionIndex >= reasoningPuzzles.length - 1 ? 'Finish Game' : 'Next Question →'}
                    </button>
                  </div>
                )}
                
                <div style={styles.progressInfo}>
                  <p>Puzzles Solved: {puzzlesSolved}/{reasoningPuzzles.length}</p>
                </div>

                <div style={styles.reasoningNote}>
                  <p><em>Select the most logical answer based on the information given.</em></p>
                </div>
              </div>
            )}

            {/* Show message when no puzzle is available */}
            {!currentPuzzle && (
              <div style={styles.noPuzzleMessage}>
                <p>Select a puzzle type above to start playing!</p>
              </div>
            )}
          </div>
        );
      
      case 'scramble':
        return (
          <div style={styles.gameArea}>
            <h3 style={styles.gameTitle}>Word Scramble - {selectedLevel.toUpperCase()}</h3>
            <p>Word {currentQuestionIndex + 1} of {scrambleWords.length}</p>
            <div style={styles.scrambleGame}>
              <div style={styles.scrambledWord}>
                {scrambleWord}
              </div>
              <div style={styles.scrambleInput}>
                <input
                  type="text"
                  value={userGuess}
                  onChange={(e) => setUserGuess(e.target.value)}
                  placeholder="Type your guess..."
                  style={styles.textInput}
                  onKeyPress={(e) => e.key === 'Enter' && handleScrambleGuess()}
                />
                <button style={styles.primaryButton} onClick={handleScrambleGuess}>
                  Submit
                </button>
              </div>
              <div style={styles.scrambleActions}>
                <button 
                  style={styles.hintButton} 
                  onClick={useHint}
                  disabled={hintUsed}
                >
                  💡 Get Hint {hintUsed && '(Used)'}
                </button>
                <button 
                  style={styles.secondaryButton} 
                  onClick={nextScrambleWord}
                  disabled={!feedback.message}
                >
                  Next Word →
                </button>
              </div>
              <div style={styles.scrambleInfo}>
                <p style={styles.scrambleScore}>Score: {scrambleScore}</p>
                <p style={styles.scrambleLives}>Lives: {scrambleLives}</p>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div style={styles.gameArea}>
            <h3 style={styles.gameTitle}>Select a Game</h3>
            <p>Please choose a game from the sidebar to start playing!</p>
          </div>
        );
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Brain Games</h1>
        <p style={styles.pageSubtitle}>Improve cognitive skills with fun games</p>
      </div>

      {/* Feedback Display */}
      {feedback.message && (
        <div style={{
          ...styles.feedback,
          background: feedback.type === 'success' ? '#d4edda' : 
                     feedback.type === 'error' ? '#f8d7da' : '#d1ecf1',
          color: feedback.type === 'success' ? '#155724' : 
                feedback.type === 'error' ? '#721c24' : '#0c5460',
          border: feedback.type === 'success' ? '1px solid #c3e6cb' : 
                 feedback.type === 'error' ? '1px solid #f5c6cb' : '1px solid #bee5eb'
        }}>
          {feedback.message}
        </div>
      )}

      <div style={styles.container}>
        {/* Game Selection Sidebar */}
        <div style={styles.sidebar}>
          <h3 style={styles.sidebarTitle}>Choose a Game</h3>
          <div style={styles.gameList}>
            {games.map(game => (
              <div
                key={game.id}
                style={{
                  ...styles.gameItem,
                  ...(activeGame === game.id && styles.activeGameItem)
                }}
                onClick={() => {
                  setActiveGame(game.id);
                  resetGameState();
                }}
              >
                <div style={styles.gameIcon}>{game.icon}</div>
                <div style={styles.gameInfo}>
                  <div style={styles.gameName}>{game.name}</div>
                  <div style={styles.gameDescription}>{game.description}</div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Current Score Display */}
          <div style={styles.scoreSection}>
            <div style={styles.currentScore}>
              <span style={styles.scoreLabel}>Current Score:</span>
              <span style={styles.scoreValue}>{score} points</span>
            </div>
            <div style={styles.questionsProgress}>
              <span style={styles.progressLabel}>Questions:</span>
              <span style={styles.progressValue}>{questionsCompleted} completed</span>
            </div>
          </div>

          {/* Voice Support Info */}
          {hasRecognitionSupport && (
            <div style={styles.voiceSupportInfo}>
              <div style={styles.voiceIcon}>🎤</div>
              <div style={styles.voiceText}>Voice input available in Riddles game</div>
            </div>
          )}
        </div>

        {/* Main Game Area */}
        <div style={styles.mainContent}>
          {renderGame()}
        </div>
      </div>
    </div>
  );
};

// Enhanced Community Component - Only Current User Can Post
const Community = ({ user, userData }) => {
  const [posts, setPosts] = useState([
    {
      id: 1,
      user: userData?.fullName || "You",
      userAvatar: "👤",
      content: "Welcome to the community! Share your wellness journey, thoughts, or ask for advice here.",
      likes: 0,
      comments: 0,
      time: "Just now",
      userId: user?.uid,
      userLevel: "Member",
      tags: ["welcome"]
    }
  ]);
  
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);

  const availableTags = [
    "meditation", "fitness", "nutrition", "mental health", 
    "achievement", "support", "question", "progress"
  ];

  const createPost = async () => {
    if (!newPost.trim()) {
      alert('Please write something to post');
      return;
    }
    
    setLoading(true);
    
    const post = {
      id: Date.now(),
      user: userData?.fullName || user?.email || "You",
      userAvatar: "👤",
      content: newPost,
      likes: 0,
      comments: 0,
      time: "Just now",
      userId: user.uid,
      userLevel: userData?.points > 2000 ? "Pro Member" : "Member",
      tags: selectedTags
    };
    
    setPosts([post, ...posts]);
    setNewPost('');
    setSelectedTags([]);
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        points: (userData?.points || 0) + 5,
        activities: arrayUnion({
          type: 'community_post',
          points: 5,
          timestamp: new Date().toISOString(),
          postId: post.id,
          content: newPost.substring(0, 100) + (newPost.length > 100 ? '...' : '')
        })
      });
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    }
    setLoading(false);
  };

  const likePost = async (postId) => {
    setPosts(posts.map(post => 
      post.id === postId ? { ...post, likes: post.likes + 1 } : post
    ));
  };

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const deletePost = (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      setPosts(posts.filter(post => post.id !== postId));
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Community</h1>
        <p style={styles.pageSubtitle}>Share your wellness journey with others</p>
      </div>

      {/* Create Post Section */}
      <div style={styles.createPost}>
        <div style={styles.postHeader}>
          <div style={styles.postUserInfo}>
            <span style={styles.userAvatar}>👤</span>
            <div>
              <strong>{userData?.fullName || user?.email || "You"}</strong>
              <div style={styles.userLevel}>
                {userData?.points > 2000 ? "Pro Member" : "Member"}
              </div>
            </div>
          </div>
        </div>
        
        <textarea 
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="Share your thoughts, progress, or ask for advice..."
          style={styles.postInput}
          rows="4"
          disabled={loading}
        />
        
        {/* Tags Selection */}
        <div style={styles.tagsSection}>
          <label style={styles.tagsLabel}>Add tags (optional):</label>
          <div style={styles.tagsContainer}>
            {availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                style={{
                  ...styles.tagButton,
                  ...(selectedTags.includes(tag) && styles.activeTagButton)
                }}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
        
        <button 
          onClick={createPost} 
          style={{
            ...styles.primaryButton,
            ...(loading && styles.loadingButton)
          }}
          disabled={loading || !newPost.trim()}
        >
          {loading ? (
            <div style={styles.buttonLoading}>
              <div style={styles.spinner}></div>
              Posting...
            </div>
          ) : (
            'Post to Community'
          )}
        </button>
      </div>

      {/* User's Posts */}
      <div style={styles.postsContainer}>
        <h3 style={styles.sectionTitle}>Your Posts</h3>
        {posts.length === 0 ? (
          <div style={styles.noPosts}>
            <p>You haven't posted anything yet. Share your first post above!</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} style={styles.postCard}>
              <div style={styles.postHeader}>
                <div style={styles.postUserInfo}>
                  <span style={styles.userAvatar}>{post.userAvatar}</span>
                  <div>
                    <strong>{post.user}</strong>
                    <div style={styles.postMeta}>
                      <span style={styles.userLevel}>{post.userLevel}</span>
                      <span style={styles.postTime}>{post.time}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => deletePost(post.id)}
                  style={styles.deleteButton}
                  title="Delete post"
                >
                  🗑️
                </button>
              </div>
              
              <div style={styles.postContent}>{post.content}</div>
              
              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div style={styles.postTags}>
                  {post.tags.map(tag => (
                    <span key={tag} style={styles.postTag}>#{tag}</span>
                  ))}
                </div>
              )}
              
              <div style={styles.postActions}>
                <button 
                  style={styles.likeButton} 
                  onClick={() => likePost(post.id)}
                >
                  ❤️ {post.likes}
                </button>
                <button style={styles.commentButton}>
                  💬 {post.comments}
                </button>
                <button style={styles.shareButton}>
                  🔗 Share
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Community Guidelines */}
      <div style={styles.guidelines}>
        <h4 style={styles.guidelinesTitle}>Community Guidelines</h4>
        <ul style={styles.guidelinesList}>
          <li>Be kind and supportive to others</li>
          <li>Share your authentic wellness journey</li>
          <li>Respect different perspectives and experiences</li>
          <li>Keep discussions positive and constructive</li>
          <li>Only share your own posts and experiences</li>
        </ul>
      </div>
    </div>
  );
};

// Predictive Health Component
const PredictiveHealth = ({ user, userData }) => {
  const [healthData, setHealthData] = useState({
    sleepHours: 7,
    stressLevel: 3,
    activityMinutes: 45,
    waterIntake: 6,
    moodScore: 4,
    nutritionScore: 3
  });
  
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [healthTips, setHealthTips] = useState([]);

  const calculateHealthPredictions = async () => {
    setLoading(true);
    
    // Simulate AI analysis based on user data
    const sleepScore = healthData.sleepHours >= 7 ? 5 : healthData.sleepHours >= 6 ? 3 : 1;
    const stressScore = 6 - healthData.stressLevel; // Invert stress (1-5 scale)
    const activityScore = Math.min(5, Math.floor(healthData.activityMinutes / 15));
    const hydrationScore = Math.min(5, Math.floor(healthData.waterIntake / 2));
    const moodScore = healthData.moodScore;
    const nutritionScore = healthData.nutritionScore;

    const overallScore = (
      sleepScore + stressScore + activityScore + hydrationScore + moodScore + nutritionScore
    ) / 6;

    // Generate predictions based on scores
    const healthRisk = overallScore >= 4 ? 'Low' : overallScore >= 3 ? 'Moderate' : 'High';
    const energyLevel = overallScore >= 4 ? 'High' : overallScore >= 3 ? 'Moderate' : 'Low';
    const recoveryTime = overallScore >= 4 ? 'Fast' : overallScore >= 3 ? 'Normal' : 'Slow';

    // Generate personalized tips
    const tips = [];
    if (healthData.sleepHours < 7) {
      tips.push("💤 Aim for 7-9 hours of sleep for optimal recovery and cognitive function");
    }
    if (healthData.stressLevel > 3) {
      tips.push("🧘 Try 10-minute meditation sessions to reduce stress levels");
    }
    if (healthData.activityMinutes < 30) {
      tips.push("🚶 Increase daily activity to at least 30 minutes for better cardiovascular health");
    }
    if (healthData.waterIntake < 8) {
      tips.push("💧 Drink at least 8 glasses of water daily for proper hydration");
    }
    if (healthData.moodScore < 3) {
      tips.push("😊 Practice gratitude journaling to improve mood and mental wellbeing");
    }
    if (healthData.nutritionScore < 3) {
      tips.push("🥗 Include more fruits and vegetables in your diet for better nutrition");
    }

    if (overallScore >= 4) {
      tips.push("🎉 Great job! Your health metrics are excellent. Keep maintaining this balance!");
    } else if (overallScore >= 3) {
      tips.push("📈 You're doing well! Focus on improving 1-2 areas for even better results");
    } else {
      tips.push("🔄 Consider making small, sustainable changes to improve your health metrics");
    }

    const predictionResults = {
      overallScore: Math.round(overallScore * 10) / 10,
      healthRisk,
      energyLevel,
      recoveryTime,
      categoryScores: {
        sleep: sleepScore,
        stress: stressScore,
        activity: activityScore,
        hydration: hydrationScore,
        mood: moodScore,
        nutrition: nutritionScore
      },
      weeklyTrend: 'stable', // Could be 'improving', 'declining', 'stable'
      recommendations: tips.slice(0, 4) // Show top 4 recommendations
    };

    setPredictions(predictionResults);
    setHealthTips(tips);
    
    // Save to Firebase
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        activities: arrayUnion({
          type: 'health_prediction',
          timestamp: new Date().toISOString(),
          overallScore: predictionResults.overallScore,
          healthRisk: predictionResults.healthRisk
        })
      });
    } catch (error) {
      console.error('Error saving prediction:', error);
    }
    
    setLoading(false);
  };

  const updateHealthData = (field, value) => {
    setHealthData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getScoreColor = (score) => {
    if (score >= 4) return '#28a745';
    if (score >= 3) return '#ffc107';
    return '#dc3545';
  };

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'Low': return '#28a745';
      case 'Moderate': return '#ffc107';
      case 'High': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Predictive Health Analysis</h1>
        <p style={styles.pageSubtitle}>AI-powered health insights and future wellness predictions</p>
      </div>

      {/* Health Data Input */}
      <div style={styles.healthInputSection}>
        <h3 style={styles.sectionTitle}>Your Daily Health Metrics</h3>
        <p style={styles.sectionDescription}>
          Enter your daily metrics for personalized health predictions and recommendations.
        </p>
        
        <div style={styles.healthMetricsGrid}>
          {/* Sleep Hours */}
          <div style={styles.metricCard}>
            <label style={styles.metricLabel}>😴 Sleep Hours</label>
            <div style={styles.metricInput}>
              <input
                type="range"
                min="4"
                max="12"
                value={healthData.sleepHours}
                onChange={(e) => updateHealthData('sleepHours', parseInt(e.target.value))}
                style={styles.slider}
              />
              <span style={styles.metricValue}>{healthData.sleepHours} hours</span>
            </div>
          </div>

          {/* Stress Level */}
          <div style={styles.metricCard}>
            <label style={styles.metricLabel}>😰 Stress Level (1-5)</label>
            <div style={styles.metricInput}>
              <input
                type="range"
                min="1"
                max="5"
                value={healthData.stressLevel}
                onChange={(e) => updateHealthData('stressLevel', parseInt(e.target.value))}
                style={styles.slider}
              />
              <span style={styles.metricValue}>{healthData.stressLevel}/5</span>
            </div>
          </div>

          {/* Activity Minutes */}
          <div style={styles.metricCard}>
            <label style={styles.metricLabel}>🏃 Activity Minutes</label>
            <div style={styles.metricInput}>
              <input
                type="range"
                min="0"
                max="120"
                step="15"
                value={healthData.activityMinutes}
                onChange={(e) => updateHealthData('activityMinutes', parseInt(e.target.value))}
                style={styles.slider}
              />
              <span style={styles.metricValue}>{healthData.activityMinutes} min</span>
            </div>
          </div>

          {/* Water Intake */}
          <div style={styles.metricCard}>
            <label style={styles.metricLabel}>💧 Water Glasses</label>
            <div style={styles.metricInput}>
              <input
                type="range"
                min="0"
                max="12"
                value={healthData.waterIntake}
                onChange={(e) => updateHealthData('waterIntake', parseInt(e.target.value))}
                style={styles.slider}
              />
              <span style={styles.metricValue}>{healthData.waterIntake} glasses</span>
            </div>
          </div>

          {/* Mood Score */}
          <div style={styles.metricCard}>
            <label style={styles.metricLabel}>😊 Mood Score (1-5)</label>
            <div style={styles.metricInput}>
              <input
                type="range"
                min="1"
                max="5"
                value={healthData.moodScore}
                onChange={(e) => updateHealthData('moodScore', parseInt(e.target.value))}
                style={styles.slider}
              />
              <span style={styles.metricValue}>{healthData.moodScore}/5</span>
            </div>
          </div>

          {/* Nutrition Score */}
          <div style={styles.metricCard}>
            <label style={styles.metricLabel}>🥗 Nutrition Score (1-5)</label>
            <div style={styles.metricInput}>
              <input
                type="range"
                min="1"
                max="5"
                value={healthData.nutritionScore}
                onChange={(e) => updateHealthData('nutritionScore', parseInt(e.target.value))}
                style={styles.slider}
              />
              <span style={styles.metricValue}>{healthData.nutritionScore}/5</span>
            </div>
          </div>
        </div>

        <button 
          onClick={calculateHealthPredictions}
          style={{
            ...styles.primaryButton,
            ...(loading && styles.loadingButton)
          }}
          disabled={loading}
        >
          {loading ? (
            <div style={styles.buttonLoading}>
              <div style={styles.spinner}></div>
              Analyzing Health Data...
            </div>
          ) : (
            '🔮 Get Health Predictions'
          )}
        </button>
      </div>

      {/* Predictions Display */}
      {predictions && (
        <div style={styles.predictionsSection}>
          <h3 style={styles.sectionTitle}>Your Health Predictions</h3>
          
          {/* Overall Score */}
          <div style={styles.overallScoreCard}>
            <div style={styles.scoreHeader}>
              <h4>Overall Health Score</h4>
              <span style={{
                ...styles.scoreBadge,
                background: getScoreColor(predictions.overallScore)
              }}>
                {predictions.overallScore}/5
              </span>
            </div>
            <div style={styles.scoreProgress}>
              <div 
                style={{
                  ...styles.scoreProgressBar,
                  width: `${(predictions.overallScore / 5) * 100}%`,
                  background: getScoreColor(predictions.overallScore)
                }}
              ></div>
            </div>
          </div>

          {/* Health Metrics */}
          <div style={styles.metricsGrid}>
            <div style={styles.predictionCard}>
              <div style={styles.predictionIcon}>⚠️</div>
              <div style={styles.predictionContent}>
                <h5>Health Risk</h5>
                <span style={{
                  ...styles.predictionValue,
                  color: getRiskColor(predictions.healthRisk)
                }}>
                  {predictions.healthRisk}
                </span>
              </div>
            </div>

            <div style={styles.predictionCard}>
              <div style={styles.predictionIcon}>⚡</div>
              <div style={styles.predictionContent}>
                <h5>Energy Level</h5>
                <span style={styles.predictionValue}>{predictions.energyLevel}</span>
              </div>
            </div>

            <div style={styles.predictionCard}>
              <div style={styles.predictionIcon}>🔄</div>
              <div style={styles.predictionContent}>
                <h5>Recovery Time</h5>
                <span style={styles.predictionValue}>{predictions.recoveryTime}</span>
              </div>
            </div>

            <div style={styles.predictionCard}>
              <div style={styles.predictionIcon}>📈</div>
              <div style={styles.predictionContent}>
                <h5>Weekly Trend</h5>
                <span style={styles.predictionValue}>{predictions.weeklyTrend}</span>
              </div>
            </div>
          </div>

          {/* Category Scores */}
          <div style={styles.categoryScores}>
            <h4>Category Breakdown</h4>
            <div style={styles.categoryGrid}>
              {Object.entries(predictions.categoryScores).map(([category, score]) => (
                <div key={category} style={styles.categoryItem}>
                  <div style={styles.categoryHeader}>
                    <span style={styles.categoryName}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </span>
                    <span style={{
                      ...styles.categoryScore,
                      color: getScoreColor(score)
                    }}>
                      {score}/5
                    </span>
                  </div>
                  <div style={styles.categoryProgress}>
                    <div 
                      style={{
                        ...styles.categoryProgressBar,
                        width: `${(score / 5) * 100}%`,
                        background: getScoreColor(score)
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div style={styles.recommendations}>
            <h4>Personalized Recommendations</h4>
            <div style={styles.healthRecommendationsList}>
              {predictions.recommendations.map((tip, index) => (
                <div key={index} style={styles.healthRecommendationItem}>
                  <span style={styles.healthRecommendationIcon}>💡</span>
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Health Tips */}
      {healthTips.length > 0 && (
        <div style={styles.healthTips}>
          <h3 style={styles.sectionTitle}>Additional Health Tips</h3>
          <div style={styles.tipsGrid}>
            {healthTips.slice(4).map((tip, index) => (
              <div key={index} style={styles.tipCard}>
                {tip}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


// Main App Component
function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('mentalWellness');
  const [loading, setLoading] = useState(true);
  const [profileSetup, setProfileSetup] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            setProfileSetup(data.profileCompleted || false);
          } else {
            // User doesn't have a profile yet
            setProfileSetup(false);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setProfileSetup(false);
        }
      } else {
        setUser(null);
        setUserData(null);
        setProfileSetup(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  };

  const handleRegister = async (email, password, fullName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleProfileComplete = () => {
    setProfileSetup(true);
    // Refresh user data after profile completion
    if (user) {
      getDoc(doc(db, 'users', user.uid)).then(doc => {
        if (doc.exists()) {
          setUserData(doc.data());
        }
      });
    }
  };

  // In your App.js file, find the AppContent component and update it:

const AppContent = () => {
  const renderActiveTab = () => {
    switch(activeTab) {
      case 'mentalWellness':
        return <MentalWellness user={user} userData={userData} />;
      case 'fitnessCoach':
        return <FitnessCoach user={user} userData={userData} />;
      case 'brainGames':
        return <BrainGames user={user} userData={userData} />;
      case 'predictiveHealth':
        return <PredictiveHealth user={user} userData={userData} />;
      case 'community':
        return <Community user={user} userData={userData} />;
      case 'chillZone':
        return <ChillZone user={user} userData={userData} />;
      default:
        return <MentalWellness user={user} userData={userData} />;
    }
  };

  // Update the navTabs array to include Chill Zone
  const navTabs = [
    { id: 'mentalWellness', label: 'Mental Wellness', emoji: '😊' },
    { id: 'fitnessCoach', label: 'Fitness Coach', emoji: '💪' },
    { id: 'brainGames', label: 'Brain Games', emoji: '🧠' },
    { id: 'predictiveHealth', label: 'Predictive Health', emoji: '🔮' },
    { id: 'community', label: 'Community', emoji: '👥' },
    { id: 'chillZone', label: 'Chill Zone', emoji: '🌿' }
  ];

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.appTitle}>AAROHAN🪽</h1>
          <div style={styles.userInfo}>
            <h2 style={styles.welcomeMessage}>
              Welcome back, {userData?.fullName || 'User'}!
            </h2>
            <div style={styles.userStats}>
              <span style={styles.stat}>Points: {userData?.points || 0}</span>
              <span style={styles.stat}>Streak: {userData?.streak || 0} days</span>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      <nav style={styles.nav}>
        {navTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.navButton,
              ...(activeTab === tab.id && styles.activeNavButton)
            }}
          >
            <span style={styles.navEmoji}>{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      <main style={styles.main}>
        {renderActiveTab()}
      </main>
    </div>
  );
};

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading Aarohan...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthSection onLogin={handleLogin} onRegister={handleRegister} />;
  }

  if (!profileSetup) {
    return <UserProfileSetup user={user} onComplete={handleProfileComplete} />;
  }

  return <AppContent />;
}

// Enhanced Styles Object with Voice Features
// Enhanced Styles Object with Voice Features
const styles = {
  app: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    color: 'white',
    textAlign: 'center'
  },
  loadingSpinner: {
    width: '50px',
    height: '50px',
    border: '4px solid rgba(255,255,255,0.3)',
    borderTop: '4px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px'
  },
  // Auth Styles
  authContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  authCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '3rem',
    borderRadius: '20px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
    backdropFilter: 'blur(10px)'
  },
  authHeader: {
    textAlign: 'center',
    marginBottom: '2rem'
  },
  authTitle: {
    margin: '0 0 0.5rem 0',
    color: '#333',
    fontSize: '1.8rem',
    fontWeight: 'bold'
  },
  authSubtitle: {
    color: '#666',
    margin: '0 0 2rem 0',
    fontSize: '1rem'
  },
  authForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  input: {
    padding: '1rem',
    borderRadius: '12px',
    border: '2px solid #e0e0e0',
    fontSize: '1rem',
    background: 'rgba(255,255,255,0.8)',
    transition: 'all 0.3s ease',
    outline: 'none'
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '1rem 1.5rem',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '1rem',
    transition: 'all 0.3s ease'
  },
  loadingButton: {
    opacity: 0.8,
    cursor: 'not-allowed'
  },
  buttonLoading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid transparent',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  secondaryButton: {
    background: 'transparent',
    color: '#667eea',
    border: '2px solid #667eea',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.3s ease'
  },
  authFooter: {
    textAlign: 'center',
    marginTop: '1.5rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid #e0e0e0'
  },
  switchButton: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500'
  },
  error: {
    background: '#ff4757',
    color: 'white',
    padding: '0.75rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    textAlign: 'center',
    fontWeight: '500'
  },
  // Header Styles
  header: {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '1rem 2rem',
    boxShadow: '0 2px 20px rgba(0,0,0,0.1)',
    backdropFilter: 'blur(10px)'
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  appTitle: {
    margin: 0,
    color: '#333',
    fontSize: '1.5rem',
    fontWeight: 'bold'
  },
  userInfo: {
    textAlign: 'center'
  },
  welcomeMessage: {
    margin: '0 0 0.5rem 0',
    color: '#333',
    fontSize: '1.1rem'
  },
  userStats: {
    display: 'flex',
    gap: '1.5rem',
    fontSize: '0.9rem'
  },
  stat: {
    color: '#667eea',
    fontWeight: '600'
  },
  logoutButton: {
    background: '#ff4757',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.3s ease'
  },
  nav: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '1rem 2rem',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)'
  },
  navButton: {
    background: 'rgba(255, 255, 255, 0.9)',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '25px',
    cursor: 'pointer',
    fontWeight: '600',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.3s ease'
  },
  activeNavButton: {
    background: '#667eea',
    color: 'white',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)'
  },
  navEmoji: {
    fontSize: '1.1em'
  },
  main: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '2rem'
  },
  pageContainer: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    padding: '2rem',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
    backdropFilter: 'blur(10px)'
  },
  pageHeader: {
    textAlign: 'center',
    marginBottom: '2rem'
  },
  pageTitle: {
    margin: '0 0 0.5rem 0',
    color: '#333',
    fontSize: '2rem',
    fontWeight: 'bold'
  },
  pageSubtitle: {
    margin: 0,
    color: '#666',
    fontSize: '1.1rem'
  },
  // Profile Setup Styles
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem'
  },
  goalsSection: {
    margin: '1rem 0'
  },
  sectionLabel: {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#333',
    fontWeight: '600'
  },
  goalsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem'
  },
  goalCard: {
    background: '#f8f9fa',
    padding: '1.5rem',
    borderRadius: '12px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: '2px solid transparent'
  },
  activeGoalCard: {
    background: '#667eea',
    color: 'white',
    borderColor: '#667eea',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
  },
  goalIcon: {
    fontSize: '2rem',
    marginBottom: '0.5rem'
  },
  goalLabel: {
    fontWeight: '600',
    fontSize: '0.9rem'
  },
  // Mental Wellness Styles
  crisisBanner: {
    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
    color: 'white',
    padding: '1rem',
    borderRadius: '12px',
    marginBottom: '1.5rem',
    animation: 'pulse 2s infinite',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  crisisContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flex: 1
  },
  crisisIcon: {
    fontSize: '2rem'
  },
  errorBanner: {
    background: '#ffc107',
    color: '#856404',
    padding: '0.75rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    textAlign: 'center',
    border: '1px solid #ffeaa7'
  },
  chatLayout: {
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    gap: '2rem',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  sidebarTitle: {
    color: '#333',
    marginBottom: '1rem',
    fontSize: '1.1rem',
    fontWeight: '600'
  },
  quickActions: {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '1.5rem',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)'
  },
  crisisButton: {
    width: '100%',
    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
    color: 'white',
    border: 'none',
    padding: '0.75rem',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '0.75rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'all 0.3s ease'
  },
  quickButton: {
    width: '100%',
    background: 'rgba(102, 126, 234, 0.1)',
    color: '#667eea',
    border: '1px solid rgba(102, 126, 234, 0.2)',
    padding: '0.75rem',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '0.75rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'all 0.3s ease'
  },
  professionalHelpButton: {
    width: '100%',
    background: '#28a745',
    color: 'white',
    border: 'none',
    padding: '0.75rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'all 0.3s ease'
  },
  voiceSection: {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '1.5rem',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)'
  },
  voiceButton: {
    width: '100%',
    background: '#17a2b8',
    color: 'white',
    border: 'none',
    padding: '0.75rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'all 0.3s ease'
  },
  listeningButton: {
    background: '#dc3545',
    animation: 'pulse 1.5s infinite'
  },
  stopSpeechButton: {
    width: '100%',
    background: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '0.75rem',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: '600'
  },
  mainChatArea: {
    display: 'flex',
    flexDirection: 'column'
  },
  chatSection: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    padding: '2rem',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
    flex: 1
  },
  chatContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  chatMessages: {
    flex: 1,
    overflowY: 'auto',
    maxHeight: '60vh',
    padding: '1rem',
    background: 'rgba(248, 249, 250, 0.5)',
    borderRadius: '12px',
    marginBottom: '1.5rem'
  },
  chatWelcomeMessage: {
    textAlign: 'center',
    padding: '3rem 2rem',
    color: '#666'
  },
  welcomeIcon: {
    fontSize: '4rem',
    marginBottom: '1.5rem'
  },
  welcomeTips: {
    textAlign: 'left',
    maxWidth: '400px',
    margin: '2rem auto 0',
    background: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid #e0e0e0'
  },
  chatMessage: {
    marginBottom: '1rem',
    padding: '1.25rem',
    borderRadius: '12px',
    maxWidth: '85%',
    position: 'relative'
  },
  userMessage: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    marginLeft: 'auto',
    borderBottomRightRadius: '4px'
  },
  aiMessage: {
    background: 'white',
    color: '#333',
    border: '1px solid #e0e0e0',
    marginRight: 'auto',
    borderBottomLeftRadius: '4px'
  },
  crisisMessage: {
    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
    color: 'white',
    border: 'none'
  },
  messageContent: {
    marginBottom: '0.5rem'
  },
  messageLine: {
    margin: '0.25rem 0',
    lineHeight: '1.5'
  },
  messageTime: {
    fontSize: '0.75rem',
    opacity: 0.7,
    textAlign: 'right'
  },
  suggestHelpButton: {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.5)',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    marginTop: '0.75rem',
    fontSize: '0.8rem',
    fontWeight: '600'
  },
  chatInputContainer: {
    borderTop: '1px solid #e0e0e0',
    paddingTop: '1.5rem'
  },
  inputArea: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start'
  },
  inputWrapper: {
    flex: 1,
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center'
  },
  textInput: {
    flex: 1,
    padding: '1rem 1.25rem',
    borderRadius: '12px',
    border: '2px solid #e0e0e0',
    fontSize: '1rem',
    background: 'white',
    outline: 'none',
    transition: 'all 0.3s ease',
    minHeight: '60px',
    resize: 'none',
    fontFamily: 'inherit'
  },
  voiceInputButton: {
    background: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    flexShrink: 0
  },
  listeningIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#dc3545',
    fontSize: '0.9rem',
    fontWeight: '600',
    marginTop: '0.5rem',
    padding: '0.5rem'
  },
  pulsingDot: {
    width: '10px',
    height: '10px',
    backgroundColor: '#dc3545',
    borderRadius: '50%',
    animation: 'pulse 1.5s infinite'
  },
  disclaimerText: {
    fontSize: '0.8rem',
    color: '#666',
    textAlign: 'center',
    marginTop: '1rem',
    fontStyle: 'italic'
  },
  // Professional Help Styles
  professionalHelpSection: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '800px',
    maxHeight: '80vh',
    background: 'white',
    borderRadius: '20px',
    padding: '2rem',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    zIndex: 1000,
    overflowY: 'auto'
  },
  professionalHelpHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: '1rem'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '2rem',
    cursor: 'pointer',
    color: '#666',
    padding: '0',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  crisisAlert: {
    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
    color: 'white',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    textAlign: 'center'
  },
  resourceCategories: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },
  resourceCategory: {
    background: '#f8f9fa',
    padding: '1.5rem',
    borderRadius: '12px'
  },
  resourceCard: {
    background: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    border: '1px solid #e0e0e0',
    transition: 'all 0.3s ease'
  },
  resourceName: {
    margin: '0 0 0.5rem 0',
    color: '#333',
    fontSize: '1.1rem'
  },
  resourceNumber: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: '#dc3545',
    margin: '0.5rem 0'
  },
  resourceDescription: {
    color: '#666',
    margin: '0.5rem 0',
    lineHeight: '1.5'
  },
  resourceMeta: {
    display: 'flex',
    gap: '1rem',
    fontSize: '0.9rem',
    color: '#888',
    margin: '0.5rem 0'
  },
  specializations: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    margin: '0.5rem 0'
  },
  specializationTag: {
    background: '#e3f2fd',
    color: '#1976d2',
    padding: '0.3rem 0.6rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: '500'
  },
  features: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    margin: '0.5rem 0'
  },
  featureTag: {
    background: '#e8f5e8',
    color: '#2e7d32',
    padding: '0.3rem 0.6rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: '500'
  },
  resourceLink: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: '600',
    display: 'inline-block',
    marginTop: '0.5rem',
    padding: '0.5rem 1rem',
    background: 'rgba(102, 126, 234, 0.1)',
    borderRadius: '6px',
    transition: 'all 0.3s ease'
  },
  disclaimer: {
    background: '#fff3cd',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #ffeaa7',
    color: '#856404',
    fontSize: '0.9rem',
    marginTop: '1.5rem',
    lineHeight: '1.5'
  },
  // Fitness Coach Styles
  goalSelection: {
    marginBottom: '2rem',
    padding: '1.5rem',
    background: '#f8f9fa',
    borderRadius: '12px',
    border: '1px solid #e0e0e0'
  },
  goalsSelectionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem',
    marginTop: '1rem'
  },
  levelSelection: {
    marginBottom: '2rem'
  },
  levelsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginTop: '1rem'
  },
  levelCard: {
    background: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: '2px solid transparent'
  },
  activeLevelCard: {
    background: '#667eea',
    color: 'white',
    borderColor: '#667eea',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
  },
  levelIcon: {
    fontSize: '2rem',
    marginBottom: '0.5rem'
  },
  levelDescription: {
    fontSize: '0.8rem',
    color: 'rgba(255,255,255,0.8)'
  },
  planSection: {
    marginBottom: '2rem',
    padding: '1.5rem',
    background: '#f8f9fa',
    borderRadius: '12px',
    border: '1px solid #e0e0e0'
  },
  planTabs: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap'
  },
  planTab: {
    background: 'white',
    border: '2px solid #e0e0e0',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.3s ease',
    flex: 1,
    minWidth: '120px',
    justifyContent: 'center'
  },
  activePlanTab: {
    background: '#667eea',
    color: 'white',
    borderColor: '#667eea',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
  },
  tabIcon: {
    fontSize: '1.1rem'
  },
  noGoalSelected: {
    textAlign: 'center',
    padding: '2rem',
    color: '#666',
    background: 'white',
    borderRadius: '8px',
    border: '2px dashed #e0e0e0'
  },
  planContent: {
    background: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    border: '1px solid #e0e0e0'
  },
  planHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  planList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  planItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    padding: '0.5rem 0',
    color: '#333',
    fontSize: '0.95rem',
    lineHeight: '1.4'
  },
  bullet: {
    color: '#667eea',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    flexShrink: 0,
    marginTop: '0.1rem'
  },
  savePlanButton: {
    background: '#28a745',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap'
  },
  // Add more styles for other components as needed...
  sectionTitle: {
    color: '#333',
    marginBottom: '1rem',
    fontSize: '1.3rem',
    fontWeight: 'bold'
  },
  sectionDescription: {
    color: '#666',
    marginBottom: '1.5rem',
    fontSize: '1rem'
  },
  // ... your existing styles ...

// NEW FITNESS STYLES - ADD THESE TO YOUR EXISTING STYLES OBJECT
formSections: {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '2rem',
  marginBottom: '2rem'
},

formSection: {
  background: 'white',
  padding: '1.5rem',
  borderRadius: '12px',
  border: '1px solid #e0e0e0',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
},

levelOptions: {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem'
},

levelOption: {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '1rem',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  border: '2px solid #e0e0e0',
  background: '#f8f9fa'
},

activeLevelOption: {
  borderColor: '#667eea',
  background: 'rgba(102, 126, 234, 0.1)',
  transform: 'translateY(-2px)',
  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.1)'
},

levelRadio: {
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  border: '2px solid #667eea',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
},

radioDot: {
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  background: '#667eea'
},

levelLabel: {
  flex: 1,
  fontWeight: '500',
  fontSize: '1rem'
},

daysOptions: {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
  gap: '0.75rem'
},

dayOption: {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '1rem',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  border: '2px solid #e0e0e0',
  background: '#f8f9fa'
},

activeDayOption: {
  borderColor: '#667eea',
  background: 'rgba(102, 126, 234, 0.1)',
  transform: 'translateY(-2px)',
  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.1)'
},

dayRadio: {
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  border: '2px solid #667eea',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
},

dayLabel: {
  fontWeight: '500',
  fontSize: '0.9rem'
},

checkmark: {
  color: '#667eea',
  fontWeight: 'bold',
  fontSize: '1rem'
},

generateSection: {
  textAlign: 'center',
  margin: '3rem 0'
},

generateButton: {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  border: 'none',
  padding: '1.25rem 3rem',
  borderRadius: '12px',
  fontSize: '1.1rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
  minWidth: '250px'
},

fitnessPlanModal: {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: '800px',
  maxHeight: '90vh',
  background: 'white',
  borderRadius: '20px',
  padding: '2rem',
  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  zIndex: 1000,
  overflowY: 'auto'
},

modalHeader: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2rem',
  paddingBottom: '1rem',
  borderBottom: '2px solid #e0e0e0'
},

closeModalButton: {
  background: 'none',
  border: 'none',
  fontSize: '2rem',
  cursor: 'pointer',
  color: '#666',
  padding: '0.5rem',
  lineHeight: '1'
},

planOverview: {
  marginBottom: '2rem'
},

planCard: {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  padding: '2rem',
  borderRadius: '12px'
},

planTitleHero: {
  margin: '0 0 1rem 0',
  fontSize: '1.5rem'
},

planDetails: {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem'
},

planDetail: {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem'
},

detailLabel: {
  fontSize: '0.9rem',
  opacity: 0.8
},

detailValue: {
  fontSize: '1.1rem',
  fontWeight: '600'
},

exerciseSection: {
  marginBottom: '2rem'
},

exerciseList: {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
},

exerciseItem: {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '1rem',
  background: '#f8f9fa',
  borderRadius: '8px',
  borderLeft: '4px solid #667eea'
},

exerciseNumber: {
  background: '#667eea',
  color: 'white',
  width: '30px',
  height: '30px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  flexShrink: 0
},

exerciseContent: {
  flex: 1
},

recommendationsSection: {
  marginBottom: '2rem'
},

recommendationsList: {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem'
},

recommendationItem: {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '0.75rem',
  background: '#e8f5e8',
  borderRadius: '8px',
  color: '#2e7d32'
},

recommendationIcon: {
  fontSize: '1.2rem',
  fontWeight: 'bold'
},

planActions: {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'flex-end'
},

fitnessGoalsGrid: {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '1.5rem',
  marginTop: '1rem'
},

fitnessGoalCard: {
  background: 'white',
  padding: '1.5rem',
  borderRadius: '12px',
  border: '2px solid #e0e0e0',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  position: 'relative'
},

activeFitnessGoalCard: {
  borderColor: '#667eea',
  background: 'rgba(102, 126, 234, 0.05)',
  transform: 'translateY(-2px)',
  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.15)'
},

goalTitle: {
  margin: '0 0 0.5rem 0',
  color: '#333',
  fontSize: '1.2rem',
  fontWeight: '600'
},

goalDescription: {
  margin: 0,
  color: '#666',
  fontSize: '0.9rem',
  lineHeight: '1.4'
},

selectedIndicator: {
  position: 'absolute',
  top: '1rem',
  right: '1rem',
  background: '#667eea',
  color: 'white',
  padding: '0.25rem 0.75rem',
  borderRadius: '12px',
  fontSize: '0.8rem',
  fontWeight: '500'
},

section: {
  marginBottom: '2rem'
},
// Brain Games Missing Styles
container: {
  display: 'grid',
  gridTemplateColumns: '280px 1fr',
  gap: '2rem',
  marginTop: '1rem'
},

gameList: {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
},

gameItem: {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '1rem',
  background: 'white',
  borderRadius: '12px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  border: '2px solid transparent'
},

activeGameItem: {
  background: '#667eea',
  color: 'white',
  borderColor: '#667eea',
  transform: 'translateY(-2px)',
  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
},

gameIcon: {
  fontSize: '1.5rem'
},

gameInfo: {
  flex: 1
},

gameName: {
  fontWeight: '600',
  fontSize: '1rem',
  marginBottom: '0.25rem'
},

gameDescription: {
  fontSize: '0.8rem',
  opacity: 0.8
},

scoreSection: {
  background: 'white',
  padding: '1rem',
  borderRadius: '12px',
  marginTop: '1rem'
},

currentScore: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '0.5rem'
},

scoreLabel: {
  fontWeight: '600',
  color: '#333'
},

scoreValue: {
  fontWeight: 'bold',
  color: '#667eea',
  fontSize: '1.1rem'
},

questionsProgress: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.9rem',
  color: '#666'
},

voiceSupportInfo: {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  background: '#e3f2fd',
  padding: '0.75rem',
  borderRadius: '8px',
  marginTop: '1rem',
  fontSize: '0.8rem',
  color: '#1976d2'
},

voiceIcon: {
  fontSize: '1rem'
},

mainContent: {
  background: 'white',
  borderRadius: '12px',
  padding: '2rem',
  minHeight: '500px'
},

gameIntro: {
  textAlign: 'center',
  padding: '2rem'
},

gameIntroHeader: {
  marginBottom: '2rem'
},

gameIntroIcon: {
  fontSize: '4rem',
  marginBottom: '1rem'
},

gameIntroTitle: {
  fontSize: '1.8rem',
  marginBottom: '0.5rem',
  color: '#333'
},

gameIntroDescription: {
  color: '#666',
  fontSize: '1.1rem'
},

gameInstructions: {
  background: '#f8f9fa',
  padding: '1.5rem',
  borderRadius: '12px',
  marginBottom: '2rem',
  textAlign: 'left'
},

instructionsList: {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
},

instructionItem: {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  color: '#333'
},

instructionBullet: {
  color: '#667eea',
  fontWeight: 'bold'
},

gameArea: {
  textAlign: 'center'
},

gameTitle: {
  fontSize: '1.5rem',
  marginBottom: '0.5rem',
  color: '#333'
},

memoryGrid: {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '0.5rem',
  marginTop: '1rem',
  maxWidth: '400px',
  margin: '1rem auto'
},

memoryCard: {
  aspectRatio: '1',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.5rem',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  color: 'white',
  fontWeight: 'bold'
},

memoryCardFlipped: {
  background: 'white',
  color: '#333',
  border: '2px solid #667eea'
},

mathGame: {
  background: '#f8f9fa',
  padding: '2rem',
  borderRadius: '12px',
  marginTop: '1rem'
},

mathProblem: {
  fontSize: '2rem',
  marginBottom: '1.5rem',
  color: '#333'
},

mathAnswers: {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '1rem',
  marginBottom: '1rem'
},

mathButton: {
  background: 'white',
  border: '2px solid #667eea',
  padding: '1rem',
  borderRadius: '8px',
  fontSize: '1.2rem',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  fontWeight: 'bold',
  color: '#333'
},

mathScore: {
  fontSize: '1.1rem',
  fontWeight: 'bold',
  color: '#667eea'
},

riddleGame: {
  background: '#f8f9fa',
  padding: '2rem',
  borderRadius: '12px',
  marginTop: '1rem',
  textAlign: 'left'
},

riddleQuestion: {
  marginBottom: '1.5rem'
},

riddleText: {
  fontSize: '1.2rem',
  color: '#333',
  fontStyle: 'italic',
  lineHeight: '1.5'
},

riddleInput: {
  display: 'flex',
  gap: '0.5rem',
  marginBottom: '1rem',
  alignItems: 'center'
},

riddleActions: {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'space-between',
  marginBottom: '1rem'
},

hintButton: {
  background: '#ffc107',
  color: '#333',
  border: 'none',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '0.9rem'
},

hintBox: {
  background: '#fff3cd',
  padding: '1rem',
  borderRadius: '8px',
  border: '1px solid #ffeaa7',
  color: '#856404',
  marginBottom: '1rem'
},

progressInfo: {
  textAlign: 'center',
  marginTop: '1rem',
  fontWeight: '600',
  color: '#333'
},

reasoningGame: {
  background: '#f8f9fa',
  padding: '2rem',
  borderRadius: '12px',
  marginTop: '1rem',
  textAlign: 'left'
},

reasoningQuestion: {
  marginBottom: '1.5rem'
},

reasoningText: {
  fontSize: '1.1rem',
  color: '#333',
  lineHeight: '1.5'
},

reasoningFeedback: {
  padding: '1rem',
  borderRadius: '8px',
  marginBottom: '1rem',
  fontWeight: '600'
},

multipleChoiceGrid: {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  marginBottom: '1.5rem'
},

multipleChoiceButton: {
  background: 'white',
  border: '2px solid #e0e0e0',
  padding: '1rem 1.5rem',
  borderRadius: '8px',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'all 0.3s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  fontSize: '1rem'
},

disabledButton: {
  opacity: 0.6,
  cursor: 'not-allowed'
},

optionLetter: {
  background: '#667eea',
  color: 'white',
  width: '30px',
  height: '30px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  fontSize: '0.9rem'
},

nextButtonContainer: {
  textAlign: 'center',
  marginTop: '1.5rem'
},

nextButton: {
  background: '#28a745',
  color: 'white',
  border: 'none',
  padding: '1rem 2rem',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '1rem'
},

reasoningNote: {
  textAlign: 'center',
  color: '#666',
  fontSize: '0.9rem',
  marginTop: '1rem'
},

puzzleTypeGrid: {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem',
  marginBottom: '2rem'
},

puzzleTypeCard: {
  background: 'white',
  padding: '1.5rem',
  borderRadius: '12px',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  border: '2px solid #e0e0e0'
},

activePuzzleTypeCard: {
  background: '#667eea',
  color: 'white',
  borderColor: '#667eea',
  transform: 'translateY(-2px)',
  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
},

puzzleTypeIcon: {
  fontSize: '2rem',
  marginBottom: '0.5rem'
},

puzzleTypeName: {
  fontWeight: '600',
  fontSize: '1rem',
  marginBottom: '0.5rem'
},

puzzleTypeDesc: {
  fontSize: '0.8rem',
  opacity: 0.8
},

noPuzzleMessage: {
  textAlign: 'center',
  padding: '3rem',
  color: '#666',
  background: '#f8f9fa',
  borderRadius: '12px'
},

scrambleGame: {
  background: '#f8f9fa',
  padding: '2rem',
  borderRadius: '12px',
  marginTop: '1rem'
},

scrambledWord: {
  fontSize: '3rem',
  fontWeight: 'bold',
  color: '#333',
  marginBottom: '1.5rem',
  letterSpacing: '0.5rem',
  background: 'white',
  padding: '1rem',
  borderRadius: '8px',
  border: '2px solid #667eea'
},

scrambleInput: {
  display: 'flex',
  gap: '0.5rem',
  marginBottom: '1rem',
  justifyContent: 'center'
},

scrambleActions: {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'center',
  marginBottom: '1rem'
},

scrambleInfo: {
  display: 'flex',
  justifyContent: 'center',
  gap: '2rem',
  fontWeight: '600'
},

scrambleScore: {
  color: '#28a745'
},

scrambleLives: {
  color: '#dc3545'
},

gameOver: {
  textAlign: 'center',
  padding: '3rem'
},

gameOverTitle: {
  fontSize: '2rem',
  marginBottom: '1rem',
  color: '#333'
},

finalScore: {
  fontSize: '1.5rem',
  color: '#667eea',
  fontWeight: 'bold',
  marginBottom: '0.5rem'
},

questionsCompleted: {
  fontSize: '1.1rem',
  color: '#666',
  marginBottom: '2rem'
},

gameOverButtons: {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'center'
},

feedback: {
  padding: '1rem',
  borderRadius: '8px',
  marginBottom: '1rem',
  fontWeight: '600',
  textAlign: 'center'
},

// Community Styles
createPost: {
  background: 'white',
  padding: '1.5rem',
  borderRadius: '12px',
  marginBottom: '2rem',
  border: '1px solid #e0e0e0'
},

postHeader: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '1rem'
},

postUserInfo: {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem'
},

userAvatar: {
  fontSize: '2rem'
},

userLevel: {
  fontSize: '0.8rem',
  color: '#667eea',
  fontWeight: '600'
},

postInput: {
  width: '100%',
  padding: '1rem',
  borderRadius: '8px',
  border: '2px solid #e0e0e0',
  fontSize: '1rem',
  marginBottom: '1rem',
  resize: 'vertical',
  minHeight: '100px',
  fontFamily: 'inherit'
},

tagsSection: {
  marginBottom: '1rem'
},

tagsLabel: {
  display: 'block',
  marginBottom: '0.5rem',
  fontWeight: '600',
  color: '#333'
},

tagsContainer: {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem'
},

tagButton: {
  background: '#f8f9fa',
  border: '1px solid #e0e0e0',
  padding: '0.5rem 1rem',
  borderRadius: '20px',
  cursor: 'pointer',
  fontSize: '0.8rem',
  transition: 'all 0.3s ease'
},

activeTagButton: {
  background: '#667eea',
  color: 'white',
  borderColor: '#667eea'
},

postsContainer: {
  marginBottom: '2rem'
},

noPosts: {
  textAlign: 'center',
  padding: '3rem',
  color: '#666',
  background: '#f8f9fa',
  borderRadius: '12px'
},

postCard: {
  background: 'white',
  padding: '1.5rem',
  borderRadius: '12px',
  marginBottom: '1rem',
  border: '1px solid #e0e0e0'
},

postMeta: {
  display: 'flex',
  gap: '1rem',
  fontSize: '0.8rem',
  color: '#666'
},

postTime: {
  color: '#999'
},

deleteButton: {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '1.2rem',
  padding: '0.5rem'
},

postContent: {
  margin: '1rem 0',
  lineHeight: '1.5',
  color: '#333'
},

postTags: {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem',
  marginBottom: '1rem'
},

postTag: {
  background: '#e3f2fd',
  color: '#1976d2',
  padding: '0.3rem 0.6rem',
  borderRadius: '12px',
  fontSize: '0.8rem'
},

postActions: {
  display: 'flex',
  gap: '1rem'
},

likeButton: {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.9rem',
  color: '#666',
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem'
},

commentButton: {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.9rem',
  color: '#666',
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem'
},

shareButton: {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.9rem',
  color: '#666',
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem'
},

guidelines: {
  background: '#f8f9fa',
  padding: '1.5rem',
  borderRadius: '12px',
  border: '1px solid #e0e0e0'
},

guidelinesTitle: {
  margin: '0 0 1rem 0',
  color: '#333'
},

guidelinesList: {
  margin: 0,
  paddingLeft: '1.5rem',
  color: '#666',
  lineHeight: '1.5'
},

// Predictive Health Styles
healthInputSection: {
  background: '#f8f9fa',
  padding: '2rem',
  borderRadius: '12px',
  marginBottom: '2rem',
  border: '1px solid #e0e0e0'
},

healthMetricsGrid: {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '1.5rem',
  marginBottom: '2rem'
},

metricCard: {
  background: 'white',
  padding: '1.5rem',
  borderRadius: '12px',
  border: '1px solid #e0e0e0'
},

metricLabel: {
  display: 'block',
  marginBottom: '1rem',
  fontWeight: '600',
  color: '#333',
  fontSize: '1rem'
},

metricInput: {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem'
},

slider: {
  flex: 1,
  height: '6px',
  borderRadius: '3px',
  background: '#ddd',
  outline: 'none'
},

metricValue: {
  fontWeight: '600',
  color: '#667eea',
  minWidth: '80px',
  textAlign: 'right'
},

predictionsSection: {
  background: 'white',
  padding: '2rem',
  borderRadius: '12px',
  border: '1px solid #e0e0e0',
  marginBottom: '2rem'
},

overallScoreCard: {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  padding: '2rem',
  borderRadius: '12px',
  marginBottom: '2rem',
  textAlign: 'center'
},

scoreHeader: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem'
},

scoreBadge: {
  background: 'rgba(255,255,255,0.2)',
  padding: '0.5rem 1rem',
  borderRadius: '20px',
  fontWeight: 'bold',
  fontSize: '1.1rem'
},

scoreProgress: {
  height: '8px',
  background: 'rgba(255,255,255,0.3)',
  borderRadius: '4px',
  overflow: 'hidden'
},

scoreProgressBar: {
  height: '100%',
  transition: 'width 0.5s ease'
},

metricsGrid: {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem',
  marginBottom: '2rem'
},

predictionCard: {
  background: '#f8f9fa',
  padding: '1.5rem',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '1rem'
},

predictionIcon: {
  fontSize: '2rem'
},

predictionContent: {
  flex: 1
},

predictionValue: {
  fontSize: '1.2rem',
  fontWeight: 'bold'
},

categoryScores: {
  marginBottom: '2rem'
},

categoryGrid: {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
},

categoryItem: {
  background: '#f8f9fa',
  padding: '1rem',
  borderRadius: '8px'
},

categoryHeader: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '0.5rem'
},

categoryName: {
  fontWeight: '600',
  color: '#333'
},

categoryScore: {
  fontWeight: 'bold',
  fontSize: '1.1rem'
},

categoryProgress: {
  height: '6px',
  background: '#ddd',
  borderRadius: '3px',
  overflow: 'hidden'
},

categoryProgressBar: {
  height: '100%',
  transition: 'width 0.5s ease'
},

recommendations: {
  background: '#e8f5e8',
  padding: '1.5rem',
  borderRadius: '12px',
  border: '1px solid #c8e6c9'
},

healthRecommendationsList: {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
},

healthRecommendationItem: {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '1rem',
  color: '#2e7d32'
},

healthRecommendationIcon: {
  fontSize: '1.2rem',
  flexShrink: 0
},

healthTips: {
  background: '#f8f9fa',
  padding: '2rem',
  borderRadius: '12px',
  border: '1px solid #e0e0e0'
},

tipsGrid: {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '1rem',
  marginTop: '1rem'
},

tipCard: {
  background: 'white',
  padding: '1rem',
  borderRadius: '8px',
  border: '1px solid #e0e0e0',
  color: '#333',
  lineHeight: '1.4'
}
};

// Add CSS animations
const globalStyles = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
`;

// Inject global styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = globalStyles;
  document.head.appendChild(styleSheet);
}

export default App;