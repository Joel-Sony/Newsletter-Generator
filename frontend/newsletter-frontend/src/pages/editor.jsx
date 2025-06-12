import React, { useEffect, useState } from 'react';
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';
import { canvasAbsoluteMode } from '@grapesjs/studio-sdk-plugins';
import './editor.css';

const API_BASE_URL = 'http://localhost:5000/api';

// const apiCall = async (endpoint, options = {}) => {
//   const url = `${API_BASE_URL}${endpoint}`;
//   const config = {
//     headers: {
//       'Content-Type': 'application/json',
//       'Autho'
//       ...options.headers,
//     },
//     ...options,
//   };

//   try {
//     const response = await fetch(url, config);
    
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
    
//     return await response.json();
//   } catch (error) {
//     console.error('API call failed:', error);
//     throw error;
//   }
// };

function freezeAutoDimensionsInCanvas(editor) {
  const iframe = editor.Canvas.getFrameEl();
  if (!iframe) return;

  const doc = iframe.contentDocument;
  const allElements = doc.body.querySelectorAll('*');

  allElements.forEach(el => {
    const computed = window.getComputedStyle(el);
    const width = el.offsetWidth;
    const height = el.offsetHeight; 

    // Apply only if width/height was auto
    if (computed.width === 'auto' || computed.height === 'auto') {
      el.style.width = width + 'px';
      el.style.height = height + 'px';
    }
  });
}

// Enhanced Modal Component
const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '16px',
          padding: '0',
          width: 'clamp(320px, 90vw, 500px)',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          animation: 'slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 24px 16px',
          borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
          background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '600',
              color: '#1e293b',
              letterSpacing: '-0.025em',
            }}>
              {title}
            </h3>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                color: '#64748b',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                lineHeight: '1',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={e => {
                e.target.style.backgroundColor = '#f1f5f9';
                e.target.style.color = '#334155';
              }}
              onMouseLeave={e => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#64748b';
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

// Enhanced Button Component
const Button = ({ variant = 'primary', children, onClick, disabled = false, ...props }) => {
  const baseStyles = {
    padding: '12px 24px',
    borderRadius: '10px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '500',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    opacity: disabled ? 0.6 : 1,
    fontFamily: 'inherit',
    ...props.style,
  };

  const variantStyles = {
    primary: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      color: 'white',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
    },
    secondary: {
      background: 'white',
      color: '#64748b',
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    },
    success: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
    },
  };

  return (
    <button
      {...props}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...baseStyles,
        ...variantStyles[variant],
      }}
      onMouseEnter={e => {
        if (!disabled) {
          if (variant === 'primary') {
            e.target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
            e.target.style.transform = 'translateY(-1px)';
          } else if (variant === 'secondary') {
            e.target.style.backgroundColor = '#f8fafc';
            e.target.style.borderColor = '#cbd5e1';
          } else if (variant === 'success') {
            e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
            e.target.style.transform = 'translateY(-1px)';
          }
        }
      }}
      onMouseLeave={e => {
        if (!disabled) {
          if (variant === 'primary') {
            e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
            e.target.style.transform = 'translateY(0)';
          } else if (variant === 'secondary') {
            e.target.style.backgroundColor = 'white';
            e.target.style.borderColor = '#e2e8f0';
          } else if (variant === 'success') {
            e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
            e.target.style.transform = 'translateY(0)';
          }
        }
      }}
    >
      {children}
    </button>
  );
};

// Enhanced Input Components
const Select = ({ children, ...props }) => (
  <select
    {...props}
    style={{
      width: '100%',
      padding: '12px 16px',
      fontSize: '14px',
      borderRadius: '10px',
      border: '1px solid #e2e8f0',
      background: 'white',
      color: '#334155',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
      backgroundPosition: 'right 12px center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: '16px',
      paddingRight: '40px',
      ...props.style,
    }}
    onFocus={e => {
      e.target.style.borderColor = '#3b82f6';
      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
    }}
    onBlur={e => {
      e.target.style.borderColor = '#e2e8f0';
      e.target.style.boxShadow = 'none';
    }}
  >
    {children}
  </select>
);

const TextArea = ({ ...props }) => (
  <textarea
    {...props}
    style={{
      width: '100%',
      padding: '12px 16px',
      fontSize: '14px',
      borderRadius: '10px',
      border: '1px solid #e2e8f0',
      background: 'white',
      color: '#334155',
      resize: 'vertical',
      minHeight: '100px',
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
      ...props.style,
    }}
    onFocus={e => {
      e.target.style.borderColor = '#3b82f6';
      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
    }}
    onBlur={e => {
      e.target.style.borderColor = '#e2e8f0';
      e.target.style.boxShadow = 'none';
    }}
  />
);

const Label = ({ children, ...props }) => (
  <label
    {...props}
    style={{
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '6px',
      display: 'block',
      ...props.style,
    }}
  >
    {children}
  </label>
);

function Editor() {
  const [htmlContent, setHtmlContent] = useState(null);
  const [editorReady, setEditorReady] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState('Untitled Newsletter');
  const [projectId, setProjectId] = useState(null); 

  // Text modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectionInfo, setSelectionInfo] = useState(null);
  const [tone, setTone] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');

  // Image modal state
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageComponent, setSelectedImageComponent] = useState(null);
  const [imagePrompt, setImagePrompt] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  
  // Save modal state
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveFormData, setSaveFormData] = useState({
    projectName: '',
    description: '',
    status: 'DRAFT'
  });
  const [savingProject, setSavingProject] = useState(false);
  const [projectStatus, setProjectStatus] = useState('DRAFT');

  useEffect(() => {
    console.log('App component mounted, fetching HTML content...');
    
    // Fetch initial HTML content for the editor
    fetch('/api/generated_output.html')
      .then(res => {
        console.log('Fetch response status:', res.status);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.text();
      })
      .then(html => {
        console.log('HTML content received:', html.substring(0, 200) + '...');
        setHtmlContent(html);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch initial HTML content:", err);
        setError(err.message);
        // Fallback content
        const fallbackContent = `
          <div style="padding: 50px; text-align: center;">
            <h1>Welcome to the Editor</h1>
            <p>Could not load initial template. Starting with default content.</p>
            <img src="https://picsum.photos/seed/default/300/200" alt="Placeholder"/>
          </div>
        `;
        setHtmlContent(fallbackContent);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (editorReady && htmlContent) {
      editorReady.loadProjectData({
        pages: [{ name: 'Edit Template', component: htmlContent }],
      });

      // Defer to allow DOM to render
      setTimeout(() => freezeAutoDimensionsInCanvas(editorReady), 300);
    }
  }, [editorReady, htmlContent]);

  useEffect(() => {
    if (!editorReady) return;

    const iframe = editorReady.Canvas.getFrameEl();
    if (!iframe) return;

    const doc = iframe.contentDocument;

    const handleMouseDown = () => {
      // Clear previous selection cache
      window._cachedTextSelection = null;
      
      // Small delay to ensure selection is properly registered
      setTimeout(() => {
        const selection = doc.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if (range && range.toString().trim()) {
            window._cachedTextSelection = {
              text: range.toString(),
              range: range.cloneRange(),
              startContainer: range.startContainer,
              endContainer: range.endContainer,
              startOffset: range.startOffset,
              endOffset: range.endOffset
            };
          }
        }
      }, 10);
    };

    const handleMouseUp = () => {
      // Also capture selection on mouseup as a fallback
      setTimeout(() => {
        const selection = doc.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if (range && range.toString().trim()) {
            window._cachedTextSelection = {
              text: range.toString(),
              range: range.cloneRange(),
              startContainer: range.startContainer,
              endContainer: range.endContainer,
              startOffset: range.startOffset,
              endOffset: range.endOffset
            };
          }
        }
      }, 10);
    };

    doc.addEventListener('mousedown', handleMouseDown);
    doc.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      doc.removeEventListener('mousedown', handleMouseDown);
      doc.removeEventListener('mouseup', handleMouseUp);
    };
  }, [editorReady]);

  // Function to get current text selection
  const getTextSelection = () => {
    // First try to get from cache
    if (window._cachedTextSelection) {
      return window._cachedTextSelection;
    }

    // Fallback: try to get current selection
    if (!editorReady) return null;
    
    const iframe = editorReady.Canvas.getFrameEl();
    if (!iframe) return null;
    
    const doc = iframe.contentDocument;
    const selection = doc.getSelection();
    
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (range && range.toString().trim()) {
        return {
          text: range.toString(),
          range: range.cloneRange(),
          startContainer: range.startContainer,
          endContainer: range.endContainer,
          startOffset: range.startOffset,
          endOffset: range.endOffset
        };
      }
    }
    
    return null;
  };

  const openModal = (component) => {
    // Get current selection before opening modal
    const selection = getTextSelection();
    
    // Check if selection exists and has text
    if (!selection || !selection.text || !selection.text.trim()) {
      alert('Please select some text first before using AI transformation.');
      return;
    }

    setSelectedComponent(component);
    setSelectedText(selection.text);
    setSelectionInfo(selection);
    setTone('');
    setCustomPrompt('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedComponent(null);
    setSelectedText('');
    setSelectionInfo(null);
    // Clear cached selection when modal closes
    window._cachedTextSelection = null;
  };

  const openImageModal = (component) => {
    setSelectedImageComponent(component);
    setImagePrompt('');
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setSelectedImageComponent(null);
  };

  const handleTransform = async () => {
    if (!selectedComponent || !selectionInfo) return;

    if (!selectedText.trim()) {
      alert('No text selected for transformation.');
      return;
    }

    if (!tone) {
      alert('Please select a tone.');
      return;
    }

    if (tone === 'Custom Tone' && !customPrompt.trim()) {
      alert('Please enter a custom prompt.');
      return;
    }

    try {
      setLoadingAI(true);

      const response = await fetch('/api/transformText', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectedText,
          tone: tone === 'Custom Tone' ? 'Custom' : tone,
          prompt: customPrompt,
        }),
      });

      if (!response.ok) throw new Error('Server error during text transformation');

      const data = await response.json();
      const newText = data.transformed || '[Error: Empty response from server]';

      // Replace only the selected text
      replaceSelectedText(newText);
      closeModal();
    } catch (err) {
      console.error('Failed to transform text:', err);
      alert('Failed to transform text: ' + err.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const replaceSelectedText = (newText) => {
    try {
      if (!selectionInfo || !selectedComponent) return;

      // Get the component's DOM element
      const componentEl = selectedComponent.getEl();
      if (!componentEl) return;

      // Create a new range based on stored selection info
      const range = document.createRange();
      
      // Verify that the stored containers still exist in the DOM
      if (!componentEl.contains(selectionInfo.startContainer) || 
          !componentEl.contains(selectionInfo.endContainer)) {
        // Fallback: try to find the text in the component and replace first occurrence
        const currentHTML = componentEl.innerHTML;
        const updatedHTML = currentHTML.replace(selectedText, newText);
        componentEl.innerHTML = updatedHTML;
        
        // Update GrapesJS component content
        selectedComponent.components(updatedHTML);
        return;
      }

      // Set the range using stored selection info
      range.setStart(selectionInfo.startContainer, selectionInfo.startOffset);
      range.setEnd(selectionInfo.endContainer, selectionInfo.endOffset);

      // Delete the selected content and insert new text
      range.deleteContents();
      
      // Create a text node with the new content
      const textNode = document.createTextNode(newText);
      range.insertNode(textNode);

      // Update GrapesJS component content to reflect the changes
      const updatedContent = componentEl.innerHTML;
      selectedComponent.components(updatedContent);

      // Clear the selection and cache
      const iframe = editorReady.Canvas.getFrameEl();
      if (iframe && iframe.contentDocument) {
        iframe.contentDocument.getSelection().removeAllRanges();
      }
      window._cachedTextSelection = null;
      
    } catch (error) {
      console.error('Error replacing selected text:', error);
      // Fallback: replace the entire component content
      const originalText = selectedComponent.view?.el?.innerText || '';
      const newContent = originalText.replace(selectedText, newText);
      selectedComponent.components([{ type: 'text', content: newContent }]);
    }
  };

  const handleImageGeneration = async () => {
    if (!selectedImageComponent) {
      alert('No image component selected.');
      return;
    }
    if (!imagePrompt.trim()) {
      alert('Please enter an image prompt.');
      return;
    }

    try {
      setLoadingAI(true);

      const response = await fetch('/api/generateImage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt }),
      });

      if (!response.ok) throw new Error('Image generation failed on server');

      const { image_base64, mime_type } = await response.json();
      if (!image_base64 || !mime_type) {
        throw new Error('Invalid image data received from server.');
      }
      const dataUrl = `data:${mime_type};base64,${image_base64}`;

      selectedImageComponent.addAttributes({ src: dataUrl });
      closeImageModal();
    } catch (err) {
      console.error('Image generation error:', err);
      alert('Image generation error: ' + err.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const openSaveModal = () => {
    setSaveFormData({
      projectName: projectName,
      description: '', // Remove this if not needed in UI
      status: projectStatus // This gets the external dropdown value
    });
    setSaveModalOpen(true);
  }; 

  const closeSaveModal = () => {
    setSaveModalOpen(false);
    setSaveFormData({
      projectName: '',
      description: '',
      status: 'DRAFT'
    });
  };

  const handleSaveProject = async () => {
    if (!editorReady) {
      alert('Editor not ready');
      return;
    }

    if (!saveFormData.projectName.trim()) {
      alert('Please enter a project name.');
      return;
    }

    // Get auth token
    const authToken = getAuthToken();
    if (!authToken) {
      alert('Authentication required. Please log in.');
      return;
    }

    try {
      setSavingProject(true);

      // Get the current project data from the editor
      const projectData = editorReady.getProjectData();
      
      const response = await fetch('/api/upload-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}` // Make sure this is correct format
        },
        body: JSON.stringify({
          project_name: saveFormData.projectName, // From form
          status: projectStatus,                 // From external dropdown
          project_data: projectData,             // GrapesJS data
          project_id: projectId,                 // null for new, existing ID for updates
        })
      });

      const data = await response.json();

      // Check if the request was successful
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      // Now access properties from the parsed data
      if (data.project_id) {
        setProjectId(data.project_id); // Store for future saves
      }

      // Update project name in state
      setProjectName(saveFormData.projectName);
      
      alert(`Project saved successfully! Version: ${data.version || 1}`);
      closeSaveModal();
      
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project: ' + error.message);
    } finally {
      setSavingProject(false);
    }
  };

  const loadExistingProject = (loadedProjectId) => {
    // Call this when loading an existing project
    setProjectId(loadedProjectId);
  };

  const handleProjectNameChange = (newName) => {
    if (newName.trim()) {
      setProjectName(newName.trim());
    }
  };

  const getAuthToken = () => {
    try {
      return localStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };


  // Error boundary - if there's an error, show it
  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: 'red',
        fontFamily: 'Arial, sans-serif' 
      }}>
        <h2>Error Loading Editor</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          Reload Page
        </button>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif' 
      }}>
        Loading editor...
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 20px',
      backgroundColor: '#1a1a1a',
      borderBottom: '1px solid #333',
      minHeight: '60px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        {/* Newsletter Name - Editable */}
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => handleProjectNameChange(e.target.innerText)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.target.blur();
            }
          }}
          style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#f1f5f9',
            padding: '4px 8px',
            backgroundColor: '#2a2a2a',
            borderRadius: '6px',
            outline: 'none',
            minWidth: '150px',
            maxWidth: '300px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            cursor: 'text'
          }}
        >
          {projectName}
        </div>

        {/* Status Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: '#888' }}>Status:</span>
          <select
            value={projectStatus}
            onChange={(e) => setProjectStatus(e.target.value)}
            style={{
              padding: '6px 12px',
              fontSize: '14px',
              borderRadius: '6px',
              border: '1px solid #444',
              backgroundColor: '#2a2a2a',
              color: '#f1f5f9',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        {/* Editor Status */}
        <div style={{
          fontSize: '14px',
          color: '#888',
          padding: '4px 8px',
          backgroundColor: '#2a2a2a',
          borderRadius: '4px'
        }}>
          {editorReady ? '✓ Ready' : '⏳ Loading...'}
        </div>
      </div>

      {/* Save button */}
      <Button
        variant="primary"
        onClick={openSaveModal}
        disabled={!editorReady}
        style={{
          backgroundColor: '#1034a6',
          color: 'white',
          opacity: editorReady ? 1 : 0.6,
        }}
      >
        💾 Save Project
      </Button>
    </div>
      
      {/* Editor */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <StudioEditor
          onReady={editor => {
            console.log('Editor ready:', editor);
            setEditorReady(editor);
          }}
          options={{
            project: {
              default: {
                pages: [
                  {
                    name: 'Home',
                    component: htmlContent || `
                      <div style="padding: 20px; max-width: 400px; margin: 0 auto; display: flex; flex-direction: column;">
                        <h1 style="font-size: 3rem">Loading...</h1>
                      </div>
                    `,
                  },
                ],
              },
            },
            plugins: [
              canvasAbsoluteMode,
              editor => {
                // Custom plugin for context menus
                const commonContextMenuLogic = (component, items, actionType) => {
                  const handler = actionType === 'text' ? openModal : openImageModal;
                  const label = actionType === 'text' ? 'Transform Text (AI)' : 'Replace Image (AI)';
                  const icon = actionType === 'text' ? 'text' : 'image';
                  
                  return [
                    ...items,
                    {
                      id: `ai-${actionType}-${component.getId()}`,
                      label: label,
                      icon: icon,
                      onClick: () => handler(component),
                    },
                  ];
                };

                editor.Components.addType('text', {
                  model: {
                    defaults: {
                      contextMenu: ({ items, component }) => commonContextMenuLogic(component, items, 'text'),
                    },
                  },
                });

                editor.Components.addType('image', {
                  model: {
                    defaults: {
                      contextMenu: ({ items, component }) => commonContextMenuLogic(component, items, 'image'),
                    },
                  },
                });
                
                const imageLikeTypes = ['image', 'picture', 'figure'];
                imageLikeTypes.forEach(type => {
                  const existingType = editor.Components.getType(type);
                  if (existingType) {
                    editor.Components.addType(type, {
                      model: {
                        defaults: {
                          ...existingType.model.prototype.defaults,
                        contextMenu: ({ items, component }) => commonContextMenuLogic(component, items, 'image'),
                      },
                    },
                  });
                }
              })
            }
            ],
            canvas: {
              styles: ['/editor.css'],
            },
            i18n: {
              messages: { en: {} },
            },
          }}
        />
      </div>

      {/* Text Transform Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title="Transform Text with AI">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Selected Text Display */}
          <div>
            <Label>Selected Text:</Label>
            <div style={{
              padding: '12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#475569',
              maxHeight: '100px',
              overflow: 'auto',
              fontStyle: selectedText ? 'normal' : 'italic'
            }}>
              {selectedText || 'No text selected'}
            </div>
          </div>

          {/* Tone Selection */}
          <div>
            <Label>Select Tone:</Label>
            <Select value={tone} onChange={(e) => setTone(e.target.value)}>
              <option value="">Choose a tone...</option>
              <option value="Professional">Professional</option>
              <option value="Casual">Casual</option>
              <option value="Friendly">Friendly</option>
              <option value="Formal">Formal</option>
              <option value="Humorous">Humorous</option>
              <option value="Persuasive">Persuasive</option>
              <option value="Educational">Educational</option>
              <option value="Custom Tone">Custom Tone</option>
            </Select>
          </div>

          {/* Custom Prompt (shown when Custom Tone is selected) */}
          {tone === 'Custom Tone' && (
            <div>
              <Label>Custom Prompt:</Label>
              <TextArea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe how you want the text to be transformed..."
              />
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button 
              variant="success" 
              onClick={handleTransform}
              disabled={loadingAI || !selectedText || !tone}
            >
              {loadingAI ? 'Transforming...' : '✨ Transform Text'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Image Generation Modal */}
      <Modal isOpen={imageModalOpen} onClose={closeImageModal} title="Generate Image with AI">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <Label>Image Description:</Label>
            <TextArea
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              style={{ minHeight: '120px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={closeImageModal}>
              Cancel
            </Button>
            <Button 
              variant="success" 
              onClick={handleImageGeneration}
              disabled={loadingAI || !imagePrompt.trim()}
            >
              {loadingAI ? 'Generating...' : '🎨 Generate Image'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Save Project Modal */}
      <Modal isOpen={saveModalOpen} onClose={closeSaveModal} title="Save Project">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <Label>Project Name:</Label>
            <input
              type="text"
              value={saveFormData.projectName}
              onChange={(e) => setSaveFormData({...saveFormData, projectName: e.target.value})}
              placeholder="Enter project name..."
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                background: 'white',
                color: '#334155',
                transition: 'all 0.2s ease',
              }}
              onFocus={e => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div>
            <Label>Description (Optional):</Label>
            <TextArea
              value={saveFormData.description}
              onChange={(e) => setSaveFormData({...saveFormData, description: e.target.value})}
              placeholder="Describe your project..."
              style={{ minHeight: '80px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={closeSaveModal}>
              Cancel
            </Button>
            <Button 
              variant="success" 
              onClick={handleSaveProject}
              disabled={savingProject || !saveFormData.projectName.trim()}
            >
              {savingProject ? 'Saving...' : '💾 Save Project'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Editor;