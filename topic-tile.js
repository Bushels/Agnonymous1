// src/components/Home/TopicTile.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../../firebase/config';
import '../../styles/TopicTile.css';

const TopicTile = ({ topic }) => {
  const [tipCount, setTipCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTipCount = async () => {
      try {
        // Count approved tips for this topic
        const tipsRef = collection(db, 'tips');
        const tipsQuery = query(
          tipsRef, 
          where('topicId', '==', topic.id),
          where('approved', '==', true)
        );
        
        const snapshot = await getCountFromServer(tipsQuery);
        setTipCount(snapshot.data().count);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching tip count:', err);
        setLoading(false);
      }
    };

    fetchTipCount();
  }, [topic.id]);

  return (
    <div className="topic-tile">
      <div className="topic-image">
        {topic.imageUrl ? (
          <img src={topic.imageUrl} alt={topic.title} />
        ) : (
          <div className="placeholder-image">
            <span>{topic.title.charAt(0)}</span>
          </div>
        )}
      </div>
      
      <div className="topic-content">
        <h3 className="topic-title">{topic.title}</h3>
        <p className="topic-description">{topic.description}</p>
        
        {topic.recentUpdates && (
          <div className="topic-updates">
            <h4>Recent Updates:</h4>
            <p>{topic.recentUpdates}</p>
          </div>
        )}
        
        <div className="topic-metadata">
          {topic.location && (
            <span className="topic-location">
              <i className="location-icon">📍</i> {topic.location}
            </span>
          )}
          
          {topic.companies && topic.companies.length > 0 && (
            <span className="topic-companies">
              <i className="company-icon">🏢</i> 
              {topic.companies.join(', ')}
            </span>
          )}
        </div>
        
        <div className="topic-stats">
          <span className="tip-count">
            <i className="tip-icon">💡</i> 
            {loading ? '...' : tipCount} tips
          </span>
        </div>
        
        <div className="topic-actions">
          <Link to={`/topic/${topic.id}`} className="view-topic-btn">
            View Details
          </Link>
          <Link to={`/topic/${topic.id}/submit-tip`} className="submit-tip-btn">
            Submit a Tip
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TopicTile;
