// src/components/Tips/TipItem.js
import React, { useState } from 'react';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import '../../styles/TipItem.css';

const TipItem = ({ tip }) => {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackType, setFeedbackType] = useState('');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [tipRatings, setTipRatings] = useState(tip.ratings || { good: 0, bad: 0, info: 0 });

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Recently';
    
    const date = timestamp.toDate();
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleRating = async (ratingType) => {
    // For "good" rating, just update the counter
    if (ratingType === 'good') {
      try {
        setIsSubmitting(true);
        
        // Get current tip data to ensure we're working with the latest
        const tipRef = doc(db, 'tips', tip.id);
        const tipSnap = await getDoc(tipRef);
        
        if (!tipSnap.exists()) {
          setError('Tip not found');
          setIsSubmitting(false);
          return;
        }
        
        const currentTip = tipSnap.data();
        const currentRatings = currentTip.ratings || { good: 0, bad: 0, info: 0 };
        
        // Update the rating counter
        await updateDoc(tipRef, {
          'ratings.good': (currentRatings.good || 0) + 1
        });
        
        // Update local state
        setTipRatings({
          ...tipRatings,
          good: (tipRatings.good || 0) + 1
        });
        
        setSuccess('Thank you for rating this tip!');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        console.error('Error updating rating:', err);
        setError('Failed to update rating');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // For "bad" or "info" ratings, show feedback form
      setFeedbackType(ratingType);
      setShowFeedbackForm(true);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    
    if (!feedbackContent.trim()) {
      setError('Please provide feedback details');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const tipRef = doc(db, 'tips', tip.id);
      
      // Get current tip data to ensure we're working with the latest
      const tipSnap = await getDoc(tipRef);
      
      if (!tipSnap.exists()) {
        setError('Tip not found');
        setIsSubmitting(false);
        return;
      }
      
      const currentTip = tipSnap.data();
      const currentRatings = currentTip.ratings || { good: 0, bad: 0, info: 0 };
      
      // Create feedback object
      const feedback = {
        type: feedbackType,
        content: feedbackContent,
        createdAt: new Date(),
        pending: true // Requires admin approval
      };
      
      // Update the document
      await updateDoc(tipRef, {
        [`ratings.${feedbackType}`]: (currentRatings[feedbackType] || 0) + 1,
        feedback: arrayUnion(feedback)
      });
      
      // Update local state
      setTipRatings({
        ...tipRatings,
        [feedbackType]: (tipRatings[feedbackType] || 0) + 1
      });
      
      // Reset form
      setShowFeedbackForm(false);
      setFeedbackContent('');
      setFeedbackType('');
      
      setSuccess('Thank you for your feedback! It will be reviewed by our administrators.');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="tip-item">
      <div className="tip-header">
        <h3 className="tip-title">{tip.title}</h3>
        <span className="tip-date">Submitted: {formatDate(tip.createdAt)}</span>
      </div>
      
      <div className="tip-content">{tip.content}</div>
      
      {tip.documentUrls && tip.documentUrls.length > 0 && (
        <div className="tip-documents">
          <h4>Supporting Documents:</h4>
          <ul>
            {tip.documentUrls.map((url, index) => (
              <li key={index}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  Evidence Document {index + 1}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {tip.feedback && tip.feedback.length > 0 && !tip.feedback.every(f => f.pending) && (
        <div className="tip-feedback">
          <h4>Additional Information:</h4>
          <ul>
            {tip.feedback
              .filter(f => !f.pending)
              .map((feedback, index) => (
                <li key={index} className={`feedback-item ${feedback.type}`}>
                  <p>{feedback.content}</p>
                </li>
              ))
            }
          </ul>
        </div>
      )}
      
      <div className="tip-actions">
        <div className="tip-ratings">
          <div className="rating-counters">
            <span className="rating-counter good">
              <i className="rating-icon">👍</i> {tipRatings.good || 0}
            </span>
            <span className="rating-counter bad">
              <i className="rating-icon">👎</i> {tipRatings.bad || 0}
            </span>
            <span className="rating-counter info">
              <i className="rating-icon">ℹ️</i> {tipRatings.info || 0}
            </span>
          </div>
          
          <div className="rating-buttons">
            <button 
              onClick={() => handleRating('good')} 
              className="rating-btn good"
              disabled={isSubmitting}
            >
              Helpful Tip
            </button>
            <button 
              onClick={() => handleRating('info')} 
              className="rating-btn info"
              disabled={isSubmitting}
            >
              Add Information
            </button>
            <button 
              onClick={() => handleRating('bad')} 
              className="rating-btn bad"
              disabled={isSubmitting}
            >
              Not Accurate
            </button>
          </div>
        </div>
        
        {error && <div className="tip-error">{error}</div>}
        {success && <div className="tip-success">{success}</div>}
        
        {showFeedbackForm && (
          <div className="feedback-form-container">
            <h4>
              {feedbackType === 'info' 
                ? 'Add More Information' 
                : 'Explain Why This Tip Is Not Accurate'}
            </h4>
            
            <form onSubmit={handleFeedbackSubmit} className="feedback-form">
              <textarea
                value={feedbackContent}
                onChange={(e) => setFeedbackContent(e.target.value)}
                placeholder={
                  feedbackType === 'info'
                    ? 'Please provide additional information or details...'
                    : 'Please explain why you think this tip is not accurate...'
                }
                rows={4}
                required
              ></textarea>
              
              <div className="feedback-form-actions">
                <button 
                  type="button" 
                  onClick={() => setShowFeedbackForm(false)}
                  className="cancel-btn"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default TipItem;
