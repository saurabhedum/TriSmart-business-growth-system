import React from 'react';


// @ts-ignore
import rawHtml from '../assets/workflows.html?raw';
const workflowsHtml = rawHtml;

export const WorkflowsView = () => {
    const [htmlContent, setHtmlContent] = React.useState(workflowsHtml);
  
    React.useEffect(() => {
      const style = getComputedStyle(document.documentElement);
      const bg = style.getPropertyValue('--bg-color').trim() || '#0a0d14';
      const fg = style.getPropertyValue('--text-color').trim() || '#f1f5f9';
      const accent = style.getPropertyValue('--accent').trim() || '#3b82f6';
      const muted = style.getPropertyValue('--text-muted').trim() || '#94a3b8';
      const border = style.getPropertyValue('--border-color').trim() || 'rgba(255,255,255,0.08)';
      
      const glass = 'rgba(128, 128, 128, 0.05)';
      const glassHover = 'rgba(128, 128, 128, 0.08)';
      const glassOpen = 'rgba(128, 128, 128, 0.1)';
  
      const injectedHtml = workflowsHtml.replace(
        ':root {',
        ':root { \n' +
        '  --bg: ' + bg + ';\n' +
        '  --text-primary: ' + fg + ';\n' +
        '  --text-secondary: ' + fg + ';\n' +
        '  --text-muted: ' + muted + ';\n' +
        '  --border: ' + border + ';\n' +
        '  --border-hover: ' + accent + ';\n' +
        '  --glass: ' + glass + ';\n' +
        '  --glass-hover: ' + glassHover + ';\n' +
        '  --glass-open: ' + glassOpen + ';\n' +
        '  --accent-blue: ' + accent + ';\n' +
        '  --accent-purple: ' + accent + ';\n' +
        '  --accent-cyan: ' + accent + ';\n' +
        '  --accent-emerald: ' + accent + ';\n' +
        '  --accent-amber: ' + accent + ';\n' +
        '  --accent-rose: ' + accent + ';\n' +
        '  --accent-indigo: ' + accent + ';'
      );
      
      setHtmlContent(injectedHtml);
    }, []);
  
    return (
      <div className="w-full h-full bg-[var(--bg-color)] overflow-hidden flex flex-col relative rounded-tl-2xl border-l border-t border-[var(--border-color)] shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
        <div className="flex-1 w-full h-full p-0">
          <iframe
            srcDoc={htmlContent}
            className="w-full h-full border-none outline-none"
            title="Workflows Preview"
            sandbox="allow-scripts allow-same-origin"
            style={{ background: 'var(--bg-color)' }}
          />
        </div>
      </div>
    );
  };
