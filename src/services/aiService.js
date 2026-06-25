import axios from 'axios';

// Real Mental Health AI Service
class MentalHealthAIService {
  constructor() {
    // Using Hugging Face Inference API with MentalHealth-16K model
    // This model is fine-tuned specifically for empathetic mental health conversations [citation:1]
    this.apiKey = process.env.REACT_APP_HUGGINGFACE_API_KEY;
    this.model = 'khazarai/MentalChat-16K'; // Specialized mental health model [citation:1]
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

  // Get response from Hugging Face API
  async getResponse(message, chatHistory = []) {
    // Crisis detection first - always prioritize safety
    if (this.isCrisis(message)) {
      return this.getCrisisResponse();
    }

    try {
      // Build conversation context for the AI
      const systemPrompt = `You are a compassionate mental health assistant. 
Provide empathetic, supportive responses. Never give medical advice.
User: ${this.userContext.name}
Context: Points: ${this.userContext.points}, Streak: ${this.userContext.streak} days`;

      // Get recent conversation for context
      const recentHistory = chatHistory.slice(-5).map(msg => 
        `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.text}`
      ).join('\n');

      const fullPrompt = `${systemPrompt}\n\nRecent conversation:\n${recentHistory}\n\nUser: ${message}\nAssistant:`;

      // Call Hugging Face API with MentalHealth-16K model [citation:1]
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/khazarai/MentalChat-16K',
        {
          inputs: fullPrompt,
          parameters: {
            max_new_tokens: 150,
            temperature: 0.7,
            top_p: 0.8,
            top_k: 20,
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
      aiResponse = aiResponse.replace('Assistant:', '').trim();
      
      if (!aiResponse || aiResponse.length < 5) {
        aiResponse = this.getFallbackResponse(message);
      }

      // Analyze sentiment using a simpler method
      const sentiment = this.analyzeSentiment(message);

      return {
        text: aiResponse,
        sentiment: sentiment,
        needsHelp: false,
        source: 'mentalchat-16k'
      };

    } catch (error) {
      console.error('AI Service Error:', error);
      
      // Fallback to GPT-2 model if primary fails [citation:4]
      try {
        return await this.getGPT2Fallback(message);
      } catch {
        return {
          text: this.getFallbackResponse(message),
          sentiment: 'neutral',
          needsHelp: false,
          source: 'fallback'
        };
      }
    }
  }

  // Fallback using GPT-2 mental health model [citation:4]
  async getGPT2Fallback(message) {
    try {
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/Pranilllllll/finetuned_gpt2_45krows_10epochs',
        {
          inputs: `User: ${message}\nTherapist:`,
          parameters: {
            max_new_tokens: 100,
            temperature: 0.9,
            top_p: 0.95,
            do_sample: true
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
      aiResponse = aiResponse.replace('Therapist:', '').trim();
      
      return {
        text: aiResponse || this.getFallbackResponse(message),
        sentiment: this.analyzeSentiment(message),
        needsHelp: false,
        source: 'gpt2-mental'
      };
    } catch (error) {
      console.error('GPT-2 Fallback Error:', error);
      return null;
    }
  }

  // Simple sentiment analysis
  analyzeSentiment(text) {
    const positive = ['good', 'great', 'happy', 'joy', 'excited', 'grateful', 'wonderful', 'amazing', 'blessed'];
    const negative = ['sad', 'depressed', 'angry', 'anxious', 'stress', 'terrible', 'awful', 'hopeless', 'worthless'];
    
    const words = text.toLowerCase().split(' ');
    let posScore = words.filter(w => positive.includes(w)).length;
    let negScore = words.filter(w => negative.includes(w)).length;
    
    if (posScore > negScore) return 'positive';
    if (negScore > posScore) return 'negative';
    return 'neutral';
  }

  // Crisis detection
  isCrisis(text) {
    const crisisWords = ['suicide', 'kill myself', 'want to die', 'harm myself', 'end it all', 'no hope', 'give up'];
    return crisisWords.some(word => text.toLowerCase().includes(word));
  }

  // Crisis response - always show resources
  getCrisisResponse() {
    return {
      text: `🚨 **I'm really concerned about what you're sharing**

I hear that you're in tremendous pain right now. Please reach out for immediate support:

**Crisis Resources:**
• **988 Suicide & Crisis Lifeline**: Call or text 988
• **Crisis Text Line**: Text HOME to 741741
• **Emergency Services**: 911

You don't have to face this alone. These services are available 24/7 with trained professionals.

Would you like me to stay here with you while you reach out for help? 💙`,
      sentiment: 'crisis',
      needsHelp: true,
      isCrisis: true,
      source: 'crisis'
    };
  }

  // Fallback responses
  getFallbackResponse(message) {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
      return `Hello ${this.userContext.name || 'there'}! 👋 How are you feeling today? I'm here to listen.`;
    }

    if (lowerMsg.includes('how are you')) {
      return "I'm doing well, thank you for asking! 😊 But more importantly, how are YOU feeling today? I'm here to support you.";
    }

    if (lowerMsg.includes('thank')) {
      return "You're so welcome! 🤗 It means a lot that you're reaching out. Is there anything else on your mind?";
    }

    const responses = [
      "I appreciate you sharing that with me. 🤗 Could you tell me more about what's going on? I'm here to listen.",
      "That sounds really important. 💭 How long have you been feeling this way?",
      "Thank you for trusting me. 💙 What support would be most helpful for you right now?",
      "I hear you. Your feelings are completely valid. 🌟 Would you like to explore this together?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Store conversation for context
  storeConversation(userMessage, aiResponse) {
    this.conversationHistory.push({
      user: userMessage,
      bot: aiResponse,
      timestamp: new Date().toISOString()
    });
    // Keep only last 50 messages
    if (this.conversationHistory.length > 50) {
      this.conversationHistory = this.conversationHistory.slice(-50);
    }
  }
}

export const mentalHealthAI = new MentalHealthAIService();
export default mentalHealthAI;