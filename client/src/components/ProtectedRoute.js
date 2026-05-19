import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Explicitly check if the token exists and is not an empty string
  const token = localStorage.getItem('token');
  const isAuthenticated = token && token.length > 0; // Check if token exists and is not empty

  // Optional: Add a log to see if the check runs and what the token value is
  console.log("ProtectedRoute Check - Token:", token, "Is Authenticated:", isAuthenticated);

  // If authenticated, render the child route (AdminPanel).
  // Otherwise, redirect to the login page, replacing the current entry in history.
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;

