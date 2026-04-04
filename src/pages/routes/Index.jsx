import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../auth/login/Login';
import Register from '../auth/register/Register';

// Import other components (you can add these as needed)
// import Dashboard from '../dashboard/Dashboard';
// import Home from '../home/Home';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes (add authentication check later) */}
        {/* <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/home" element={<Home />} /> */}
        
        {/* Catch all route - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;