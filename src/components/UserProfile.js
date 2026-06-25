import React, { useState } from 'react';

const UserProfile = ({ userProfile, setUserProfile }) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div style={styles.profileSection}>
      <h3>👤 Your Profile</h3>
      
      {!isEditing ? (
        <div style={styles.profileDisplay}>
          <p><strong>Name:</strong> {userProfile.name || 'Not set'}</p>
          <p><strong>Fitness Level:</strong> {userProfile.fitnessLevel}</p>
          <p><strong>Goals:</strong> {userProfile.goals?.join(', ') || 'Not set'}</p>
          <button onClick={() => setIsEditing(true)}>Edit Profile</button>
        </div>
      ) : (
        <div style={styles.profileForm}>
          <input
            type="text"
            placeholder="Your Name"
            value={userProfile.name}
            onChange={(e) => setUserProfile(prev => ({...prev, name: e.target.value}))}
            style={styles.input}
          />
          
          <select 
            value={userProfile.fitnessLevel}
            onChange={(e) => setUserProfile(prev => ({...prev, fitnessLevel: e.target.value}))}
            style={styles.input}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          
          <div>
            <label>Goals:</label>
            {['Weight Loss', 'Muscle Gain', 'Stress Reduction', 'Better Sleep'].map(goal => (
              <label key={goal} style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={userProfile.goals?.includes(goal)}
                  onChange={(e) => {
                    const newGoals = e.target.checked
                      ? [...(userProfile.goals || []), goal]
                      : (userProfile.goals || []).filter(g => g !== goal);
                    setUserProfile(prev => ({...prev, goals: newGoals}));
                  }}
                />
                {goal}
              </label>
            ))}
          </div>
          
          <button onClick={() => setIsEditing(false)}>Save Profile</button>
        </div>
      )}
    </div>
  );
};

const styles = {
  profileSection: {
    background: '#f8f9fa',
    padding: '20px',
    borderRadius: '10px',
    marginBottom: '20px'
  },
  input: {
    width: '100%',
    padding: '10px',
    margin: '5px 0',
    border: '1px solid #ddd',
    borderRadius: '5px'
  },
  checkboxLabel: {
    display: 'block',
    margin: '5px 0'
  }
};

export default UserProfile;