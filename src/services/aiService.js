// src/services/aiService.js
import axios from 'axios';

class MentalHealthAIService {
  constructor() {
    // This will read from Vercel environment variables
    this.apiKey = process.env.REACT_APP_HUGGINGFACE_API_KEY;
    this.conversationHistory = [];
    this.userContext = {};
    console.log('AI Service initialized. API Key exists:', !!this.apiKey);
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
    // Crisis detection first
    if (this.isCrisis(message)) {
      return this.getCrisisResponse();
    }

    // If no API key, use fallback
    if (!this.apiKey) {
      console.warn('No Hugging Face API key found. Using fallback responses.');
      return {
        text: this.getFallbackResponse(message),
        sentiment: this.analyzeSentiment(message),
        needsHelp: false,
        isCrisis: false
      };
    }

    try {
      // Try Hugging Face API
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill',
        {
          inputs: message,
          parameters: {
            max_length: 100,
            temperature: 0.7,
            top_p: 0.9
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      let aiResponse = response.data[0]?.generated_text || '';
      
      if (!aiResponse || aiResponse.length < 5) {
        aiResponse = this.getFallbackResponse(message);
      }

      return {
        text: aiResponse,
        sentiment: this.analyzeSentiment(message),
        needsHelp: false,
        isCrisis: false
      };

    } catch (error) {
      console.error('Hugging Face API Error:', error.response?.status, error.response?.data || error.message);
      // Fallback to local responses
      return {
        text: this.getFallbackResponse(message),
        sentiment: this.analyzeSentiment(message),
        needsHelp: false,
        isCrisis: false
      };
    }
  }

  analyzeSentiment(text) {
    const positive = ['good', 'great', 'happy', 'joy', 'excited', 'grateful', 'wonderful', 'amazing'];
    const negative = ['sad', 'depressed', 'angry', 'anxious', 'stress', 'terrible', 'awful', 'hopeless'];
    
    const words = text.toLowerCase().split(' ');
    let posScore = words.filter(w => positive.includes(w)).length;
    let negScore = words.filter(w => negative.includes(w)).length;
    
    if (posScore > negScore) return 'positive';
    if (negScore > posScore) return 'negative';
    return 'neutral';
  }

  isCrisis(text) {
    const crisisWords = ['suicide', 'kill myself', 'want to die', 'harm myself', 'end it all', 'no hope'];
    return crisisWords.some(word => text.toLowerCase().includes(word));
  }

  getCrisisResponse() {
    return {
      text: `🚨 **I'm really concerned about what you're sharing**

Please reach out for immediate support:
• **988 Suicide & Crisis Lifeline**: Call or text 988
• **Crisis Text Line**: Text HOME to 741741
• **Emergency Services**: 911

You don't have to face this alone. 💙`,
      sentiment: 'crisis',
      needsHelp: true,
      isCrisis: true
    };
  }

  getFallbackResponse(message) {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
      return `Hello ${this.userContext.name || 'there'}! 👋 How are you feeling today? I'm here to listen.`;
    }

    if (lowerMsg.includes('how are you')) {
      return "I'm doing well, thank you for asking! 😊 How are YOU feeling today?";
    }

    if (lowerMsg.includes('thank')) {
      return "You're so welcome! 🤗 Is there anything else on your mind?";
    }

    const responses = [
      "I appreciate you sharing that with me. 🤗 Could you tell me more about what's going on?",
      "That sounds really important. 💭 How long have you been feeling this way?",
      "Thank you for trusting me. 💙 What support would be most helpful for you right now?",
      "I hear you. Your feelings are completely valid. 🌟 Would you like to explore this together?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
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