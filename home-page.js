// src/components/Home/HomePage.js
import React from 'react';
import TopicGrid from './TopicGrid';
import Chat from '../Chat/Chat';
import '../../styles/HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <div className="home-header">
        <h1>Welcome to Agnonymous</h1>
        <p>
          Submit anonymous tips about corruption in agriculture. 
          Your voice matters in creating a transparent industry.
        </p>
      </div>
      
      <section className="topics-section">
        <h2>Corruption Topics</h2>
        <p>Select a topic to view details or submit a tip</p>
        <TopicGrid />
      </section>
      
      <section className="chat-section">
        <h2>Agnonymous Chat</h2>
        <p>Discuss agriculture topics anonymously with others. Chat resets daily at midnight.</p>
        <Chat />
      </section>
    </div>
  );
};

export default HomePage;
