// src/services/aiService.js
import axios from 'axios';

class MentalHealthAIService {
  constructor() {
    this.huggingfaceKey = process.env.REACT_APP_HUGGINGFACE_API_KEY;
    this.openaiKey = process.env.REACT_APP_OPENAI_API_KEY;
    this.conversationHistory = [];
    this.userContext = {};
    this.models = [
      'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
      'https://api-inference.huggingface.co/models/google/flan-t5-base'
    ];
    console.log('AI Service initialized. Hugging Face Key exists:', !!this.huggingfaceKey);
    console.log('OpenAI Key exists:', !!this.openaiKey);
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

    // Try OpenAI first (most reliable)
    if (this.openaiKey) {
      try {
        return await this.getOpenAIResponse(message, chatHistory);
      } catch (error) {
        console.warn('OpenAI failed, trying Hugging Face:', error.message);
      }
    }

    // Try Hugging Face as fallback
    if (this.huggingfaceKey) {
      try {
        return await this.getHuggingFaceResponse(message, chatHistory);
      } catch (error) {
        console.warn('Hugging Face failed:', error.message);
      }
    }

    // Ultimate fallback
    return this.getTherapeuticFallback(message);
  }

  // OpenAI Implementation (Most Reliable)
  async getOpenAIResponse(message, chatHistory) {
    const systemPrompt = `You are a compassionate, licensed therapist. Your role is to provide empathetic, non-judgmental support.

Guidelines:
- Listen actively and validate feelings
- Ask open-ended questions to encourage reflection
- Use therapeutic techniques like CBT and mindfulness
- Never give medical advice or diagnose
- Create a safe, supportive space
- Keep responses warm, concise (100-150 words)

Client: ${this.userContext.name || 'Client'}`;

    const recentHistory = chatHistory.slice(-5).map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...recentHistory,
          { role: 'user', content: message }
        ],
        max_tokens: 200,
        temperature: 0.7,
        presence_penalty: 0.3,
        frequency_penalty: 0.5
      },
      {
        headers: {
          'Authorization': `Bearer ${this.openaiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    
    return {
      text: aiResponse,
      sentiment: this.analyzeSentiment(message),
      needsHelp: false,
      isCrisis: false
    };
  }

  // Hugging Face Implementation (Free Fallback)
  async getHuggingFaceResponse(message, chatHistory) {
    const prompt = this.buildTherapyPrompt(message, chatHistory);

    // Try multiple models
    for (const model of this.models) {
      try {
        const response = await axios.post(
          model,
          {
            inputs: prompt,
            parameters: {
              max_new_tokens: 150,
              temperature: 0.7,
              top_p: 0.9,
              do_sample: true,
              return_full_text: false
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${this.huggingfaceKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        let aiResponse = response.data[0]?.generated_text || '';
        aiResponse = aiResponse.replace(/Therapist:/g, '').trim();
        
        if (aiResponse && aiResponse.length > 5) {
          return {
            text: aiResponse,
            sentiment: this.analyzeSentiment(message),
            needsHelp: false,
            isCrisis: false
          };
        }
      } catch (error) {
        console.warn(`Model ${model} failed:`, error.message);
        continue;
      }
    }
    
    throw new Error('All Hugging Face models failed');
  }

  buildTherapyPrompt(message, chatHistory) {
    const recentHistory = chatHistory.slice(-5).map(msg => 
      `${msg.type === 'user' ? 'Client' : 'Therapist'}: ${msg.text}`
    ).join('\n');

    return `You are a compassionate therapist. Provide empathetic, non-judgmental support.

Client context:
- Name: ${this.userContext.name || 'Client'}
- Background: ${this.userContext.fitnessGoal || 'General wellness'}

Client's message: "${message}"

${recentHistory ? `\nRecent conversation:\n${recentHistory}\n` : ''}

Therapist's response (warm, empathetic):`;
  }

  getTherapeuticFallback(message) {
    // Check for specific emotions for more tailored responses
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