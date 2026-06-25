import React, { useState } from 'react';

const CommunityHub = () => {
  const [activeTab, setActiveTab] = useState('challenges');

  return (
    <div style={styles.communityContainer}>
      <div style={styles.communityHeader}>
        <h2>🌍 Wellness Community</h2>
        <p>Connect, compete, and grow together</p>
      </div>

      <div style={styles.tabNavigation}>
        <button 
          style={{...styles.tabButton, ...(activeTab === 'challenges' && styles.activeTab)}}
          onClick={() => setActiveTab('challenges')}
        >
          🏆 Challenges
        </button>
        <button 
          style={{...styles.tabButton, ...(activeTab === 'leaderboard' && styles.activeTab)}}
          onClick={() => setActiveTab('leaderboard')}
        >
          📊 Leaderboard
        </button>
        <button 
          style={{...styles.tabButton, ...(activeTab === 'groups' && styles.activeTab)}}
          onClick={() => setActiveTab('groups')}
        >
          👥 Support Groups
        </button>
      </div>

      <div style={styles.tabContent}>
        {activeTab === 'challenges' && (
          <div style={styles.challengesGrid}>
            <div style={styles.challengeCard}>
              <h3>7-Day Meditation Streak</h3>
              <p>👥 1,247 participants</p>
              <p>🎁 500 Points + Zen Master Badge</p>
              <div style={styles.progressBar}>
                <div style={{...styles.progressFill, width: '65%'}}></div>
              </div>
              <button style={styles.joinButton}>Join Challenge</button>
            </div>
            
            <div style={styles.challengeCard}>
              <h3>Brain Games Marathon</h3>
              <p>👥 892 participants</p>
              <p>🎁 300 Points + Brainiac Badge</p>
              <div style={styles.progressBar}>
                <div style={{...styles.progressFill, width: '30%'}}></div>
              </div>
              <button style={styles.joinButton}>Join Challenge</button>
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div style={styles.leaderboard}>
            <h3>🏆 Global Leaderboard</h3>
            {[
              { rank: 1, name: "Alex Chen", points: 12500, streak: 45 },
              { rank: 2, name: "Priya Sharma", points: 11800, streak: 38 },
              { rank: 3, name: "Mike Johnson", points: 11200, streak: 42 },
              { rank: 4, name: "You", points: 8900, streak: 25 }
            ].map(leader => (
              <div key={leader.rank} style={{
                ...styles.leaderItem,
                ...(leader.name === 'You' && styles.currentUser)
              }}>
                <span style={styles.rank}>#{leader.rank}</span>
                <span style={styles.name}>{leader.name}</span>
                <span style={styles.points}>{leader.points} pts</span>
                <span style={styles.streak}>🔥 {leader.streak} days</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'groups' && (
          <div style={styles.groupsGrid}>
            {[
              { name: "Anxiety Support", members: 234, active: true },
              { name: "Fitness Beginners", members: 567, active: true },
              { name: "Meditation Circle", members: 189, active: true },
              { name: "Student Wellness", members: 432, active: true }
            ].map(group => (
              <div key={group.name} style={styles.groupCard}>
                <h4>{group.name}</h4>
                <p>👥 {group.members} members</p>
                <p>{group.active ? "🟢 Active now" : "⚫ Offline"}</p>
                <button style={styles.joinButton}>Join Group</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  communityContainer: {
    background: 'white',
    borderRadius: '20px',
    padding: '30px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
  },
  communityHeader: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  tabNavigation: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  tabButton: {
    padding: '12px 20px',
    border: 'none',
    borderRadius: '25px',
    background: '#f8f9fa',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  activeTab: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white'
  },
  challengesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px'
  },
  challengeCard: {
    background: '#f8f9fa',
    padding: '20px',
    borderRadius: '15px',
    border: '2px solid #e9ecef',
    textAlign: 'center'
  },
  progressBar: {
    height: '8px',
    background: '#e9ecef',
    borderRadius: '4px',
    margin: '10px 0',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #48bb78, #38a169)',
    borderRadius: '4px'
  },
  joinButton: {
    background: '#667eea',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '20px',
    cursor: 'pointer',
    marginTop: '10px'
  },
  leaderboard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  leaderItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    background: '#f8f9fa',
    borderRadius: '10px'
  },
  currentUser: {
    background: '#e3f2fd',
    border: '2px solid #2196f3',
    fontWeight: 'bold'
  },
  groupsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px'
  },
  groupCard: {
    background: '#f8f9fa',
    padding: '20px',
    borderRadius: '15px',
    textAlign: 'center',
    border: '2px solid #e9ecef'
  }
};

export default CommunityHub;