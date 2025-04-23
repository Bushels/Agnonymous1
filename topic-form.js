// src/components/Admin/TopicForm.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  collection, 
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import '../../styles/TopicForm.css';

const TopicForm = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!topicId;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recentUpdates, setRecentUpdates] = useState('');
  const [location, setLocation] = useState('');
  const [companies, setCompanies] = useState(['']);
  const [documentUrls, setDocumentUrls] = useState([{ title: '', url: '' }]);
  const [imageFile, setImageFile] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchTopic = async () => {
      if (!isEditMode) return;
      
      try {
        setLoading(true);
        const topicRef = doc(db, 'topics', topicId);
        const topicSnap = await getDoc(topicRef);
        
        if (!topicSnap.exists()) {
          setError('Topic not found');
          setLoading(false);
          return;
        }
        
        const topicData = topicSnap.data();
        
        setTitle(topicData.title || '');
        setDescription(topicData.description || '');
        setRecentUpdates(topicData.recentUpdates || '');
        setLocation(topicData.location || '');
        setCompanies(topicData.companies?.length ? topicData.companies : ['']);
        setDocumentUrls(
          topicData.documentUrls?.length 
            ? topicData.documentUrls 
            : [{ title: '', url: '' }]
        );
        
        if (topicData.imageUrl) {
          setCurrentImageUrl(topicData.imageUrl);
          setImagePreview(topicData.imageUrl);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching topic:', err);
        setError('Failed to load topic information');
        setLoading(false);
      }
    };

    fetchTopic();
  }, [topicId, isEditMode]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImageFile(file);
    
    // Create a preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCompanyChange = (index, value) => {
    const updatedCompanies = [...companies];
    updatedCompanies[index] = value;
    setCompanies(updatedCompanies);
  };

  const addCompanyField = () => {
    setCompanies([...companies, '']);
  };

  const removeCompanyField = (index) => {
    const updatedCompanies = companies.filter((_, i) => i !== index);
    setCompanies(updatedCompanies);
  };

  const handleDocumentChange = (index, field, value) => {
    const updatedDocs = [...documentUrls];
    updatedDocs[index] = { ...updatedDocs[index], [field]: value };
    setDocumentUrls(updatedDocs);
  };

  const addDocumentField = () => {
    setDocumentUrls([...documentUrls, { title: '', url: '' }]);
  };

  const removeDocumentField = (index) => {
    const updatedDocs = documentUrls.filter((_, i) => i !== index);
    setDocumentUrls(updatedDocs);
  };

  const uploadImage = async () => {
    if (!imageFile) return currentImageUrl;
    
    const storageRef = ref(storage, `topic-images/${Date.now()}_${imageFile.name}`);
    await uploadBytes(storageRef, imageFile);
    return getDownloadURL(storageRef);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Filter out empty fields
      const filteredCompanies = companies.filter(company => company.trim() !== '');
      const filteredDocumentUrls = documentUrls.filter(doc => 
        doc.title.trim() !== '' || doc.url.trim() !== ''
      );
      
      // Upload image if provided
      let imageUrl = currentImageUrl;
      if (imageFile) {
        imageUrl = await uploadImage();
      }
      
      const topicData = {
        title,
        description,
        recentUpdates: recentUpdates || null,
        location: location || null,
        companies: filteredCompanies,
        documentUrls: filteredDocumentUrls,
        imageUrl: imageUrl || null,
        updatedAt: serverTimestamp()
      };
      
      if (isEditMode) {
        // Update existing topic
        await setDoc(doc(db, 'topics', topicId), topicData, { merge: true });
        setSuccess('Topic updated successfully!');
      } else {
        // Create new topic
        topicData.createdAt = serverTimestamp();
        const docRef = await addDoc(collection(db, 'topics'), topicData);
        setSuccess('Topic created successfully!');
        
        // Navigate to edit page for the new topic
        setTimeout(() => {
          navigate(`/admin/topic/${docRef.id}/edit`);
        }, 2000);
      }
    } catch (err) {
      console.error('Error saving topic:', err);
      setError('Failed to save topic');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading topic...</div>;
  }

  return (
    <div className="topic-form-container">
      <div className="form-header">
        <h1>{isEditMode ? 'Edit Topic' : 'Create New Topic'}</h1>
        <Link to="/admin" className="back-link">
          ← Back to Admin Dashboard
        </Link>
      </div>
      
      {error && <div className="form-error">{error}</div>}
      {success && <div className="form-success">{success}</div>}
      
      <form onSubmit={handleSubmit} className="topic-form">
        <div className="form-section">
          <h2>Basic Information</h2>
          
          <div className="form-group">
            <label htmlFor="title">Topic Title *</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter topic title"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this corruption topic in detail"
              rows={5}
              required
            ></textarea>
          </div>
          
          <div className="form-group">
            <label htmlFor="recentUpdates">Recent Updates</label>
            <textarea
              id="recentUpdates"
              value={recentUpdates}
              onChange={(e) => setRecentUpdates(e.target.value)}
              placeholder="Any recent developments or news related to this topic"
              rows={3}
            ></textarea>
          </div>
        </div>
        
        <div className="form-section">
          <h2>Location & Companies</h2>
          
          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Geographical area affected (city, region, country)"
            />
          </div>
          
          <div className="form-group">
            <label>Related Companies</label>
            
            {companies.map((company, index) => (
              <div key={index} className="input-group">
                <input
                  type="text"
                  value={company}
                  onChange={(e) => handleCompanyChange(index, e.target.value)}
                  placeholder="Company name"
                />
                
                {companies.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCompanyField(index)}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            
            <button
              type="button"
              onClick={addCompanyField}
              className="add-btn"
            >
              + Add Company
            </button>
          </div>
        </div>
        
        <div className="form-section">
          <h2>Documents & Media</h2>
          
          <div className="form-group">
            <label>Supporting Documents</label>
            
            {documentUrls.map((doc, index) => (
              <div key={index} className="document-input-group">
                <input
                  type="text"
                  value={doc.title}
                  onChange={(e) => handleDocumentChange(index, 'title', e.target.value)}
                  placeholder="Document title"
                  className="doc-title-input"
                />
                
                <input
                  type="url"
                  value={doc.url}
                  onChange={(e) => handleDocumentChange(index, 'url', e.target.value)}
                  placeholder="Document URL"
                  className="doc-url-input"
                />
                
                {documentUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDocumentField(index)}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            
            <button
              type="button"
              onClick={addDocumentField}
              className="add-btn"
            >
              + Add Document
            </button>
          </div>
          
          <div className="form-group">
            <label htmlFor="imageFile">Topic Image</label>
            
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Topic preview" />
              </div>
            )}
            
            <input
              type="file"
              id="imageFile"
              accept="image/*"
              onChange={handleImageChange}
            />
            
            {currentImageUrl && !imageFile && (
              <div className="current-image-info">
                <p>Current image will be kept if no new image is selected</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="form-actions">
          <Link to="/admin" className="cancel-btn">
            Cancel
          </Link>
          
          <button
            type="submit"
            className="submit-btn"
            disabled={submitting}
          >
            {submitting 
              ? isEditMode ? 'Updating...' : 'Creating...' 
              : isEditMode ? 'Update Topic' : 'Create Topic'
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default TopicForm;
