import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import grapesjs from 'grapesjs';
import './preview.css'; // Your custom styles for the preview container

function Preview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState('Loading Newsletter...');
  
  const editorRef = useRef(null); 
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewCss, setPreviewCss] = useState('');

  const getAuthToken = () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token || token === 'null' || token === 'undefined') {
        return null;
      }
      return token;
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  };

  const initializeAndLoadProject = useCallback(async () => {
    setLoading(true);
    setError(null);

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
        const authToken = getAuthToken();
        if (!authToken) {
          throw new Error('No authentication token found. Please log in.');
        }

        const res = await fetch(`/api/newsletters/${id}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${authToken}` },
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || `Failed to fetch project: ${res.statusText}`);
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
  }, [id]);

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
    navigate('/home'); // Navigate to your home or dashboard page
  };

  const handleEdit = () => {
    navigate(`/editor/${id}`); // Navigate to the editor for this project ID
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
      {/* --- Preview Header --- */}
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
      {/* --- End Preview Header --- */}

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