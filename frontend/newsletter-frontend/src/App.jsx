import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Editor from './pages/editor.jsx';
import NewsletterDashboard from './pages/home.jsx';
import Login from './pages/login.jsx';
import NewsletterGenerator from './pages/generator.jsx';

function App() {
  return (
    <Routes>

      {/* Sets up default page as login so that it loads first instead of '/'  */}
      <Route index element={<Navigate to="/login" replace />} />    
      
      {/* Home page route */}
      <Route path="/home" element={<ProtectedRoute><NewsletterDashboard /></ProtectedRoute>} />
      
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

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('authToken'); // or use context

  if (!token) {
    return <Navigate to="/login" replace />; // Redirect to login if no token
  }

  return children; // Otherwise show the child component (e.g. <Home />)
};


export default App;