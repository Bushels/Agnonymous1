// src/components/Tips/TopicDashboard.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import TipItem from './TipItem';
import '../../styles/TopicDashboard.css';

const TopicDashboard = () => {
  const { topicId } = useParams();
  const [topic, setTopic] = useState(null);
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopicAndTips = async () => {
      try {
        setLoading(true);
        
        // Fetch topic details
        const topicRef = doc(db, 'topics', topicId);
        const topicSnap = await getDoc(topicRef);
        
        if (!topicSnap.exists()) {
          setError('Topic not found');
          setLoading(false);
          return;
        }
        
        setTopic({
          id: topicSnap.id,
          ...topicSnap.data()
        });
        
        // Fetch approved tips for this topic
        const tipsQuery = query(
          collection(db, 'tips'),
          where('topicId', '==', topicId),
          where('approved', '==', true),
          orderBy('createdAt', 'desc')
        );
        
        const tipsSnap = await getDocs(tipsQuery);
        const tipsList = tipsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setTips(tipsList);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching topic data:', err);
        setError('Failed to load topic information');
        setLoading(false);
      }
    };

    fetchTopicAndTips();
  }, [topicId]);

  if (loading) {
    return <div className="loading">Loading topic information...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!topic) {
    return <div className="not-found">Topic not found</div>;
  }

  return (
    <div className="topic-dashboard">
      <div className="topic-header">
        <h1>{topic.title}</h1>
        <Link to="/" className="back-link">← Back to Topics</Link>
      </div>
      
      <div className="topic-details">
        <div className="topic-info">
          <div className="topic-description">{topic.description}</div>
          
          {topic.recentUpdates && (
            <div className="topic-updates">
              <h3>Recent Updates</h3>
              <p>{topic.recentUpdates}</p>
            </div>
          )}
          
          {topic.location && (
            <div className="topic-location">
              <h3>Location</h3>
              <p>{topic.location}</p>
            </div>
          )}
          
          {topic.companies && topic.companies.length > 0 && (
            <div className="topic-companies">
              <h3>Related Companies</h3>
              <ul>
                {topic.companies.map((company, index) => (
                  <li key={index}>{company}</li>
                ))}
              </ul>
            </div>
          )}
          
          {topic.documentUrls && topic.documentUrls.length > 0 && (
            <div className="topic-documents">
              <h3>Related Documents</h3>
              <ul>
                {topic.documentUrls.map((doc, index) => (
                  <li key={index}>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      {doc.title || `Document ${index + 1}`}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {topic.imageUrl && (
          <div className="topic-image-container">
            <img src={topic.imageUrl} alt={topic.title} className="topic-image" />
          </div>
        )}
      </div>
      
      <div className="tips-section">
        <div className="tips-header">
          <h2>Recent Tips</h2>
          <Link to={`/topic/${topicId}/submit-tip`} className="submit-tip-btn">
            Submit a New Tip
          </Link>
        </div>
        
        {tips.length === 0 ? (
          <div className="no-tips">
            <p>No tips have been submitted yet. Be the first to share information!</p>
          </div>
        ) : (
          <div className="tips-list">
            {tips.map(tip => (
              <TipItem key={tip.id} tip={tip} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicDashboard;
