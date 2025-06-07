import React, { useEffect, useState } from 'react';
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';
import { canvasAbsoluteMode } from '@grapesjs/studio-sdk-plugins';
import './App.css';

// Enhanced Modal Component - moved outside App to prevent re-creation
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

// Enhanced Button Component - moved outside App
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

// Enhanced Input Components - moved outside App
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

function App() {
  const [htmlContent, setHtmlContent] = useState(null);
  const [editorReady, setEditorReady] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Text modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [selectedText, setSelectedText] = useState(''); // Store selected text
  const [selectionInfo, setSelectionInfo] = useState(null); // Store selection details
  const [tone, setTone] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');

  // Image modal state
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageComponent, setSelectedImageComponent] = useState(null);
  const [imagePrompt, setImagePrompt] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    console.log('App component mounted, fetching HTML content...');
    
    // Fetch initial HTML content for the editor
    fetch('http://localhost:5000/generated_output.html')
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
    console.log('HTML content changed:', !!htmlContent);
    console.log('Editor ready:', !!editorReady);
    
    if (htmlContent && editorReady) {
      console.log('Loading project data into editor...');
      try {
        editorReady.loadProjectData({
          pages: [{ name: 'Edit Template', component: htmlContent }],
        });
        console.log('Project data loaded successfully');
      } catch (e) {
        console.error("Error loading project data into GrapesJS:", e);
        setError(e.message);
        try {
          editorReady.setComponents('<div style="color: red;">Error loading content.</div>');
        } catch (e2) {
          console.error("Error setting fallback components:", e2);
        }
      }
    }
  }, [htmlContent, editorReady]);

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

      const response = await fetch('http://localhost:5000/transformText', {
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
      // This ensures the changes are saved in GrapesJS's internal model
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

      const response = await fetch('http://localhost:5000/generateImage', {
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

  const exportToPDF = (editor) => {
    if (!editor) {
      alert("Editor is not ready.");
      return;
    }
    const htmlContent = editor.getHtml();
    const cssContent = editor.getCss();

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Exported Content</title>
        <style>${cssContent}</style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const formData = new FormData();
    formData.append('file', blob, 'newsletter_content.html');

    fetch('/convertToPdf', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { throw new Error(err.error || 'PDF conversion failed') });
      }
      return response.json();
    })
    .then(data => {
      if (data.pdf_path) {
        alert(`PDF converted successfully!`);
        window.open(data.pdf_path, '_blank');
      } else {
        alert(data.error || 'Error converting to PDF: No PDF path returned.');
      }
    })
    .catch(error => {
      console.error('Error during PDF conversion process:', error);
      alert(`An error occurred while converting to PDF: ${error.message}`);
    });
  };

  // Effect to add custom "Export to PDF" button to GrapesJS panel
  useEffect(() => {
    if (editorReady) {
      console.log('Adding export to PDF button...');
      const panels = editorReady.Panels;
      const commandId = 'export-to-pdf-cmd';

      if (!panels.getButton('options', commandId)) {
        panels.addButton('options', {
          id: commandId,
          className: 'fa fa-download',
          label: 'Export PDF',
          command: editor => exportToPDF(editor),
          attributes: { title: 'Export Design to PDF' },
        });
      }
    }
  }, [editorReady]);

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

  console.log('Rendering StudioEditor...');

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
      <StudioEditor
        onReady={editor => {
          console.log('Editor ready callback called:', editor);
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
                        ...existingType.model.defaults,
                        contextMenu: ({ items, component }) => commonContextMenuLogic(component, items, 'image'),
                      },
                    },
                    view: existingType.view
                  });
                }
              });
            },
          ],
        }}
      />

      {/* TEXT MODAL */}
      <Modal isOpen={modalOpen} onClose={closeModal} title="✨ Transform Selected Text with AI">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Show selected text preview */}
          {selectedText && (
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px',
            }}>
              <Label style={{ marginBottom: '8px', color: '#64748b' }}>Selected text:</Label>
              <div style={{
                fontSize: '14px',
                color: '#374151',
                fontStyle: 'italic',
                maxHeight: '80px',
                overflow: 'auto',
                backgroundColor: 'white',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #e2e8f0'
              }}>
                "{selectedText}"
              </div>
            </div>
          )}

          <div>
            <Label>Choose transformation style</Label>
            <Select
              value={tone}
              onChange={e => setTone(e.target.value)}
            >
              <option value="" disabled>Select a tone...</option>
              <option value="Formal">📋 Formal & Professional</option>
              <option value="Humorous">😄 Humorous & Playful</option>
              <option value="Authoritative">💼 Authoritative & Expert</option>
              <option value="Inspirational">🌟 Inspirational & Motivating</option>
              <option value="Custom Tone">🎨 Custom Transformation</option>
            </Select>
          </div>

          {tone === 'Custom Tone' && (
            <div>
              <Label htmlFor="customPrompt">Describe your transformation</Label>
              <TextArea
                id="customPrompt"
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                placeholder="e.g., Make it more concise and witty, or rewrite in a storytelling format..."
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handleTransform}
              disabled={loadingAI || !tone}
            >
              {loadingAI ? (
                <>
                  <span style={{ 
                    width: '16px', 
                    height: '16px', 
                    border: '2px solid rgba(255,255,255,0.3)', 
                    borderTop: '2px solid white', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite' 
                  }}></span>
                  Transforming...
                </>
              ) : (
                <>✨ Transform Selected Text</>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* IMAGE MODAL */}
      <Modal isOpen={imageModalOpen} onClose={closeImageModal} title="🎨 Generate Image with AI">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <Label>Describe your image</Label>
            <TextArea
              value={imagePrompt}
              onChange={e => setImagePrompt(e.target.value)}
              placeholder="A futuristic cityscape at sunset with flying cars, vibrant neon lights reflecting on glass buildings, cyberpunk style..."
              style={{ minHeight: '120px' }}
            />
            <div style={{ 
              fontSize: '12px', 
              color: '#64748b', 
              marginTop: '8px',
              padding: '8px 12px',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              border: '1px solid #e2e8f0'
            }}>
              💡 <strong>Tip:</strong> Be specific and descriptive for better results. Include style, mood, colors, and composition details.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <Button variant="secondary" onClick={closeImageModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleImageGeneration}
              disabled={loadingAI || !imagePrompt.trim()}
            >
              {loadingAI ? (
                <>
                  <span style={{ 
                    width: '16px', 
                    height: '16px', 
                    border: '2px solid rgba(255,255,255,0.3)', 
                    borderTop: '2px solid white', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite' 
                  }}></span>
                  Generating...
                </>
              ) : (
                <>🎨 Generate Image</>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
export default App;