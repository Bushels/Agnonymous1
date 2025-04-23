// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './components/common/Navigation';
import HomePage from './components/Home/HomePage';
import TopicDashboard from './components/Tips/TopicDashboard';
import TipForm from './components/Tips/TipForm';
import TipFeed from './components/Tips/TipFeed';
import AdminDashboard from './components/Admin/AdminDashboard';
import TopicForm from './components/Admin/TopicForm';
import TipReview from './components/Admin/TipReview';
import PrivateRoute from './components/common/PrivateRoute';
import Login from './components/Auth/Login';
import './styles/App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navigation />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/topic/:topicId" element={<TopicDashboard />} />
              <Route path="/topic/:topicId/submit-tip" element={<TipForm />} />
              <Route path="/tips" element={<TipFeed />} />
              <Route path="/login" element={<Login />} />
              
              {/* Admin Routes (Protected) */}
              <Route 
                path="/admin" 
                element={
                  <PrivateRoute>
                    <AdminDashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/topic/new" 
                element={
                  <PrivateRoute>
                    <TopicForm />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/topic/:topicId/edit" 
                element={
                  <PrivateRoute>
                    <TopicForm />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/tips/review" 
                element={
                  <PrivateRoute>
                    <TipReview />
                  </PrivateRoute>
                } 
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
