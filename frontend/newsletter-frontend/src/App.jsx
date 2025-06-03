import React, { useEffect, useState } from 'react';
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

function App() {
  const [htmlContent, setHtmlContent] = useState(null);
  const [editorReady, setEditorReady] = useState(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [tone, setTone] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/generated_output.html')
      .then(res => res.text())
      .then(setHtmlContent)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (htmlContent && editorReady) {
      editorReady.loadProjectData({
        pages: [{ name: 'Edit Template', component: htmlContent }],
      });
    }
  }, [htmlContent, editorReady]);

  const openModal = (component) => {
    setSelectedComponent(component);
    setTone('');
    setCustomPrompt('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedComponent(null);
  };

  const handleTransform = async () => {
    if (!selectedComponent) return;

    const originalText = selectedComponent.view?.el?.innerText || '';
    if (!originalText.trim()) {
      alert('No text to transform.');
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
      const response = await fetch('http://localhost:5000/transformText', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: originalText,
          tone: tone === 'Custom Tone' ? 'Custom' : tone,
          prompt: customPrompt,
        }),
      });

      if (!response.ok) throw new Error('Server error');

      const data = await response.json();
      const newText = data.transformed || '[Error: Empty response]';

      selectedComponent.components([{ type: 'text', content: newText }]);
      closeModal();
    } catch (err) {
      alert('Failed to transform text: ' + err.message);
    }
  };

  return (
    <div style={{ height: '100vh' }}>
      <StudioEditor
        onReady={editor => setEditorReady(editor)}
        options={{
          project: {
            default: {
              pages: [
                {
                  name: 'Home',
                  component: `
                    <div style="padding: 20px; max-width: 400px; margin: 0 auto; display: flex; flex-direction: column;">
                      <h1 style="font-size: 3rem">Heading component</h1>
                      <div style="margin: 20px 0; font-size: 2rem">Text component</div>
                      <img src="https://picsum.photos/seed/image1/300/300"/>
                    </div>
                  `,
                },
              ],
            },
          },
          plugins: [
            editor => {
              editor.Components.addType('text', {
                model: {
                  defaults: {
                    contextMenu: ({ items, component }) => [
                      ...items,
                      {
                        id: 'transformTextAI',
                        label: 'Transform Text (AI)',
                        icon: 'sparkles',
                        onClick: () => openModal(component),
                      },
                    ],
                  },
                },
              });
            },
            editor => {
              // TEXT component transformation
              editor.Components.addType('text', {
                model: {
                  defaults: {
                    contextMenu: ({ items, component }) => [
                      ...items,
                      {
                        id: 'transformTextAI',
                        label: 'Transform Text (AI)',
                        icon: 'sparkles',
                        onClick: () => openModal(component),
                      },
                    ],
                  },
                },
              });

              // IMAGE component right-click actions
              editor.Components.addType('image', {
                model: {
                  defaults: {
                    contextMenu: ({ items, component }) => [
                      ...items,
                      {
                        id: 'replaceImageAI',
                        label: 'Replace Image (AI)',
                        icon: 'image',
                        onClick: () => {
                          alert('This is where your AI image replacement/modal can go.');
                          // TODO: Trigger image picker or modal
                        },
                      },
                    ],
                  },
                },
              });
            },
          ],
        }}
      />

      {/* Modal Overlay */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
          onClick={closeModal}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 8,
              padding: 20,
              width: 320,
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <h3 style={{ margin: 0 }}>Select Tone</h3>
            <select
              value={tone}
              onChange={e => setTone(e.target.value)}
              style={{ padding: 8, fontSize: 16 }}
            >
              <option value="" disabled>
                -- Choose a tone --
              </option>
              <option value="Formal">Formal</option>
              <option value="Humorous">Humorous</option>
              <option value="Authoritative">Authoritative</option>
              <option value="Inspirational">Inspirational</option>
              <option value="Custom Tone">Custom Tone</option>
            </select>

            {tone === 'Custom Tone' && (
              <>
                <label htmlFor="customPrompt">Describe how to transform:</label>
                <textarea
                  id="customPrompt"
                  rows={4}
                  value={customPrompt}
                  onChange={e => setCustomPrompt(e.target.value)}
                  style={{ padding: 8, fontSize: 14, resize: 'vertical' }}
                  placeholder="Enter your custom transformation instructions"
                />
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
              <button onClick={closeModal} style={{ padding: '6px 12px' }}>
                Cancel
              </button>
              <button
                onClick={handleTransform}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#4CAF50',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  borderRadius: 4,
                }}
              >
                Transform
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
