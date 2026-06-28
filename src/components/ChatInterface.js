import React, { useState, useEffect, useRef } from 'react';
import mentalHealthAI from '../services/aiService';
import {
  doc,
  updateDoc,
  arrayUnion,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../services/firebase';

// Voice Recognition Hook (same pattern used elsewhere in the app)
const useVoiceRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      setIsListening(false);
      recognitionRef.current.stop();
    }
  };

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    hasRecognitionSupport: !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  };
};

const ChatInterface = ({ user, userData }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const messagesEndRef = useRef(null);

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    hasRecognitionSupport
  } = useVoiceRecognition();

  // Fill the input box as speech is recognized
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Subscribe to this user's conversations in Firestore, newest first.
  // Path: users/{uid}/conversations/{conversationId}
  useEffect(() => {
    if (!user) return;

    const conversationsRef = collection(db, 'users', user.uid, 'conversations');
    const q = query(conversationsRef, orderBy('updatedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setConversations(loaded);

      // On first load, open the most recent conversation if one exists
      if (!currentChatId && loaded.length > 0) {
        setCurrentChatId(loaded[0].id);
        setMessages(loaded[0].messages || []);
      }
    }, (error) => {
      console.error('Error loading conversations:', error);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set user context for AI
  useEffect(() => {
    if (userData) {
      mentalHealthAI.setUserContext(userData);
    }
  }, [userData]);

  const persistConversation = async (chatId, updatedMessages, title) => {
    if (!user) return;

    try {
      if (chatId) {
        await updateDoc(doc(db, 'users', user.uid, 'conversations', chatId), {
          messages: updatedMessages,
          title,
          updatedAt: serverTimestamp()
        });
        return chatId;
      } else {
        const newDoc = await addDoc(collection(db, 'users', user.uid, 'conversations'), {
          messages: updatedMessages,
          title,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setCurrentChatId(newDoc.id);
        return newDoc.id;
      }
    } catch (error) {
      console.error('Error saving conversation to Firestore:', error);
      return chatId;
    }
  };

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
    const sentText = input;
    setInput('');
    setLoading(true);

    try {
      const aiResponse = await mentalHealthAI.getResponse(sentText, updatedMessages);

      const botMessage = {
        id: Date.now() + 1,
        text: aiResponse.text,
        type: 'bot',
        sentiment: aiResponse.sentiment || 'neutral',
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);
      mentalHealthAI.storeConversation(sentText, aiResponse.text);

      // Save activity points to the user's profile doc
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          points: (userData?.points || 0) + 5,
          activities: arrayUnion({
            type: 'mental_wellness',
            points: 5,
            timestamp: new Date().toISOString(),
            message: sentText.substring(0, 200),
            aiResponse: aiResponse.text.substring(0, 200),
            sentiment: aiResponse.sentiment || 'neutral'
          })
        });
      }

      // Save/update this conversation in Firestore
      const chatTitle = finalMessages[0]?.text?.substring(0, 40) || 'New Chat';
      const savedId = await persistConversation(currentChatId, finalMessages, chatTitle);
      if (!currentChatId) setCurrentChatId(savedId);
    } catch (error) {
      console.error('Send message error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "I'm having trouble connecting right now. Please try again in a moment.",
          type: 'bot',
          timestamp: new Date().toISOString(),
          isError: true
        }
      ]);
    }

    setLoading(false);
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
  };

  const handleSelectChat = (chat) => {
    if (chat) {
      setCurrentChatId(chat.id);
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

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Group conversations by date for the sidebar
  const groupedConversations = conversations.reduce((groups, chat) => {
    const dateValue = chat.updatedAt?.toDate ? chat.updatedAt.toDate() : new Date();
    const date = dateValue.toLocaleDateString();
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
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  style={{
                    ...styles.chatItem,
                    ...(currentChatId === chat.id && styles.activeChat)
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
                        {chat.updatedAt?.toDate
                          ? chat.updatedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
          {conversations.length === 0 && (
            <div style={styles.noChatsYet}>No past conversations yet</div>
          )}
        </div>
        <div style={styles.sidebarFooter}>
          <div style={styles.userInfoRow}>
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
              placeholder="Type your message, or use the mic to speak..."
              style={styles.chatInput}
              rows="1"
              disabled={loading}
            />
            {hasRecognitionSupport && (
              <button
                onClick={toggleListening}
                title={isListening ? 'Stop listening' : 'Speak your message'}
                style={{
                  ...styles.micBtn,
                  ...(isListening ? styles.micBtnActive : {})
                }}
                disabled={loading}
              >
                {isListening ? '🛑' : '🎤'}
              </button>
            )}
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
          {isListening && (
            <div style={styles.listeningIndicator}>
              <span style={styles.pulsingDot}></span> Listening... speak now
            </div>
          )}
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
  noChatsYet: { padding: '16px 12px', color: '#999', fontSize: '13px' },
  sidebarFooter: { padding: '12px 16px', borderTop: '1px solid #e5e5e5' },
  userInfoRow: { display: 'flex', alignItems: 'center', gap: '8px' },
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
  micBtn: { background: '#6c757d', color: 'white', border: 'none', width: '50px', height: '50px', borderRadius: '12px', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 },
  micBtnActive: { background: '#dc3545' },
  sendBtn: { background: '#667eea', color: 'white', border: 'none', width: '50px', height: '50px', borderRadius: '12px', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 },
  sendBtnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  listeningIndicator: { display: 'flex', alignItems: 'center', gap: '8px', color: '#dc3545', fontSize: '13px', fontWeight: '600', marginTop: '8px', maxWidth: '900px', margin: '8px auto 0' },
  pulsingDot: { width: '8px', height: '8px', borderRadius: '50%', background: '#dc3545', display: 'inline-block' },
  disclaimer: { fontSize: '12px', color: '#999', textAlign: 'center', marginTop: '10px', maxWidth: '900px', margin: '10px auto 0' }
};

export default ChatInterface;