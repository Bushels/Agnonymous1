// src/components/Tips/TipFeed.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  startAfter,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import TipItem from './TipItem';
import '../../styles/TipFeed.css';

const TipFeed = () => {
  const [tips, setTips] = useState([]);
  const [topicMap, setTopicMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const PAGE_SIZE = 10;

  const fetchTopicDetails = async (topicIds) => {
    const uniqueTopicIds = [...new Set(topicIds)];
    const topicData = {};
    
    await Promise.all(
      uniqueTopicIds.map(async (topicId) => {
        try {
          const topicRef = doc(db, 'topics', topicId);
          const topicSnap = await getDoc(topicRef);
          
          if (topicSnap.exists()) {
            topicData[topicId] = {
              id: topicSnap.id,
              ...topicSnap.data()
            };
          }
        } catch (err) {
          console.error(`Error fetching topic ${topicId}:`, err);
        }
      })
    );
    
    return topicData;
  };

  const fetchTips = async (isInitial = true) => {
    try {
      const tipsRef = collection(db, 'tips');
      let tipsQuery;
      
      if (isInitial) {
        setLoading(true);
        tipsQuery = query(
          tipsRef,
          where('approved', '==', true),
          orderBy('createdAt', 'desc'),
          limit(PAGE_SIZE)
        );
      } else {
        setLoadingMore(true);
        if (!lastDoc) return;
        
        tipsQuery = query(
          tipsRef,
          where('approved', '==', true),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        );
      }
      
      const tipsSnap = await getDocs(tipsQuery);
      
      if (tipsSnap.empty) {
        setHasMore(false);
        if (isInitial) {
          setTips([]);
        }
        setLoading(false);
        setLoadingMore(false);
        return;
      }
      
      const tipsList = tipsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Get the last document for pagination
      setLastDoc(tipsSnap.docs[tipsSnap.docs.length - 1]);
      
      // Fetch all topic details
      const topicIds = tipsList.map(tip => tip.topicId);
      const topics = await fetchTopicDetails(topicIds);
      setTopicMap(prevTopics => ({ ...prevTopics, ...topics }));
      
      if (isInitial) {
        setTips(tipsList);
      } else {
        setTips(prevTips => [...prevTips, ...tipsList]);
      }
      
      setHasMore(tipsSnap.size === PAGE_SIZE);
      setLoading(false);
      setLoadingMore(false);
    } catch (err) {
      console.error('Error fetching tips:', err);
      setError('Failed to load tips');
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchTips(true);
  }, []);

  const loadMoreTips = () => {
    if (loadingMore || !hasMore) return;
    fetchTips(false);
  };

  if (loading) {
    return <div className="loading">Loading tips...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="tip-feed">
      <div className="tip-feed-header">
        <h1>Recent Tips</h1>
        <p>View all submitted and approved tips across topics</p>
        <Link to="/" className="back-link">← Back to Topics</Link>
      </div>
      
      {tips.length === 0 ? (
        <div className="no-tips">
          <p>No approved tips available yet. Check back soon!</p>
        </div>
      ) : (
        <>
          <div className="tips-list">
            {tips.map(tip => (
              <div key={tip.id} className="tip-with-topic">
                {topicMap[tip.topicId] && (
                  <div className="tip-topic-label">
                    <Link to={`/topic/${tip.topicId}`}>
                      Topic: {topicMap[tip.topicId].title}
                    </Link>
                  </div>
                )}
                <TipItem tip={tip} />
              </div>
            ))}
          </div>
          
          {hasMore && (
            <div className="load-more">
              <button 
                onClick={loadMoreTips} 
                className="load-more-btn"
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading...' : 'Load More Tips'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TipFeed;
