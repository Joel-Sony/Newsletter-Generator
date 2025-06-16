import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';
import { canvasAbsoluteMode } from '@grapesjs/studio-sdk-plugins';
import './editor.css';

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

// const baseButtonStyle = {
//   fontSize: '16px',
//   fontWeight: 600,
//   padding: '10px 16px',
//   borderRadius: '8px',
//   border: 'none',
//   outline: 'none',
//   cursor: 'pointer',
//   transition: 'all 0.2s ease-in-out',
//   display: 'flex',
//   alignItems: 'center',
//   gap: '8px',
// };

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
  const { id } = useParams();
  const navigate = useNavigate();
  const [editor, setEditor] = useState(null); // Renamed from editorReady for consistency
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
  
  const [projectStatus, setProjectStatus] = useState('DRAFT');
  const [savingProject, setSavingProject] = useState(false);

  // Reference for editable project name
  const projectNameRef = useRef(null);
  
  const showToast = (message, isError = false) => {
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
  };

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

  const loadProjectContent = useCallback(async (editorInstance) => {
    if (!editorInstance) return;

    setLoading(true);
    try {
      if (id) {
        console.log("Loading existing project:", id);
        const authToken = getAuthToken();
        if (!authToken) throw new Error('No authentication token found');

        const res = await fetch(`/api/newsletters/${id}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${authToken}` },
        });

        if (!res.ok) throw new Error(`Network response was not ok: ${res.status}`);

        const data = await res.json();
        setProjectId(data.project_id);
        setProjectName(data.project_name);
        setProjectStatus(data.status);
        editorInstance.loadProjectData(data.json_path);
      } else {
        console.log("Loading new project template");
        const res = await fetch('/api/generated_output.html');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const html = await res.text();
        editorInstance.setComponents(html);
      }
    } catch (err) {
      console.error("Failed to load initial HTML content or project:", err);
      setError(err.message);
      const fallbackContent = `
        <div style="padding: 50px; text-align: center;">
          <h1>Welcome to the Editor</h1>
          <p>Could not load initial template. Starting with default content.</p>
          <img src="https://picsum.photos/seed/default/300/200" alt="Placeholder"/>
        </div>
      `;
      editorInstance.setComponents(fallbackContent);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleSaveProject = useCallback(async () => {
    if (!editor) { // Use 'editor' state
      showToast('Editor not ready', true);
      return;
    }

    const currentProjectName = (projectName || 'Untitled Newsletter').trim();
    if (!currentProjectName) {
      setProjectName('Untitled Newsletter');
    }

    const authToken = getAuthToken();
    if (!authToken) {
      showToast('Authentication required. Please log in.', true);
      return;
    }

    try {
      setSavingProject(true);
      
      let html, css, projectData;
      try {
        html = editor.getHtml() || ''; // Use 'editor' state
        css = editor.getCss() || '';   // Use 'editor' state
        projectData = editor.getProjectData() || {}; // Use 'editor' state
      } catch (editorError) {
        console.error('Error extracting editor data:', editorError);
        throw new Error('Failed to extract editor content');
      }

      const fullHtml = `<!DOCTYPE html>
  <html>
    <head>
      <style>${css}</style>
    </head>
    <body>${html}</body>
  </html>`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch('/api/upload-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          project_name: currentProjectName,
          status: projectStatus,
          project_data: projectData,
          project_id: projectId,
          project_fullHtml: fullHtml,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.project_id && !projectId) {
        setProjectId(data.project_id);
        // If it's a new project being saved, navigate to its URL
        navigate(`/editor/${data.project_id}`, { replace: true });
      }

      showToast(`Project "${currentProjectName}" saved successfully!`);
      
    } catch (error) {
      console.error('Error saving project:', error);
      let errorMessage = 'Failed to save project';
      if (error.name === 'AbortError') {
        errorMessage = 'Save request timed out';
      } else if (error.message) {
        errorMessage = `Failed to save: ${error.message}`;
      }
      showToast(errorMessage, true);
    } finally {
      setSavingProject(false);
    }
  }, [editor, projectName, projectStatus, projectId, navigate]); // Add 'navigate' to dependencies

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveProject();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveProject]);

  useEffect(() => {
    if (!editor) return; // Use 'editor' state
  
    const iframe = editor.Canvas.getFrameEl();
    if (!iframe) return;
  
    const doc = iframe.contentDocument;
    
    const handleSelectionChange = () => {
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
    };
  
    doc.addEventListener('selectionchange', handleSelectionChange);
    return () => doc.removeEventListener('selectionchange', handleSelectionChange);
  }, [editor]); // Use 'editor' state as dependency


  // Function to get current text selection
  const getTextSelection = () => {
    if (window._cachedTextSelection) {
      return window._cachedTextSelection;
    }

    if (!editor) return null; // Use 'editor' state
    
    const iframe = editor.Canvas.getFrameEl();
    if (!iframe) return null;
    
    const doc = iframe.contentDocument;
    const selection = doc.getSelection();
    
    if (selection?.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (range?.toString().trim()) {
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
    const selection = getTextSelection();
    
    if (!selection?.text?.trim()) {
      showToast('Please select text before transforming', true);
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
      if (!selectionInfo || !selectedComponent || !editor) return; // Add editor check

      const iframe = editor.Canvas.getFrameEl();
      if (!iframe) return;
      
      const doc = iframe.contentDocument;
      const componentEl = selectedComponent.getEl();
      if (!componentEl) return;

      const range = doc.createRange();
      
      range.setStart(selectionInfo.startContainer, selectionInfo.startOffset);
      range.setEnd(selectionInfo.endContainer, selectionInfo.endOffset);
      
      range.deleteContents();
      const textNode = doc.createTextNode(newText);
      range.insertNode(textNode);

      // Update component content
      const updatedContent = componentEl.innerHTML;
      selectedComponent.components(updatedContent);

      // Clear selection
      doc.getSelection().removeAllRanges();
      window._cachedTextSelection = null;
      
    } catch (error) {
      console.error('Error replacing text:', error);
      const originalText = selectedComponent.view?.el?.innerText || '';
      const newContent = originalText.replace(selectedText, newText);
      selectedComponent.components([{ type: 'text', content: newContent }]);
    }
  };

    const handleImageGeneration = async () => {
    if (!selectedImageComponent) {
      showToast('No image component selected', true);
      return;
    }
    if (!imagePrompt.trim()) {
      showToast('Please enter an image prompt', true);
      return;
    }

    try {
      setLoadingAI(true);

      const response = await fetch('/api/generateImage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt }),
      });

      if (!response.ok) throw new Error('Image generation failed');

      const { image_base64, mime_type } = await response.json();
      if (!image_base64 || !mime_type) {
        throw new Error('Invalid image data received');
      }
      
      const dataUrl = `data:${mime_type};base64,${image_base64}`;
      selectedImageComponent.addAttributes({ src: dataUrl });
      
      closeImageModal();
      showToast('Image generated successfully!');
    } catch (err) {
      console.error('Image generation error:', err);
      showToast(`Image generation error: ${err.message}`, true);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleProjectNameChange = (e) => {
    const newName = e.target.innerText.trim();
    if (newName) setProjectName(newName);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button 
            variant="secondary" 
            onClick={() => navigate('/home')} // Navigates to home
            style={{ 
              fontSize: '18px',
              fontWeight: '600',
              color: '#f1f5f9',
              padding: '12px 10px',
              backgroundColor: '#2a2a2a',
              borderRadius: '6px',
              outline:'none'
            }}
          >
            ← Home
          </Button>
          <div
            ref={projectNameRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={handleProjectNameChange}
            onKeyDown={e => e.key === 'Enter' && e.target.blur()}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#888' }}>Status:</span>
            <select
              value={projectStatus}
              onChange={e => setProjectStatus(e.target.value)}
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

          <div style={{
            fontSize: '14px',
            color: '#888',
            padding: '4px 8px',
            backgroundColor: '#2a2a2a',
            borderRadius: '4px'
          }}>
            {loading ? '⏳ Loading...' : (editor ? '✓ Ready' : '❌ Error')}
          </div>
        </div>

        <Button
          variant="primary"
          onClick={handleSaveProject}
          disabled={!editor || savingProject} // Use 'editor' state
          style={{
            backgroundColor: savingProject ? '#64748b' : '#1034a6',
            color: 'white',
          }}
        >
          {savingProject ? 'Saving...' : '💾 Save Project'}
        </Button>
      </div>
      
      {/* Editor */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <StudioEditor
          onReady={(grapesEditor) => {
            console.log('Editor ready:', grapesEditor);
            setEditor(grapesEditor); 
            loadProjectContent(grapesEditor); 
          }}
          options={{
            plugins: [
              canvasAbsoluteMode,
              editorInstance => { 
                const commonContextMenuLogic = (component, items, actionType) => {
                  const handler = actionType === 'text' ? openModal : openImageModal;
                  const label = actionType === 'text' 
                    ? 'Transform Text (AI)' 
                    : 'Replace Image (AI)';
                  
                  return [
                    ...items,
                    {
                      id: `ai-${actionType}-${component.getId()}`,
                      label,
                      icon: actionType === 'text' ? 'text' : 'image',
                      onClick: () => handler(component),
                    },
                  ];
                };

                editorInstance.Components.addType('text', {
                  model: {
                    defaults: {
                      contextMenu: ({ items, component }) => 
                        commonContextMenuLogic(component, items, 'text'),
                    },
                  },
                });

                editorInstance.Components.addType('image', {
                  model: {
                    defaults: {
                      contextMenu: ({ items, component }) => 
                        commonContextMenuLogic(component, items, 'image'),
                    },
                  },
                });
                
                const imageLikeTypes = ['picture', 'figure'];
                imageLikeTypes.forEach(type => {
                  if (editorInstance.Components.getType(type)) {
                    editorInstance.Components.addType(type, {
                      model: {
                        defaults: {
                          contextMenu: ({ items, component }) => 
                            commonContextMenuLogic(component, items, 'image'),
                        },
                      },
                    });
                  }
                });
              }
            ],
            canvas: {
              styles: ['/editor.css'],
            },
          }}
        />
      </div>

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
              minHeight: '60px',
              fontStyle: 'italic',
              color: '#475569',
              wordBreak: 'break-word',
            }}>
              {selectedText || 'No text selected'}
            </div>
          </div>

          {/* Tone Selection */}
          <div>
            <Label htmlFor="tone-select">Select Tone:</Label>
            <Select id="tone-select" value={tone} onChange={e => setTone(e.target.value)}>
              <option value="">Choose a tone</option>
              <option value="Professional">Professional</option>
              <option value="Friendly">Friendly</option>
              <option value="Concise">Concise</option>
              <option value="Empathetic">Empathetic</option>
              <option value="Witty">Witty</option>
              <option value="Custom Tone">Custom Tone...</option>
            </Select>
          </div>

          {/* Custom Prompt (conditionally rendered) */}
          {tone === 'Custom Tone' && (
            <div>
              <Label htmlFor="custom-prompt">Custom Prompt:</Label>
              <TextArea
                id="custom-prompt"
                placeholder="e.g., Make this text sound like a pirate."
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <Button variant="secondary" onClick={closeModal} disabled={loadingAI}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleTransform} disabled={loadingAI || !tone || (tone === 'Custom Tone' && !customPrompt.trim())}>
              {loadingAI ? 'Transforming...' : 'Transform'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={imageModalOpen} onClose={closeImageModal} title="Generate Image with AI">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <Label htmlFor="image-prompt">Image Prompt:</Label>
            <TextArea
              id="image-prompt"
              placeholder="Describe the image you want to generate (e.g., 'A futuristic city at sunset, cyberpunk style')"
              value={imagePrompt}
              onChange={e => setImagePrompt(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <Button variant="secondary" onClick={closeImageModal} disabled={loadingAI}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleImageGeneration} disabled={loadingAI || !imagePrompt.trim()}>
              {loadingAI ? 'Generating...' : 'Generate Image'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Editor;