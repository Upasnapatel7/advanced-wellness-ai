// src/services/aiService.js
//
// Calls our own Vercel serverless function at /api/chat, which talks to
// Gemini server-side. The browser never sees the Gemini API key.
// If that call fails for any reason, we fall back to a small set of
// hand-written therapeutic responses so the chat never goes silent.

class MentalHealthAIService {
  constructor() {
    this.conversationHistory = [];
    this.userContext = {};
  }

  setUserContext(userData) {
    this.userContext = {
      name: userData?.fullName || 'User',
      points: userData?.points || 0,
      streak: userData?.streak || 0,
      fitnessGoal: userData?.fitnessGoal || 'Not set'
    };
  }

  async getResponse(message, chatHistory = []) {
    // Crisis detection first — always handled locally and immediately,
    // regardless of whether the AI backend is reachable.
    if (this.isCrisis(message)) {
      return this.getCrisisResponse();
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: chatHistory.map((m) => ({ type: m.type, text: m.text })),
          userContext: this.userContext
        })
      });

      if (!response.ok) {
        throw new Error(`Chat API returned ${response.status}`);
      }

      const data = await response.json();

      if (!data.text) {
        throw new Error('Empty response from chat API');
      }

      return {
        text: data.text,
        sentiment: this.analyzeSentiment(message),
        needsHelp: false,
        isCrisis: false
      };
    } catch (error) {
      console.warn('AI backend failed, using fallback response:', error.message);
      return this.getTherapeuticFallback(message);
    }
  }

  getTherapeuticFallback(message) {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('anxious') || lowerMsg.includes('anxiety')) {
      return {
        text: "I hear how much anxiety is weighing on you right now. 💙 That feeling of unease can be so overwhelming. Let's take a moment together. Can you describe where you feel the anxiety in your body right now?",
        sentiment: 'anxiety',
        needsHelp: false,
        isCrisis: false
      };
    }

    if (lowerMsg.includes('lonely') || lowerMsg.includes('alone')) {
      return {
        text: "I hear the loneliness in your words, and I want you to know I'm here with you right now. 💙 Feeling isolated can be so heavy. What does loneliness feel like for you in this moment?",
        sentiment: 'loneliness',
        needsHelp: false,
        isCrisis: false
      };
    }

    if (lowerMsg.includes('sad') || lowerMsg.includes('depressed')) {
      return {
        text: "I can feel the heaviness in what you're sharing. 💙 Depression has a way of making everything feel impossible. Please know that you're not alone, and these feelings don't define who you are.",
        sentiment: 'depression',
        needsHelp: false,
        isCrisis: false
      };
    }

    if (lowerMsg.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
      return {
        text: `Hello ${this.userContext.name || 'there'}! 👋 I'm here as your supportive listener. How are you feeling today? What's on your mind?`,
        sentiment: 'positive',
        needsHelp: false,
        isCrisis: false
      };
    }

    const responses = [
      "I hear you, and I want you to know that your feelings are completely valid. Can you tell me more about what's been on your mind lately?",
      "Thank you for sharing this with me. It takes courage to open up. How long have you been feeling this way?",
      "I'm here with you. What would feel most supportive for you right now?",
      "I appreciate your honesty. Let's explore this together - what brought these feelings up for you?",
      "That sounds really difficult. I'm sitting with you in this moment. Your feelings matter."
    ];

    return {
      text: responses[Math.floor(Math.random() * responses.length)],
      sentiment: 'neutral',
      needsHelp: false,
      isCrisis: false
    };
  }

  analyzeSentiment(text) {
    const words = text.toLowerCase().split(' ');
    const emotions = {
      anxiety: ['anxious', 'worry', 'nervous', 'panic', 'overwhelm', 'scared', 'fear', 'racing'],
      depression: ['sad', 'depressed', 'hopeless', 'empty', 'numb', 'tired', 'exhausted', 'worthless'],
      loneliness: ['lonely', 'alone', 'isolated', 'disconnected', 'unseen', 'unheard'],
      anger: ['angry', 'frustrated', 'mad', 'irritated', 'furious', 'rage', 'resentful'],
      positive: ['good', 'great', 'happy', 'joy', 'excited', 'grateful', 'wonderful', 'amazing']
    };

    let detected = 'neutral';
    let maxScore = 0;

    Object.entries(emotions).forEach(([emotion, keywords]) => {
      const score = keywords.filter((k) => words.includes(k)).length;
      if (score > maxScore) {
        maxScore = score;
        detected = emotion;
      }
    });

    return detected;
  }

  isCrisis(text) {
    const crisisWords = ['suicide', 'kill myself', 'want to die', 'harm myself', 'end it all', 'no hope', 'give up'];
    return crisisWords.some((word) => text.toLowerCase().includes(word));
  }

  getCrisisResponse() {
    return {
      text: `🚨 **I'm really concerned about what you're sharing**

I hear that you're in tremendous pain right now. Please reach out for immediate support:

**Crisis Resources:**
• **988 Suicide & Crisis Lifeline**: Call or text 988
• **Crisis Text Line**: Text HOME to 741741
• **Emergency Services**: 911

You don't have to face this alone. These services are available 24/7 with trained professionals who can provide immediate support.

Would you like to talk about what's happening right now? 💙`,
      sentiment: 'crisis',
      needsHelp: true,
      isCrisis: true
    };
  }

  storeConversation(userMessage, aiResponse) {
    this.conversationHistory.push({
      user: userMessage,
      bot: aiResponse,
      timestamp: new Date().toISOString()
    });
    if (this.conversationHistory.length > 50) {
      this.conversationHistory = this.conversationHistory.slice(-50);
    }
  }
}

export const mentalHealthAI = new MentalHealthAIService();
export default mentalHealthAI;