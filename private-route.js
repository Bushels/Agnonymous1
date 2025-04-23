// src/components/common/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { currentUser, isAdmin } = useAuth();

  // If not logged in or not an admin, redirect to login
  if (!currentUser || !isAdmin) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute;
