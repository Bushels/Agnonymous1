// src/components/Admin/TipReview.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import '../../styles/TipReview.css';

const TipReview = () => {
  const [pendingTips, setPendingTips] = useState([]);
  const [pendingFeedback, setPendingFeedback] = useState([]);
  const [topicMap, setTopicMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('tips');
  const [processingIds, setProcessingIds] = useState([]);

  useEffect(() => {
    const fetchPendingItems = async () => {
      try {
        setLoading(true);
        
        // Fetch topics first for reference
        const topicsSnapshot = await getDocs(collection(db, 'topics'));
        const topicsData = {};
        topicsSnapshot.docs.forEach(doc => {
          topicsData[doc.id] = {
            id: doc.id,
            ...doc.data()
          };
        });
        setTopicMap(topicsData);
        
        // Fetch pending tips
        const tipsQuery = query(
          collection(db, 'tips'),
          where('approved', '==', false),
          orderBy('createdAt', 'desc')
        );
        
        const tipsSnapshot = await getDocs(tipsQuery);
        const tipsList = tipsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPendingTips(tipsList);
        
        // Fetch tips with pending feedback
        const approvedTipsQuery = query(
          collection(db, 'tips'),
          where('approved', '==', true)
        );
        
        const approvedTipsSnapshot = await getDocs(approvedTipsQuery);
        
        const feedbackItems = [];
        approvedTipsSnapshot.docs.forEach(doc => {
          const tipData = doc.data();
          
          if (tipData.feedback && tipData.feedback.length > 0) {
            // Find all pending feedback for this tip
            const pendingFeedbackItems = tipData.feedback
              .filter(item => item.pending)
              .map((item, index) => ({
                tipId: doc.id,
                tipTitle: tipData.title,
                topicId: tipData.topicId,
                feedbackIndex: index,
                ...item
              }));
            
            if (pendingFeedbackItems.length > 0) {
              feedbackItems.push(...pendingFeedbackItems);
            }
          }
        });
        
        setPendingFeedback(feedbackItems);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching pending items:', err);
        setError('Failed to load pending items');
        setLoading(false);
      }
    };

    fetchPendingItems();
  }, []);

  const handleApproveTip = async (tipId) => {
    setProcessingIds(prev => [...prev, tipId]);
    
    try {
      const tipRef = doc(db, 'tips', tipId);
      await updateDoc(tipRef, {
        approved: true
      });
      
      // Update local state
      setPendingTips(prev => prev.filter(tip => tip.id !== tipId));
    } catch (err) {
      console.error('Error approving tip:', err);
      alert('Failed to approve tip');
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== tipId));
    }
  };

  const handleRejectTip = async (tipId) => {
    if (!window.confirm('Are you sure you want to reject and delete this tip?')) {
      return;
    }
    
    setProcessingIds(prev => [...prev, tipId]);
    
    try {
      const tipRef = doc(db, 'tips', tipId);
      await deleteDoc(tipRef);
      
      // Update local state
      setPendingTips(prev => prev.filter(tip => tip.id !== tipId));
    } catch (err) {
      console.error('Error rejecting tip:', err);
      alert('Failed to reject tip');
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== tipId));
    }
  };

  const handleApproveFeedback = async (tipId, feedbackIndex) => {
    setProcessingIds(prev => [...prev, `${tipId}-${feedbackIndex}`]);
    
    try {
      const tipRef = doc(db, 'tips', tipId);
      const tipSnap = await getDoc(tipRef);
      
      if (!tipSnap.exists()) {
        alert('Tip not found');
        return;
      }
      
      const tipData = tipSnap.data();
      const feedback = [...tipData.feedback];
      
      // Update the pending status for this feedback item
      if (feedback[feedbackIndex]) {
        feedback[feedbackIndex].pending = false;
        
        await updateDoc(tipRef, { feedback });
        
        // Update local state
        setPendingFeedback(prev => 
          prev.filter(item => 
            !(item.tipId === tipId && item.feedbackIndex === feedbackIndex)
          )
        );
      }
    } catch (err) {
      console.error('Error approving feedback:', err);
      alert('Failed to approve feedback');
    } finally {
      setProcessingIds(prev => 
        prev.filter(id => id !== `${tipId}-${feedbackIndex}`)
      );
    }
  };

  const handleRejectFeedback = async (tipId, feedbackIndex) => {
    if (!window.confirm('Are you sure you want to reject and remove this feedback?')) {
      return;
    }
    
    setProcessingIds(prev => [...prev, `${tipId}-${feedbackIndex}`]);
    
    try {
      const tipRef = doc(db, 'tips', tipId);
      const tipSnap = await getDoc(tipRef);
      
      if (!tipSnap.exists()) {
        alert('Tip not found');
        return;
      }
      
      const tipData = tipSnap.data();
      let feedback = [...tipData.feedback];
      
      // Remove this feedback item
      feedback = feedback.filter((_, index) => index !== feedbackIndex);
      
      await updateDoc(tipRef, { feedback });
      
      // Update local state
      setPendingFeedback(prev => 
        prev.filter(item => 
          !(item.tipId === tipId && item.feedbackIndex === feedbackIndex)
        )
      );
    } catch (err) {
      console.error('Error rejecting feedback:', err);
      alert('Failed to reject feedback');
    } finally {
      setProcessingIds(prev => 
        prev.filter(id => id !== `${tipId}-${feedbackIndex}`)
      );
    }
  };

  if (loading) {
    return <div className="loading">Loading pending items...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Recently';
    
    const date = timestamp.toDate();
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="tip-review">
      <div className="review-header">
        <h1>Review Dashboard</h1>
        <Link to="/admin" className="back-link">
          ← Back to Admin Dashboard
        </Link>
      </div>
      
      <div className="review-tabs">
        <button
          className={`tab-btn ${activeTab === 'tips' ? 'active' : ''}`}
          onClick={() => setActiveTab('tips')}
        >
          Pending Tips ({pendingTips.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          Pending Feedback ({pendingFeedback.length})
        </button>
      </div>
      
      {activeTab === 'tips' && (
        <div className="pending-tips-section">
          {pendingTips.length === 0 ? (
            <div className="no-items">
              <p>No pending tips to review.</p>
            </div>
          ) : (
            <div className="pending-items-list">
              {pendingTips.map(tip => (
                <div key={tip.id} className="pending-item">
                  <div className="item-header">
                    <h3>{tip.title}</h3>
                    <div className="item-meta">
                      <span className="item-topic">
                        Topic: {topicMap[tip.topicId]?.title || 'Unknown Topic'}
                      </span>
                      <span className="item-date">
                        Submitted: {formatDate(tip.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="item-content">
                    <p>{tip.content}</p>
                    
                    {tip.documentUrls && tip.documentUrls.length > 0 && (
                      <div className="item-docs">
                        <h4>Supporting Documents:</h4>
                        <ul>
                          {tip.documentUrls.map((url, index) => (
                            <li key={index}>
                              <a href={url} target="_blank" rel="noopener noreferrer">
                                {url}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="item-actions">
                    <button
                      onClick={() => handleRejectTip(tip.id)}
                      className="reject-btn"
                      disabled={processingIds.includes(tip.id)}
                    >
                      {processingIds.includes(tip.id) ? 'Processing...' : 'Reject'}
                    </button>
                    <button
                      onClick={() => handleApproveTip(tip.id)}
                      className="approve-btn"
                      disabled={processingIds.includes(tip.id)}
                    >
                      {processingIds.includes(tip.id) ? 'Processing...' : 'Approve'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'feedback' && (
        <div className="pending-feedback-section">
          {pendingFeedback.length === 0 ? (
            <div className="no-items">
              <p>No pending feedback to review.</p>
            </div>
          ) : (
            <div className="pending-items-list">
              {pendingFeedback.map(item => {
                const processingId = `${item.tipId}-${item.feedbackIndex}`;
                
                return (
                  <div key={processingId} className="pending-item">
                    <div className="item-header">
                      <h3>
                        {item.type === 'info' 
                          ? 'Additional Information' 
                          : 'Negative Feedback'}
                      </h3>
                      <div className="item-meta">
                        <span className="item-type">
                          Type: {item.type === 'info' ? 'Info' : 'Bad Tip'}
                        </span>
                        <span className="item-related">
                          For Tip: {item.tipTitle}
                        </span>
                        <span className="item-topic">
                          Topic: {topicMap[item.topicId]?.title || 'Unknown Topic'}
                        </span>
                        <span className="item-date">
                          Submitted: {formatDate(item.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="item-content">
                      <p>{item.content}</p>
                    </div>
                    
                    <div className="item-actions">
                      <button
                        onClick={() => handleRejectFeedback(item.tipId, item.feedbackIndex)}
                        className="reject-btn"
                        disabled={processingIds.includes(processingId)}
                      >
                        {processingIds.includes(processingId) ? 'Processing...' : 'Reject'}
                      </button>
                      <button
                        onClick={() => handleApproveFeedback(item.tipId, item.feedbackIndex)}
                        className="approve-btn"
                        disabled={processingIds.includes(processingId)}
                      >
                        {processingIds.includes(processingId) ? 'Processing...' : 'Approve'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TipReview;
