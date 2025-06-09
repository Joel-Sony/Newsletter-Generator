import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Editor from './pages/editor.jsx';
import NewsletterDashboard from './pages/home.jsx';
import Login from './pages/login.jsx';
import NewsletterGenerator from './pages/generator.jsx';

function App() {
  return (
    <Routes>
      {/* Home page route */}
      <Route path="/" element={<NewsletterDashboard />} />
      
      {/* Login/Auth page route */}
      <Route path="/login" element={<Login />} />
      
      {/* Editor page route */}
      <Route path="/editor" element={<Editor />} />
      
      <Route path="/generator" element={<NewsletterGenerator />} />
      
      {/* Redirect any unknown routes to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;