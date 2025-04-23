// src/components/Tips/TipForm.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import '../../styles/TipForm.css';

const TipForm = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [documentUrls, setDocumentUrls] = useState(['']);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const fetchTopic = async () => {
      try {
        const topicRef = doc(db, 'topics', topicId);
        const topicSnap = await getDoc(topicRef);
        
        if (!topicSnap.exists()) {
          setError('Topic not found');
          setIsLoading(false);
          return;
        }
        
        setTopic({
          id: topicSnap.id,
          ...topicSnap.data()
        });
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching topic:', err);
        setError('Failed to load topic information');
        setIsLoading(false);
      }
    };

    fetchTopic();
  }, [topicId]);

  const handleUrlChange = (index, value) => {
    const updatedUrls = [...documentUrls];
    updatedUrls[index] = value;
    setDocumentUrls(updatedUrls);
  };

  const addUrlField = () => {
    setDocumentUrls([...documentUrls, '']);
  };

  const removeUrlField = (index) => {
    const updatedUrls = documentUrls.filter((_, i) => i !== index);
    setDocumentUrls(updatedUrls);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('Please provide both a title and content for your tip');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Filter out empty URL fields
      const filteredUrls = documentUrls.filter(url => url.trim() !== '');
      
      await addDoc(collection(db, 'tips'), {
        topicId,
        title,
        content,
        documentUrls: filteredUrls,
        ratings: {
          good: 0,
          bad: 0,
          info: 0
        },
        approved: false,
        createdAt: serverTimestamp()
      });
      
      setSubmitSuccess(true);
      
      // Reset form
      setTitle('');
      setContent('');
      setDocumentUrls(['']);
      
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate(`/topic/${topicId}`);
      }, 3000);
    } catch (err) {
      console.error('Error submitting tip:', err);
      setError('Failed to submit your tip. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (error && !topic) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <Link to="/" className="back-link">Return to Homepage</Link>
      </div>
    );
  }

  return (
    <div className="tip-form-container">
      {submitSuccess ? (
        <div className="submission-success">
          <h2>Thank you for your tip!</h2>
          <p>Your tip has been submitted for review by our administrators.</p>
          <p>You will be redirected to the topic page shortly...</p>
          <Link to={`/topic/${topicId}`} className="back-to-topic">
            Return to Topic
          </Link>
        </div>
      ) : (
        <>
          <div className="form-header">
            <h1>Submit an Anonymous Tip</h1>
            <p>Topic: {topic?.title}</p>
            <Link to={`/topic/${topicId}`} className="back-link">
              ← Back to Topic
            </Link>
          </div>
          
          {error && <div className="form-error">{error}</div>}
          
          <form onSubmit={handleSubmit} className="tip-form">
            <div className="form-group">
              <label htmlFor="title">Tip Title *</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Provide a clear title for your tip"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="content">Tip Content *</label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe the corruption issue in detail"
                rows={6}
                required
              ></textarea>
            </div>
            
            <div className="form-group">
              <label>Supporting Document URLs (optional)</label>
              <p className="help-text">
                Provide links to any evidence or supporting documents
              </p>
              
              {documentUrls.map((url, index) => (
                <div key={index} className="url-input-group">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => handleUrlChange(index, e.target.value)}
                    placeholder="https://example.com/document"
                  />
                  
                  {documentUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeUrlField(index)}
                      className="remove-url-btn"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={addUrlField}
                className="add-url-btn"
              >
                + Add Another URL
              </button>
            </div>
            
            <div className="form-actions">
              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Tip'}
              </button>
            </div>
            
            <div className="form-note">
              <p>
                All tips are anonymous and will be reviewed by administrators
                before being published.
              </p>
              <p>
                Thank you for helping create transparency in the agriculture industry!
              </p>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default TipForm;
