import React, { useEffect, useState } from 'react';
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

function App() {
  const [htmlContent, setHtmlContent] = useState(null);
  const [editorReady, setEditorReady] = useState(null);

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

  // Helper: show a prompt to select tone (simplified)
  const askForTone = () => {
    const tones = ['Formal', 'Humorous', 'Authoritative', 'Inspirational', 'Custom Tone'];
    let toneChoice = prompt(
      `Select tone by entering number:\n${tones
        .map((t, i) => `${i + 1}. ${t}`)
        .join('\n')}`
    );
    if (!toneChoice) return null;

    const index = parseInt(toneChoice, 10) - 1;
    if (index < 0 || index >= tones.length) return null;
    return tones[index];
  };

  // Main transform function
  const handleTransform = async (component) => {
    const originalText = component.view?.el?.innerText || '';
    if (!originalText.trim()) {
      alert('No text to transform.');
      return;
    }

    const selectedTone = askForTone();
    if (!selectedTone) {
      alert('No valid tone selected.');
      return;
    }

    let customPrompt = '';
    if (selectedTone === 'Custom Tone') {
      customPrompt = prompt('Describe how you want the text to be transformed:') || '';
      if (!customPrompt.trim()) {
        alert('Custom prompt is empty. Aborting.');
        return;
      }
    }

    try {
      const response = await fetch('http://localhost:5000/transform-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: originalText,
          tone: selectedTone === 'Custom Tone' ? 'Custom' : selectedTone,
          prompt: customPrompt,
        }),
      });

      if (!response.ok) throw new Error('Server error');

      const data = await response.json();
      const newText = data.transformed || '[Error: Empty response]';

      component.components([{ type: 'text', content: newText }]);
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
                        onClick: () => handleTransform(component),
                      },
                    ],
                  },
                },
              });
            },
          ],
        }}
      />
    </div>
  );
}

export default App;
