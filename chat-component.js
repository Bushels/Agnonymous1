// src/components/Chat/Chat.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import ChatMessage from './ChatMessage';
import '../../styles/Chat.css';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Generate a random username for anonymous chat if not set
  useEffect(() => {
    if (!username) {
      const randomNum = Math.floor(Math.random() * 10000);
      setUsername(`Anonymous${randomNum}`);
    }
  }, [username]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to messages
  useEffect(() => {
    const messagesRef = collection(db, 'chatMessages');
    const messagesQuery = query(
      messagesRef,
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messageList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messageList);
    }, (err) => {
      console.error('Error loading chat messages:', err);
      setError('Failed to load chat messages');
    });

    // Cleanup
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    try {
      await addDoc(collection(db, 'chatMessages'), {
        text: newMessage,
        username,
        createdAt: serverTimestamp()
      });
      
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {error && <div className="chat-error">{error}</div>}
        
        {messages.length === 0 ? (
          <div className="no-messages">
            No messages yet. Be the first to start the conversation!
          </div>
        ) : (
          messages.map(message => (
            <ChatMessage 
              key={message.id} 
              message={message}
              isCurrentUser={message.username === username}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="chat-input"
        />
        <button type="submit" className="chat-send-btn">
          Send
        </button>
      </form>
      
      <div className="chat-footer">
        <p>You are chatting as: {username}</p>
        <p className="chat-note">
          This chat resets daily at midnight to ensure privacy.
        </p>
      </div>
    </div>
  );
};

export default Chat;
