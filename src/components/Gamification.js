import React, { useState, useEffect } from 'react';

const Gamification = ({ userActivity }) => {
  const [userStats, setUserStats] = useState({
    streak: 0,
    points: 0,
    level: 1,
    achievements: [],
    badges: []
  });

  const achievements = {
    first_chat: { name: "First Conversation", points: 50 },
    week_streak: { name: "7-Day Streak", points: 100 },
    fitness_goal: { name: "Fitness Goal Met", points: 75 },
    mood_tracker: { name: "Mood Tracking Pro", points: 60 }
  };

  useEffect(() => {
    // Check for achievements based on user activity
    checkAchievements();
  }, [userActivity]);

  const checkAchievements = () => {
    const newAchievements = [];
    
    if (userActivity.chatCount >= 1 && !userStats.achievements.includes('first_chat')) {
      newAchievements.push('first_chat');
    }
    
    if (userActivity.streak >= 7 && !userStats.achievements.includes('week_streak')) {
      newAchievements.push('week_streak');
    }

    newAchievements.forEach(achievement => {
      awardAchievement(achievement);
    });
  };

  const awardAchievement = (achievementKey) => {
    const achievement = achievements[achievementKey];
    setUserStats(prev => ({
      ...prev,
      achievements: [...prev.achievements, achievementKey],
      points: prev.points + achievement.points,
      level: Math.floor((prev.points + achievement.points) / 100) + 1
    }));
  };

  return (
    <div style={styles.gamificationPanel}>
      <h3>🏆 Your Progress</h3>
      
      <div style={styles.statsGrid}>
        <div style={styles.statItem}>
          <div style={styles.statNumber}>{userStats.streak}</div>
          <div style={styles.statLabel}>Day Streak</div>
        </div>
        
        <div style={styles.statItem}>
          <div style={styles.statNumber}>{userStats.points}</div>
          <div style={styles.statLabel}>Points</div>
        </div>
        
        <div style={styles.statItem}>
          <div style={styles.statNumber}>Level {userStats.level}</div>
          <div style={styles.statLabel}>Level</div>
        </div>
      </div>

      <div style={styles.achievements}>
        <h4>🎯 Achievements</h4>
        {userStats.achievements.map(achievementKey => (
          <div key={achievementKey} style={styles.achievementBadge}>
            ✅ {achievements[achievementKey].name}
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  gamificationPanel: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '20px',
    borderRadius: '15px',
    marginBottom: '20px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '15px',
    marginBottom: '20px'
  },
  statItem: {
    textAlign: 'center',
    background: 'rgba(255,255,255,0.2)',
    padding: '15px',
    borderRadius: '10px'
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: 'bold'
  },
  statLabel: {
    fontSize: '12px',
    opacity: 0.8
  },
  achievements: {
    textAlign: 'center'
  },
  achievementBadge: {
    display: 'inline-block',
    background: 'rgba(255,255,255,0.2)',
    padding: '8px 15px',
    borderRadius: '20px',
    margin: '5px',
    fontSize: '14px'
  }
};

export default Gamification;