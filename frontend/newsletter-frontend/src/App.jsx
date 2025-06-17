import { Routes, Route, Navigate } from 'react-router-dom';
import Editor from './pages/Editor.jsx'; 
import NewsletterDashboard from './pages/NewsletterDashboard.jsx'; 
import Login from './pages/Login.jsx'; 
import NewsletterGenerator from './pages/NewsletterGenerator.jsx';

function App() {
  // Function to check if the user is authenticated
  const isAuthenticated = () => {
    const token = localStorage.getItem('authToken');
    return token !== null && token !== 'null' && token !== 'undefined';
  };

  return (
    <Routes>
     
      <Route path="/login" element={<Login />} />

      <Route
        path="/home"
        element={isAuthenticated() ? <NewsletterDashboard /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/editor/:id"
        element={isAuthenticated() ? <Editor /> : <Navigate to="/login" replace />}
      />
      
      <Route
        path="/editor"
        element={isAuthenticated() ? <Editor /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/generator"
        element={isAuthenticated() ? <NewsletterGenerator /> : <Navigate to="/login" replace />}
      />
     
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default App;
