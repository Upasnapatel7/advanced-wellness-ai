import React, { useState, useEffect } from 'react';
import EmotionAnalysis from './EmotionAnalysis';
import ChatInterface from './ChatInterface';
import { analyzeSentiment, getWellnessResponse } from '../../services/emotionAnalysis';

const MentalWellnessAI = () => {
  const [conversation, setConversation] = useState([]);
  const [currentEmotion, setCurrentEmotion] = useState('');
  const [userInput, setUserInput] = useState('');

  const handleUserMessage = async (message) => {
    const newConversation = [...conversation, { type: 'user', text: message }];
    
    // Analyze sentiment
    const sentiment = await analyzeSentiment(message);
    setCurrentEmotion(sentiment.emotion);
    
    // Get AI response based on emotion
    const aiResponse = getWellnessResponse(message, sentiment.emotion, sentiment.intensity);
    
    setConversation([
      ...newConversation,
      { type: 'ai', text: aiResponse, emotion: sentiment.emotion }
    ]);
  };

  return (
    <div className="mental-wellness-ai">
      <h2>Mental Wellness Assistant</h2>
      <div className="ai-container">
        <EmotionAnalysis currentEmotion={currentEmotion} />
        <ChatInterface 
          conversation={conversation}
          onSendMessage={handleUserMessage}
          currentEmotion={currentEmotion}
        />
      </div>
    </div>
  );
};

export default MentalWellnessAI;