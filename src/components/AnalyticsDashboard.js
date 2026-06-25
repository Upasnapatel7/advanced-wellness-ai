import React from 'react';

const AnalyticsDashboard = ({ userActivity, mentalChatHistory }) => {
  const calculateMoodTrend = () => {
    const recentMessages = mentalChatHistory.slice(-10);
    const positiveWords = ['happy', 'good', 'great', 'excited', 'joy', 'love'];
    
    let positiveScore = 0;
    recentMessages.forEach(msg => {
      if (msg.type === 'user') {
        positiveWords.forEach(word => {
          if (msg.text.toLowerCase().includes(word)) positiveScore++;
        });
      }
    });
    
    return positiveScore > 3 ? 'Improving' : positiveScore > 1 ? 'Stable' : 'Needs Attention';
  };

  return (
    <div style={styles.analyticsDashboard}>
      <h3>📈 Your Wellness Analytics</h3>
      
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <h4>Mood Trend</h4>
          <div style={styles.metricValue}>{calculateMoodTrend()}</div>
        </div>
        
        <div style={styles.metricCard}>
          <h4>Consistency</h4>
          <div style={styles.metricValue}>{userActivity.streak} days</div>
        </div>
        
        <div style={styles.metricCard}>
          <h4>Engagement</h4>
          <div style={styles.metricValue}>{userActivity.chatCount} chats</div>
        </div>
        
        <div style={styles.metricCard}>
          <h4>Wellness Score</h4>
          <div style={styles.metricValue}>
            {Math.min(100, userActivity.chatCount * 10 + userActivity.streak * 5)}/100
          </div>
        </div>
      </div>
      
      <div style={styles.recommendations}>
        <h4>AI Recommendations</h4>
        {calculateMoodTrend() === 'Needs Attention' && (
          <p>💡 Try our 5-minute meditation exercise to boost your mood</p>
        )}
        {userActivity.streak < 3 && (
          <p>🎯 Build consistency! Chat daily to maintain your wellness streak</p>
        )}
      </div>
    </div>
  );
};