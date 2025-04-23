// src/components/Home/TopicGrid.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import TopicTile from './TopicTile';
import '../../styles/TopicGrid.css';

const TopicGrid = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);
        const topicsQuery = query(collection(db, 'topics'), orderBy('title'));
        const querySnapshot = await getDocs(topicsQuery);
        
        const topicsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setTopics(topicsList);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching topics:', err);
        setError('Failed to load topics. Please try again later.');
        setLoading(false);
      }
    };

    fetchTopics();
  }, []);

  if (loading) {
    return <div className="loading">Loading topics...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (topics.length === 0) {
    return <div className="no-topics">No topics available yet. Check back soon!</div>;
  }

  return (
    <div className="topic-grid">
      {topics.map((topic) => (
        <TopicTile key={topic.id} topic={topic} />
      ))}
    </div>
  );
};

export default TopicGrid;
