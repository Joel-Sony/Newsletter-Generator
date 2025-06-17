import { Routes, Route, Navigate } from 'react-router-dom';
import Editor from './pages/Editor.jsx'; 
import NewsletterDashboard from './pages/NewsletterDashboard.jsx'; 
import Login from './pages/Login.jsx'; 
import NewsletterGenerator from './pages/NewsletterGenerator.jsx';
import Preview from './pages/Preview.jsx';

function App() {
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

      <Route 
      path="/preview/:id"
      element={isAuthenticated() ? <Preview /> : <Navigate to="/login" replace />}
      />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default App;
