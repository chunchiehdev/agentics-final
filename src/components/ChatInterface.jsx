import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import '../styles/Chat.css';

const SendIcon = () => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: '24px', height: '24px' }}
  >
    <path 
      d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" 
      fill="currentColor"
    />
  </svg>
);

const STORAGE_KEYS = {
  USER_ID: 'userId',
  MESSAGES: 'chatMessages'
};

const ChatInterface = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const newUserId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem(STORAGE_KEYS.USER_ID, newUserId);
      setUserId(newUserId);
    }

    const storedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !userId) return;

    const newMessage = {
      id: Date.now(),
      content: message,
      role: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:3001/api/chat', { 
        message: message.trim(),
        userId 
      });

      const botMessage = {
        id: Date.now() + 1,
        content: response.data.message,
        role: 'assistant',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, botMessage]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-container">
        {messages.length === 0 ? (
          <div className="welcome-container">
            <p className="welcome-text">How can I help you today?</p>
            <div className="welcome-tips">
              <p>Examples you can try:</p>
              <ul>
                <li>Help me with coding</li>
                <li>Explain a concept</li>
                <li>Write a story</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="messages-container">
            <div className="chat-header">
              <button onClick={clearHistory} className="clear-history-btn">
                Clear History
              </button>
            </div>
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`message-row ${msg.role}`}
              >
                <div className="message-avatar">
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className="message-content-wrapper">
                  <div className="message-content">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message-row assistant">
                <div className="message-avatar">🤖</div>
                <div className="message-content-wrapper">
                  <div className="message-content">
                    <div className="loading-indicator">
                      <span>.</span><span>.</span><span>.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="message-row error">
                <div className="message-content-wrapper">
                  <div className="message-content error">
                    {error}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <div className="input-container">
        <div className="input-wrapper">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="input-form">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              className="input-field"
              rows={1}
            />
            <button 
              type="submit" 
              disabled={isLoading || !message.trim() || !userId} 
              className="submit-button"
            >
              <SendIcon />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface; 