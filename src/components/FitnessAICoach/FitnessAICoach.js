import React, { useState } from 'react';
import { getFitnessResponse, getExerciseRecommendation, getMeditationGuide } from '../../services/fitnessRecommendations';

const FitnessAICoach = () => {
  const [conversation, setConversation] = useState([]);
  const [userGoal, setUserGoal] = useState('');
  const [fitnessLevel, setFitnessLevel] = useState('beginner');

  const handleFitnessMessage = async (message) => {
    const newConversation = [...conversation, { type: 'user', text: message }];
    
    const aiResponse = await getFitnessResponse(message, userGoal, fitnessLevel);
    
    setConversation([
      ...newConversation,
      { type: 'ai', text: aiResponse, isFitness: true }
    ]);
  };

  const quickActions = [
    { label: 'Exercise Plan', action: () => handleFitnessMessage('I need an exercise plan') },
    { label: 'Nutrition Tips', action: () => handleFitnessMessage('Give me nutrition advice') },
    { label: 'Meditation', action: () => handleFitnessMessage('I need meditation guidance') },
    { label: 'Motivation', action: () => handleFitnessMessage('I need motivation') }
  ];

  return (
    <div className="fitness-ai-coach">
      <h2>Fitness AI Coach</h2>
      <div className="setup-section">
        <select onChange={(e) => setFitnessLevel(e.target.value)} value={fitnessLevel}>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <input 
          type="text"
          placeholder="Your fitness goal..."
          value={userGoal}
          onChange={(e) => setUserGoal(e.target.value)}
        />
      </div>
      
      <div className="quick-actions">
        {quickActions.map(action => (
          <button key={action.label} onClick={action.action}>
            {action.label}
          </button>
        ))}
      </div>

      <div className="chat-interface">
        {conversation.map((msg, index) => (
          <div key={index} className={`message ${msg.type}`}>
            {msg.text}
          </div>
        ))}
        <input
          type="text"
          placeholder="Ask your fitness coach..."
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleFitnessMessage(e.target.value);
              e.target.value = '';
            }
          }}
        />
      </div>
    </div>
  );
};

export default FitnessAICoach;