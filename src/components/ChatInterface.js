import React, { useState, useEffect, useRef } from 'react';
import mentalHealthAI from '../services/aiService';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../services/firebase';

const ChatInterface = ({ user, userData }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const messagesEndRef = useRef(null);

  // Load conversations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('chatHistory');
    if (saved) {
      const parsed = JSON.parse(saved);
      setConversations(parsed);
      if (parsed.length > 0) {
        setCurrentChat(parsed[0]);
        setMessages(parsed[0].messages || []);
      }
    }
  }, []);

  // Save conversations to localStorage
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(conversations));
    }
  }, [conversations]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set user context for AI
  useEffect(() => {
    if (userData) {
      mentalHealthAI.setUserContext(userData);
    }
  }, [userData]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      text: input,
      type: 'user',
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const aiResponse = await mentalHealthAI.getResponse(input, updatedMessages);
      
      const botMessage = {
        id: Date.now() + 1,
        text: aiResponse.text,
        type: 'bot',
        sentiment: aiResponse.sentiment || 'neutral',
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);
      mentalHealthAI.storeConversation(input, aiResponse.text);

      // Save to Firebase
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          points: (userData?.points || 0) + 5,
          activities: arrayUnion({
            type: 'mental_wellness',
            points: 5,
            timestamp: new Date().toISOString(),
            message: input.substring(0, 200),
            aiResponse: aiResponse.text.substring(0, 200),
            sentiment: aiResponse.sentiment || 'neutral'
          })
        });
      }

      // Update conversation history
      const chatTitle = finalMessages[0]?.text?.substring(0, 40) || 'New Chat';
      if (currentChat) {
        const updatedChats = conversations.map(chat => 
          chat.id === currentChat.id 
            ? { ...chat, messages: finalMessages, title: chatTitle, timestamp: new Date().toISOString() }
            : chat
        );
        setConversations(updatedChats);
        setCurrentChat({ ...currentChat, messages: finalMessages, title: chatTitle });
      } else {
        const newChat = {
          id: Date.now(),
          title: chatTitle,
          messages: finalMessages,
          timestamp: new Date().toISOString(),
          userName: userData?.fullName || 'Guest'
        };
        setConversations([newChat, ...conversations]);
        setCurrentChat(newChat);
      }

    } catch (error) {
      console.error('Send message error:', error);
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: "I'm having trouble connecting right now. Please try again in a moment.",
        type: 'bot',
        timestamp: new Date().toISOString(),
        isError: true
      }]);
    }

    setLoading(false);
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentChat(null);
  };

  const handleSelectChat = (chat) => {
    if (chat) {
      setCurrentChat(chat);
      setMessages(chat.messages || []);
    } else {
      handleNewChat();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group conversations by date
  const groupedConversations = conversations.reduce((groups, chat) => {
    const date = new Date(chat.timestamp).toLocaleDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(chat);
    return groups;
  }, {});

  return (
    <div style={styles.container}>
      {/* Left Sidebar - Chat History */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>💬 Chats</h2>
          <button style={styles.newChatBtn} onClick={handleNewChat}>+ New Chat</button>
        </div>
        <div style={styles.chatList}>
          {Object.entries(groupedConversations).map(([date, chats]) => (
            <div key={date}>
              <div style={styles.dateHeader}>{date}</div>
              {chats.map(chat => (
                <div
                  key={chat.id}
                  style={{
                    ...styles.chatItem,
                    ...(currentChat?.id === chat.id && styles.activeChat)
                  }}
                  onClick={() => handleSelectChat(chat)}
                >
                  <div style={styles.chatPreview}>
                    <span style={styles.chatIcon}>💬</span>
                    <div style={styles.chatInfo}>
                      <div style={styles.chatName}>
                        {chat.title || chat.messages?.[0]?.text?.substring(0, 30) || 'New Chat'}
                      </div>
                      <div style={styles.chatTime}>
                        {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={styles.sidebarFooter}>
          <div style={styles.userInfo}>
            <span style={styles.userAvatar}>👤</span>
            <span style={styles.userName}>{userData?.fullName || 'Guest'}</span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={styles.chatArea}>
        <div style={styles.chatHeader}>
          <span style={styles.chatHeaderTitle}>Mental Wellness Assistant</span>
          <span style={styles.chatHeaderStatus}>● Online</span>
        </div>

        <div style={styles.messagesContainer}>
          {messages.length === 0 ? (
            <div style={styles.welcome}>
              <h2>👋 Welcome to Aarohan</h2>
              <p>I'm your mental wellness assistant. How are you feeling today?</p>
              <div style={styles.suggestions}>
                <button onClick={() => setInput("I'm feeling anxious today")}>😰 Feeling anxious</button>
                <button onClick={() => setInput("I'm having a good day")}>😊 Having a good day</button>
                <button onClick={() => setInput("I'm feeling stressed")}>😫 Feeling stressed</button>
                <button onClick={() => setInput("I need someone to talk to")}>💬 Need to talk</button>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} style={{
                ...styles.messageContainer,
                ...(msg.type === 'user' ? styles.userContainer : styles.botContainer)
              }}>
                <div style={styles.avatar}>{msg.type === 'user' ? '👤' : '🤖'}</div>
                <div style={{
                  ...styles.messageBubble,
                  ...(msg.type === 'user' ? styles.userBubble : styles.botBubble)
                }}>
                  <div style={styles.messageText}>{msg.text}</div>
                  <div style={styles.messageTime}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div style={styles.typing}>
              <span>🤖</span>
              <div style={styles.typingDots}><span>.</span><span>.</span><span>.</span></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={styles.inputArea}>
          <div style={styles.inputContainer}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              style={styles.chatInput}
              rows="1"
              disabled={loading}
            />
            <button 
              onClick={handleSend}
              style={{
                ...styles.sendBtn,
                ...(loading || !input.trim() ? styles.sendBtnDisabled : {})
              }}
              disabled={loading || !input.trim()}
            >
              {loading ? '⌛' : '➤'}
            </button>
          </div>
          <div style={styles.disclaimer}>
            This AI provides emotional support but is not a substitute for professional mental healthcare.
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    height: '70vh',
    background: '#f5f5f5',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
  },
  sidebar: {
    width: '280px',
    background: '#f7f7f8',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #e5e5e5',
    flexShrink: 0
  },
  sidebarHeader: {
    padding: '16px',
    borderBottom: '1px solid #e5e5e5',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sidebarTitle: { fontSize: '18px', fontWeight: '600', margin: 0, color: '#333' },
  newChatBtn: {
    background: '#667eea',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500'
  },
  chatList: { flex: 1, overflowY: 'auto', padding: '8px' },
  dateHeader: { fontSize: '12px', color: '#999', padding: '8px 12px', fontWeight: '500' },
  chatItem: { padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '2px' },
  activeChat: { background: '#e8e8e8' },
  chatPreview: { display: 'flex', alignItems: 'center', gap: '10px' },
  chatIcon: { fontSize: '16px' },
  chatInfo: { flex: 1, overflow: 'hidden' },
  chatName: { fontSize: '14px', fontWeight: '500', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  chatTime: { fontSize: '12px', color: '#999' },
  sidebarFooter: { padding: '12px 16px', borderTop: '1px solid #e5e5e5' },
  userAvatar: { fontSize: '24px' },
  userName: { fontSize: '14px', fontWeight: '500', color: '#333' },
  chatArea: { flex: 1, display: 'flex', flexDirection: 'column', background: '#ffffff' },
  chatHeader: { padding: '16px 24px', borderBottom: '1px solid #e5e5e5', background: 'white', display: 'flex', alignItems: 'center', gap: '12px' },
  chatHeaderTitle: { fontSize: '18px', fontWeight: '600', color: '#333' },
  chatHeaderStatus: { fontSize: '13px', color: '#10b981', fontWeight: '500' },
  messagesContainer: { flex: 1, overflowY: 'auto', padding: '20px 0', background: '#f9fafb' },
  messageContainer: { display: 'flex', gap: '12px', padding: '16px 20px', maxWidth: '900px', margin: '0 auto', width: '100%' },
  userContainer: { flexDirection: 'row-reverse' },
  botContainer: { flexDirection: 'row' },
  avatar: { width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, background: '#f0f0f0' },
  messageBubble: { padding: '12px 16px', borderRadius: '12px', maxWidth: '80%', wordWrap: 'break-word' },
  userBubble: { background: '#667eea', color: 'white', borderBottomRightRadius: '4px' },
  botBubble: { background: 'white', color: '#333', borderBottomLeftRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  messageText: { fontSize: '15px', lineHeight: '1.6' },
  messageTime: { fontSize: '11px', opacity: 0.6, marginTop: '4px', textAlign: 'right' },
  welcome: { textAlign: 'center', padding: '60px 20px', maxWidth: '600px', margin: '0 auto' },
  suggestions: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px', justifyContent: 'center' },
  typing: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', maxWidth: '900px', margin: '0 auto', width: '100%' },
  typingDots: { display: 'flex', gap: '4px', fontSize: '20px' },
  inputArea: { padding: '16px 24px', borderTop: '1px solid #e5e5e5', background: 'white' },
  inputContainer: { display: 'flex', gap: '12px', alignItems: 'flex-end', maxWidth: '900px', margin: '0 auto', width: '100%' },
  chatInput: { flex: 1, padding: '12px 16px', border: '2px solid #e5e5e5', borderRadius: '12px', fontSize: '15px', resize: 'none', minHeight: '50px', maxHeight: '150px', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s' },
  sendBtn: { background: '#667eea', color: 'white', border: 'none', width: '50px', height: '50px', borderRadius: '12px', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 },
  sendBtnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  disclaimer: { fontSize: '12px', color: '#999', textAlign: 'center', marginTop: '10px', maxWidth: '900px', margin: '10px auto 0' }
};

export default ChatInterface;