// src/components/Admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import '../../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [pendingTips, setPendingTips] = useState(0);
  const [totalTopics, setTotalTopics] = useState(0);
  const [totalApprovedTips, setTotalApprovedTips] = useState(0);
  const [pendingFeedback, setPendingFeedback] = useState(0);
  const [recentTopics, setRecentTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get counts
        const topicsRef = collection(db, 'topics');
        const topicsCount = await getCountFromServer(topicsRef);
        setTotalTopics(topicsCount.data().count);
        
        const approvedTipsRef = query(
          collection(db, 'tips'),
          where('approved', '==', true)
        );
        const approvedTipsCount = await getCountFromServer(approvedTipsRef);
        setTotalApprovedTips(approvedTipsCount.data().count);
        
        const pendingTipsRef = query(
          collection(db, 'tips'),
          where('approved', '==', false)
        );
        const pendingTipsCount = await getCountFromServer(pendingTipsRef);
        setPendingTips(pendingTipsCount.data().count);
        
        // Fetch recent topics
        const recentTopicsQuery = query(
          collection(db, 'topics'),
          orderBy('createdAt', 'desc'),
          where('createdAt', '!=', null)
        );
        const recentTopicsSnapshot = await getDocs(recentTopicsQuery);
        const recentTopicsList = recentTopicsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).slice(0, 5); // Limit to 5 most recent
        
        setRecentTopics(recentTopicsList);
        
        // Count tips with pending feedback
        // This is more complex since feedback is an array field
        // We'll need to fetch all tips and filter them
        const tipsWithFeedbackQuery = query(
          collection(db, 'tips'),
          where('approved', '==', true)
        );
        const tipsWithFeedbackSnapshot = await getDocs(tipsWithFeedbackQuery);
        
        let pendingFeedbackCount = 0;
        tipsWithFeedbackSnapshot.docs.forEach(doc => {
          const tipData = doc.data();
          if (tipData.feedback && tipData.feedback.some(f => f.pending)) {
            pendingFeedbackCount++;
          }
        });
        
        setPendingFeedback(pendingFeedbackCount);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard information');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      <div className="dashboard-stats">
        <div className="stat-card pending-tips">
          <h3>Pending Tips</h3>
          <div className="stat-value">{pendingTips}</div>
          <Link to="/admin/tips/review" className="stat-action">
            Review Tips
          </Link>
        </div>
        
        <div className="stat-card pending-feedback">
          <h3>Pending Feedback</h3>
          <div className="stat-value">{pendingFeedback}</div>
          <Link to="/admin/tips/review" className="stat-action">
            Review Feedback
          </Link>
        </div>
        
        <div className="stat-card total-topics">
          <h3>Total Topics</h3>
          <div className="stat-value">{totalTopics}</div>
          <Link to="/admin/topic/new" className="stat-action">
            Create New Topic
          </Link>
        </div>
        
        <div className="stat-card total-tips">
          <h3>Approved Tips</h3>
          <div className="stat-value">{totalApprovedTips}</div>
          <Link to="/tips" className="stat-action">
            View All Tips
          </Link>
        </div>
      </div>
      
      <div className="dashboard-sections">
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Topics</h2>
            <Link to="/admin/topic/new" className="action-btn">
              Create New Topic
            </Link>
          </div>
          
          {recentTopics.length === 0 ? (
            <p>No topics created yet.</p>
          ) : (
            <div className="topics-list">
              {recentTopics.map(topic => (
                <div key={topic.id} className="admin-topic-item">
                  <div className="topic-info">
                    <h3>{topic.title}</h3>
                    <p>{topic.description.substring(0, 100)}...</p>
                  </div>
                  <div className="topic-actions">
                    <Link to={`/admin/topic/${topic.id}/edit`} className="edit-btn">
                      Edit
                    </Link>
                    <Link to={`/topic/${topic.id}`} className="view-btn">
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Quick Actions</h2>
          </div>
          
          <div className="quick-actions">
            <Link to="/admin/tips/review" className="quick-action">
              <i className="action-icon">✓</i>
              Review Pending Tips
            </Link>
            
            <Link to="/admin/topic/new" className="quick-action">
              <i className="action-icon">+</i>
              Create New Topic
            </Link>
            
            <Link to="/" className="quick-action">
              <i className="action-icon">🏠</i>
              View Homepage
            </Link>
            
            <Link to="/tips" className="quick-action">
              <i className="action-icon">📋</i>
              View All Tips
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
