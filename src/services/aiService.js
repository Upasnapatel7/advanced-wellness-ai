// src/services/aiService.js
import axios from 'axios';

class MentalHealthAIService {
  constructor() {
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

    if (!this.apiKey) {
      console.warn('No Hugging Face API key found.');
      return this.getTherapeuticFallback(message);
    }

    try {
      // 🔥 USING LLAMA-3-8B - The best free therapist model
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct',
        {
          inputs: this.buildTherapyPrompt(message, chatHistory),
          parameters: {
            max_new_tokens: 250,
            temperature: 0.7,
            top_p: 0.9,
            do_sample: true,
            return_full_text: false
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
      
      // Clean up the response
      aiResponse = aiResponse.replace(/Therapist:/g, '').trim();
      
      if (!aiResponse || aiResponse.length < 5) {
        return this.getTherapeuticFallback(message);
      }

      return {
        text: aiResponse,
        sentiment: this.analyzeSentiment(message),
        needsHelp: false,
        isCrisis: false
      };

    } catch (error) {
      console.error('Llama API Error:', error.response?.status, error.response?.data || error.message);
      
      // If Llama fails, try Mistral as fallback
      try {
        return await this.getMistralResponse(message);
      } catch {
        return this.getTherapeuticFallback(message);
      }
    }
  }

  // 🔥 Build therapy-style prompt
  buildTherapyPrompt(message, chatHistory) {
    const recentHistory = chatHistory.slice(-5).map(msg => 
      `${msg.type === 'user' ? 'Client' : 'Therapist'}: ${msg.text}`
    ).join('\n');

    return `You are a compassionate, licensed therapist. Your role is to provide empathetic, non-judgmental support.

Your approach:
- Listen actively and validate feelings
- Ask open-ended questions to encourage reflection
- Use therapeutic techniques like CBT, ACT, and mindfulness
- Never give medical advice or diagnose
- Create a safe, supportive space

Client context:
- Name: ${this.userContext.name || 'Client'}
- Background: ${this.userContext.fitnessGoal || 'General wellness'}

Client's message: "${message}"

${recentHistory ? `\nRecent conversation:\n${recentHistory}\n` : ''}

Therapist's response (warm, empathetic, therapeutic):`;
  }

  // 🔥 Mistral as fallback (also free)
  async getMistralResponse(message) {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3',
      {
        inputs: `[INST] You are a compassionate therapist. Respond with warmth and empathy to this client: ${message} [/INST]`,
        parameters: {
          max_new_tokens: 200,
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
    aiResponse = aiResponse.replace(/\[INST\].*\[\/INST\]/, '').trim();
    
    return {
      text: aiResponse || this.getTherapeuticFallback(message),
      sentiment: this.analyzeSentiment(message),
      needsHelp: false,
      isCrisis: false
    };
  }

  // 🔥 Therapeutic fallback (only if ALL APIs fail)
  getTherapeuticFallback(message) {
    const responses = [
      "I hear you, and I want you to know that your feelings are completely valid. Can you tell me more about what's been on your mind lately?",
      "That sounds really difficult. I'm here with you. What would feel most supportive for you right now?",
      "Thank you for sharing this with me. It takes courage to open up. How long have you been feeling this way?",
      "I'm sitting with you in this moment. Your feelings matter. What do you think you need right now?",
      "I appreciate your honesty. Let's explore this together - what brought these feelings up for you?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  analyzeSentiment(text) {
    const words = text.toLowerCase().split(' ');
    const emotions = {
      anxiety: ['anxious', 'worry', 'nervous', 'panic', 'overwhelm', 'scared', 'fear', 'racing'],
      depression: ['sad', 'depressed', 'hopeless', 'empty', 'numb', 'tired', 'exhausted', 'worthless'],
      loneliness: ['lonely', 'alone', 'isolated', 'disconnected', 'unseen', 'unheard'],
      anger: ['angry', 'frustrated', 'mad', 'irritated', 'furious', 'rage', 'resentful'],
      grief: ['grief', 'loss', 'miss', 'passed away', 'died', 'mourning', 'heartbroken'],
      shame: ['ashamed', 'embarrassed', 'humiliated', 'worthless', 'failure', 'stupid', 'should have']
    };
    
    let detected = 'neutral';
    let maxScore = 0;
    
    Object.entries(emotions).forEach(([emotion, keywords]) => {
      const score = keywords.filter(k => words.includes(k)).length;
      if (score > maxScore) {
        maxScore = score;
        detected = emotion;
      }
    });
    
    return detected;
  }

  isCrisis(text) {
    const crisisWords = ['suicide', 'kill myself', 'want to die', 'harm myself', 'end it all', 'no hope', 'give up'];
    return crisisWords.some(word => text.toLowerCase().includes(word));
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