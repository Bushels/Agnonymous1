// src/components/common/Navigation.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/Navigation.css';

const Navigation = () => {
  const { currentUser, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="logo">
          Agnonymous
        </Link>

        {/* Mobile menu button */}
        <button className="menu-toggle" onClick={toggleMenu}>
          <span className={`menu-icon ${isMenuOpen ? 'open' : ''}`}></span>
        </button>

        {/* Navigation links */}
        <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/tips" className="nav-link">Tip Feed</Link>
          
          {isAdmin && (
            <Link to="/admin" className="nav-link admin-link">Admin Dashboard</Link>
          )}
          
          {currentUser ? (
            <button onClick={handleLogout} className="nav-link logout-btn">Logout</button>
          ) : (
            <Link to="/login" className="nav-link">Admin Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
