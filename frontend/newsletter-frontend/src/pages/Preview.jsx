import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import grapesjs from 'grapesjs';
import './preview.css';
import { supabase } from '../supabaseClient.js'; 

function Preview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState('Loading Newsletter...');

  const editorRef = useRef(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewCss, setPreviewCss] = useState('');

  const showToast = useCallback((message, isError = false) => {
    // ... (your showToast implementation)
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.padding = '12px 24px';
    toast.style.backgroundColor = isError ? '#ef4444' : '#3b82f6';
    toast.style.color = 'white';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    toast.style.zIndex = '10000';
    toast.style.fontFamily = 'sans-serif';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '10px';
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }, []);

  const getAuthToken = useCallback(async () => {
    if (typeof supabase === 'undefined' || !supabase.auth) {
        console.error("Supabase client is not initialized or accessible.");
        showToast('Supabase client error. Please refresh.', true);
        return null;
    }
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Supabase getSession error:', error);
        showToast('Authentication error. Please log in again.', true);
        navigate('/login', { replace: true });
        return null;
      }
      if (session) {
        return session.access_token;
      }
      console.log("No active Supabase session found in getAuthToken, redirecting to login.");
      showToast('Authentication required. Please log in.', true);
      navigate('/login', { replace: true });
      return null;
    } catch (err) {
      console.error('Unexpected error in getAuthToken:', err);
      showToast('An unexpected authentication error occurred. Please try again.', true);
      navigate('/login', { replace: true });
      return null;
    }
  }, [navigate, showToast]);


  const initializeAndLoadProject = useCallback(async () => {
    setLoading(true);
    setError(null);

    const authToken = await getAuthToken();
    if (!authToken) {
      setLoading(false);
      return;
    }

    try {
      if (!editorRef.current) {
        editorRef.current = grapesjs.init({
          container: document.createElement('div'),
          fromElement: false,
          panels: { defaults: [] },
          blockManager: { custom: true },
          traitManager: { custom: true },
          selectorManager: { custom: true },
          storageManager: false,
        });
      }

      const editorInstance = editorRef.current;

      if (id) {
        console.log("Fetching project data for ID:", id);

        const res = await fetch(`/api/newsletters/${id}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${authToken}` },
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            showToast('Session expired or unauthorized. Please log in again.', true);
            navigate('/login', { replace: true });
            return;
          }
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to fetch project: ${res.statusText} (${res.status})`);
        }

        const data = await res.json();
        setProjectName(data.project_name || 'Untitled Newsletter');
        
        if (data.json_path) {
            editorInstance.loadProjectData(data.json_path);
        } else {
            editorInstance.setComponents('<div>No content found for this project.</div>');
        }

      } else {
        editorInstance.setComponents('<div>Select a project to preview.</div>');
        setProjectName('No Project Selected');
      }

      const html = editorInstance.getHtml();
      const css = editorInstance.getCss();

      setPreviewHtml(html);
      setPreviewCss(css);

    } catch (err) {
      console.error("Error during project initialization or loading:", err);
      setError(err.message || 'An unexpected error occurred.');
      setProjectName('Error Loading Project');
      setPreviewHtml(`
        <div style="padding: 50px; text-align: center; color: #ef4444; background: #1f1f1f; border-radius: 8px;">
          <h2>Oops! Error Loading Content</h2>
          <p>${err.message || 'Failed to load newsletter content.'}</p>
          <p>Please try again or select another newsletter.</p>
        </div>
      `);
      setPreviewCss(`
        body { margin: 0; padding: 0; font-family: sans-serif; background-color: #0a0a0a; color: #ffffff; }
      `);
    } finally {
      setLoading(false);
    }
  }, [id, getAuthToken, navigate, showToast]);

  useEffect(() => {
    initializeAndLoadProject();

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [initializeAndLoadProject]);

  const handleGoBack = () => {
    navigate('/home');
  };

  const handleEdit = () => {
    navigate(`/editor/${id}`);
  };

  if (loading) {
    return (
      <div className="preview-loading-overlay">
        <div className="preview-spinner"></div>
        <p>Loading project preview...</p>
      </div>
    );
  }

  return (
    <div className="preview-container">
      <header className="preview-header">
        <div className="preview-header-content">
          <h1 className="preview-header-title">Preview: {projectName}</h1>
          <div className="preview-header-actions">
            <button onClick={handleGoBack} className="preview-back-button">
              ← Back to Home
            </button>
            <button onClick={handleEdit} className="preview-edit-button">
              Continue to Editor
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="preview-error-message">
          Error: {error}
        </div>
      )}
      <div className="preview-content">
        <style dangerouslySetInnerHTML={{ __html: previewCss }}></style>
        <div dangerouslySetInnerHTML={{ __html: previewHtml }}></div>
      </div>
    </div>
  );
}

export default Preview;