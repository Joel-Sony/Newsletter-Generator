// src/components/GrapesEditor.jsx
import React, { useEffect } from 'react';
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';
import { layoutSidebarButtons } from '@grapesjs/studio-sdk-plugins';

const GrapesEditor = () => {
  useEffect(() => {
    fetch('/generated')
      .then(res => res.text())
      .then(data => {
        const styleMatch = data.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
        const htmlBody = data.replace(/<style[^>]*>[\s\S]*?<\/style>/i, '').trim();

        window.initialHtml = htmlBody;
        window.initialCss = styleMatch ? styleMatch[1] : '';
      });
  }, []);

  return (
    <div style={{ height: '100vh' }}>
      <StudioEditor
        options={{
          height: '100%',
          width: 'auto',
          fromElement: false,
          components: window.initialHtml || '',
          style: window.initialCss || '',
          plugins: [
            layoutSidebarButtons.init({
              sidebarButton({ id, buttonProps, breakpoint, createSidebarButton }) {
                if (breakpoint) return buttonProps;
                if (id === 'panelBlocks') {
                  return createSidebarButton({
                    layoutComponent: {
                      type: 'panelBlocks',
                      blocks: ({ blocks }) => blocks.filter(b => b.category?.getLabel() === 'Basic'),
                    },
                  });
                } else if (id === 'panelPagesLayers') {
                  return createSidebarButton({
                    label: 'Layers',
                    layoutComponent: { type: 'panelLayers' },
                  });
                }
                return buttonProps;
              },
            }),
          ],
        }}
      />
      <div style={{ position: 'absolute', top: 10, right: 10 }}>
        <button
          onClick={() => {
            const html = window.editor.getHtml();
            const css = window.editor.getCss();
            const blob = new Blob(
              [`<html><head><style>${css}</style></head><body>${html}</body></html>`],
              { type: 'text/html' }
            );
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'newsletter.html';
            link.click();
          }}
        >
          Export HTML
        </button>
        <button
          style={{ marginLeft: 10 }}
          onClick={() => {
            const win = window.open('', '', 'width=800,height=1000');
            win.document.write(
              `<html><head><style>${window.editor.getCss()}</style></head><body>${window.editor.getHtml()}</body></html>`
            );
            win.document.close();
            win.focus();
            win.print();
          }}
        >
          Save as PDF
        </button>
      </div>
    </div>
  );
};

export default GrapesEditor;
