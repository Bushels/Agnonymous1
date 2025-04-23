// src/components/Chat/ChatMessage.js
import React from 'react';
import '../../styles/ChatMessage.css';

const ChatMessage = ({ message, isCurrentUser }) => {
  const { text, username, createdAt } = message;
  
  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`chat-message ${isCurrentUser ? 'current-user' : ''}`}>
      <div className="message-bubble">
        <div className="message-header">
          <span className="message-username">{username}</span>
          <span className="message-time">{formatTime(createdAt)}</span>
        </div>
        <div className="message-text">{text}</div>
      </div>
    </div>
  );
};

export default ChatMessage;
