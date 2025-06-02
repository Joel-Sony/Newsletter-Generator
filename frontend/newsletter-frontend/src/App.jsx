import React, { useEffect, useState } from 'react';
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';
import { layoutSidebarButtons } from '@grapesjs/studio-sdk-plugins';

function App() {
  const [htmlContent, setHtmlContent] = useState(null);
  const [editorReady, setEditorReady] = useState(null);

  // Load HTML content from Flask
  useEffect(() => {
    fetch('http://localhost:5000/generated_output.html')
      .then(res => res.text())
      .then(setHtmlContent)
      .catch(console.error);
  }, []);

  // Load HTML into editor when it's ready
  useEffect(() => {
    if (htmlContent && editorReady) {
      editorReady.loadProjectData({
        pages: [
          { name: 'Edit Template', component: htmlContent },
        ],
      });
    }
  }, [htmlContent, editorReady]);

  return (
    <div style={{ height: '100vh' }}>
      <StudioEditor
        onReady={setEditorReady} // Fires when the editor is fully initialized
        options={{
          storage: false, // Disable local persistence
          project: {
            type: 'web',
            default: {
              pages: [{ name: 'Placeholder', component: '<h1>Loading...</h1>' }],
            },
          },
          plugins: [layoutSidebarButtons],
        }}
      />
    </div>
  );
}

export default App;
