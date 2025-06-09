import React, { useEffect, useState, useRef } from 'react';
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';
import { canvasAbsoluteMode } from '@grapesjs/studio-sdk-plugins';
import './editor.css';

// Move components outside to prevent re-creation
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
            <button onClick={onClose} style={{
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
            }}>
              ×
            </button>
          </div>
        </div>
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
    >
      {children}
    </button>
  );
};

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
  const [htmlContent, setHtmlContent] = useState('');
  const [editorReady, setEditorReady] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const editorRef = useRef(null);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectionInfo, setSelectionInfo] = useState(null);
  const [tone, setTone] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageComponent, setSelectedImageComponent] = useState(null);
  const [imagePrompt, setImagePrompt] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  // Fetch initial content
  useEffect(() => {
    console.log('Fetching HTML content...');
    
    fetch('/api/generated_output.html')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.text();
      })
      .then(html => {
        console.log('HTML content received');
        setHtmlContent(html);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch initial HTML content:", err);
        // Fallback content
        const fallbackContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: #f5f5f5; 
              }
              .container { 
                max-width: 800px; 
                margin: 0 auto; 
                background: white; 
                padding: 40px; 
                border-radius: 8px; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
              }
              h1 { color: #333; margin-bottom: 20px; }
              p { line-height: 1.6; color: #666; }
              img { max-width: 100%; height: auto; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Welcome to the Editor</h1>
              <p>This is a sample template. You can edit this content using the visual editor.</p>
              <img src="https://picsum.photos/600/300" alt="Sample Image" />
              <p>Click on any text to edit it, or right-click for AI-powered transformations.</p>
            </div>
          </body>
          </html>
        `;
        setHtmlContent(fallbackContent);
        setError('Using fallback content - could not load template');
        setLoading(false);
      });
  }, []);

  // Handle editor initialization
  const handleEditorReady = (editor) => {
    console.log('Editor ready callback called');
    setEditorReady(editor);
    
    // Set project data if we have content
    if (htmlContent) {
      try {
        editor.loadProjectData({
          pages: [
            {
              name: 'Main Page',
              component: htmlContent,
            }
          ]
        });
        console.log('Project data loaded successfully');
      } catch (e) {
        console.error('Error loading project data:', e);
        setError('Error loading content into editor');
      }
    }
  };

  // Load content into editor when both are ready
  useEffect(() => {
    if (editorReady && htmlContent && !loading) {
      console.log('Loading content into ready editor...');
      try {
        editorReady.loadProjectData({
          pages: [
            {
              name: 'Main Page', 
              component: htmlContent,
            }
          ]
        });
      } catch (e) {
        console.error('Error in useEffect loading:', e);
        setError('Error loading content');
      }
    }
  }, [editorReady, htmlContent, loading]);

  // Modal handlers
  const openModal = (component) => {
    const iframe = editorReady?.Canvas?.getFrameEl();
    if (!iframe) {
      alert('Editor not ready');
      return;
    }

    const doc = iframe.contentDocument;
    const selection = doc.getSelection();
    
    if (!selection || selection.rangeCount === 0 || !selection.toString().trim()) {
      alert('Please select some text first');
      return;
    }

    const range = selection.getRangeAt(0);
    setSelectedComponent(component);
    setSelectedText(selection.toString());
    setSelectionInfo({
      text: selection.toString(),
      range: range.cloneRange(),
      startContainer: range.startContainer,
      endContainer: range.endContainer,
      startOffset: range.startOffset,
      endOffset: range.endOffset
    });
    setTone('');
    setCustomPrompt('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedComponent(null);
    setSelectedText('');
    setSelectionInfo(null);
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
    if (!selectedComponent || !selectionInfo || !tone) {
      alert('Missing required information');
      return;
    }

    if (tone === 'Custom Tone' && !customPrompt.trim()) {
      alert('Please enter custom instructions');
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

      if (!response.ok) throw new Error('Server error');

      const data = await response.json();
      const newText = data.transformed || 'Error: No response';

      // Replace text in component
      const componentEl = selectedComponent.getEl();
      if (componentEl) {
        const currentHTML = componentEl.innerHTML;
        const updatedHTML = currentHTML.replace(selectedText, newText);
        componentEl.innerHTML = updatedHTML;
        selectedComponent.components(updatedHTML);
      }

      closeModal();
    } catch (err) {
      console.error('Transform error:', err);
      alert('Failed to transform text: ' + err.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleImageGeneration = async () => {
    if (!selectedImageComponent || !imagePrompt.trim()) {
      alert('Missing image component or prompt');
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
      const dataUrl = `data:${mime_type};base64,${image_base64}`;

      selectedImageComponent.addAttributes({ src: dataUrl });
      closeImageModal();
    } catch (err) {
      console.error('Image generation error:', err);
      alert('Image generation failed: ' + err.message);
    } finally {
      setLoadingAI(false);
    }
  };

  // Error state
  if (error && !htmlContent) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: 'red',
        fontFamily: 'Arial, sans-serif' 
      }}>
        <h2>Error Loading Editor</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
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

  console.log('Rendering StudioEditor with content:', !!htmlContent);

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <div style={{ height: '100%', width: '100%' }}>
        <StudioEditor
          ref={editorRef}
          onReady={handleEditorReady}
          options={{
            height: '100vh',
            width: '100%',
            project: {
              default: {
                pages: [
                  {
                    name: 'Main Page',
                    component: htmlContent,
                  }
                ]
              }
            },
            plugins: [
              canvasAbsoluteMode,
              (editor) => {
                // Context menu plugin
                const addContextMenu = (component, items, actionType) => {
                  const handler = actionType === 'text' ? openModal : openImageModal;
                  const label = actionType === 'text' ? 'Transform Text (AI)' : 'Replace Image (AI)';
                  
                  return [
                    ...items,
                    {
                      id: `ai-${actionType}-${component.getId()}`,
                      label: label,
                      onClick: () => handler(component),
                    },
                  ];
                };

                // Add context menus to component types
                editor.Components.addType('text', {
                  model: {
                    defaults: {
                      contextMenu: ({ items, component }) => addContextMenu(component, items, 'text'),
                    },
                  },
                });

                editor.Components.addType('image', {
                  model: {
                    defaults: {
                      contextMenu: ({ items, component }) => addContextMenu(component, items, 'image'),
                    },
                  },
                });
              }
            ],
            canvas: {
              styles: [
                'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
              ],
            },
          }}
        />
      </div>

      {/* Text Transformation Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title="Transform Text with AI">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <Label>Selected Text:</Label>
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#475569',
              fontStyle: 'italic',
              maxHeight: '100px',
              overflowY: 'auto'
            }}>
              "{selectedText}"
            </div>
          </div>

          <div>
            <Label>Choose Tone:</Label>
            <Select value={tone} onChange={e => setTone(e.target.value)}>
              <option value="">Select a tone</option>
              <option value="Professional">Professional</option>
              <option value="Friendly">Friendly</option>
              <option value="Casual">Casual</option>
              <option value="Formal">Formal</option>
              <option value="Excited">Excited</option>
              <option value="Persuasive">Persuasive</option>
              <option value="Humorous">Humorous</option>
              <option value="Custom Tone">Custom Tone</option>
            </Select>
          </div>

          {tone === 'Custom Tone' && (
            <div>
              <Label>Custom Instructions:</Label>
              <TextArea
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                placeholder="Describe how you want the text to be transformed..."
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleTransform}
              disabled={loadingAI || !tone}
            >
              {loadingAI ? 'Transforming...' : 'Transform Text'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Image Generation Modal */}
      <Modal isOpen={imageModalOpen} onClose={closeImageModal} title="Generate New Image with AI">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <Label>Image Description:</Label>
            <TextArea
              value={imagePrompt}
              onChange={e => setImagePrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              style={{ minHeight: '120px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button variant="secondary" onClick={closeImageModal}>
              Cancel
            </Button>
            <Button 
              variant="success" 
              onClick={handleImageGeneration}
              disabled={loadingAI || !imagePrompt.trim()}
            >
              {loadingAI ? 'Generating...' : 'Generate Image'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Editor;