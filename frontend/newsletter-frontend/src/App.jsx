import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { Routes, Route, Navigate } from 'react-router-dom';
import Editor from './pages/Editor.jsx';
import NewsletterDashboard from './pages/NewsletterDashboard.jsx';
import Login from './pages/Login.jsx';
import NewsletterGenerator from './pages/NewsletterGenerator.jsx';
import Preview from './pages/Preview.jsx';
import NewsletterVersionsPage from './pages/NewsletterVersionsPage.jsx';
import { supabase } from './supabaseClient.js'; // Ensure this path is correct

function App() {
  const [session, setSession] = useState(null); // State to hold the Supabase session
  const [loadingAuth, setLoadingAuth] = useState(true); // State to track initial auth check

  useEffect(() => {

    const getInitialSession = async () => {
      console.log("App.js: Checking initial Supabase session...");
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoadingAuth(false); // Authentication check is complete

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
        console.log("App.js: Auth state changed:", _event, newSession);
        setSession(newSession);
        // If event is SIGNED_OUT, you might want to force a clear for sanity
        if (_event === 'SIGNED_OUT') {
            console.log("App.js: User signed out, clearing any residual custom token.");
            localStorage.removeItem('authToken'); // Defensive: clear custom token
        }
      });

      // Cleanup listener on component unmount
      return () => {
        authListener.subscription.unsubscribe();
      };
    };

    getInitialSession();
  }, []); // Run once on component mount

  // If still loading the auth state, you might want to show a loading spinner
  if (loadingAuth) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#ffffff',
        fontSize: '24px'
      }}>
        Loading authentication...
      </div>
    );
  }

  // Helper function to render protected routes
  // This uses the 'session' state which is managed by the supabase listener
  const ProtectedRoute = ({ children }) => {
    if (!session) {
      console.log("App.js: No session found, navigating to login.");
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Protected Routes using the new pattern */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <NewsletterDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/editor/:id"
        element={
          <ProtectedRoute>
            <Editor />
          </ProtectedRoute>
        }
      />

      <Route
        path="/editor" // For creating new newsletters
        element={
          <ProtectedRoute>
            <Editor />
          </ProtectedRoute>
        }
      />

      <Route
        path="/generator"
        element={
          <ProtectedRoute>
            <NewsletterGenerator />
          </ProtectedRoute>
        }
      />

      <Route
        path="/preview/:id"
        element={
          <ProtectedRoute>
            <Preview />
          </ProtectedRoute>
        }
      />

      <Route
        path="/versions/:projectId"
        element={
          <ProtectedRoute>
            <NewsletterVersionsPage />
          </ProtectedRoute>
        }
      />

      {/* Default redirect for root path */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      {/* Fallback for any unmatched paths */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default App;