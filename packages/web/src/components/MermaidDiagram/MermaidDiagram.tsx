import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Copy, Download, Maximize2, Check } from 'lucide-react';
import './MermaidDiagram.css';

interface MermaidDiagramProps {
  chart: string;
  id?: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart, id }) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    // Initialize Mermaid with dark theme similar to Mermaid Live
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      themeVariables: {
        // Primary colors - using teal/cyan for better visibility
        primaryColor: '#14b8a6',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#0d9488',

        // Line and edge colors
        lineColor: '#94a3b8',

        // Background colors
        background: 'transparent',
        mainBkg: '#0f172a',
        secondBkg: '#1e293b',
        tertiaryBkg: '#334155',

        // Node styling
        nodeBkg: '#1e293b',
        nodeBorder: '#0d9488',
        nodeTextColor: '#f1f5f9',

        // Cluster/subgraph styling
        clusterBkg: '#0f172a',
        clusterBorder: '#0d9488',

        // Edge labels
        edgeLabelBackground: '#1e293b',
        edgeLabelText: '#f1f5f9',

        // Link colors
        defaultLinkColor: '#0d9488',

        // Text colors
        titleColor: '#ffffff',
        textColor: '#f1f5f9',

        // Section colors (for gantt, etc)
        sectionBkgColor: '#1e293b',
        altSectionBkgColor: '#334155',
        sectionBkgColor2: '#475569',

        // Task colors
        activeTaskBkgColor: '#0d9488',
        activeTaskBorderColor: '#14b8a6',
        doneTaskBkgColor: '#475569',
        doneTaskBorderColor: '#64748b',
        critBkgColor: '#dc2626',
        critBorderColor: '#ef4444',

        // Grid
        gridColor: '#475569',

        // Font size
        fontSize: '14px',
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
        nodeSpacing: 50,
        rankSpacing: 50,
        padding: 15,
        diagramPadding: 8,
      },
      sequence: {
        useMaxWidth: true,
        wrap: true,
        diagramMarginX: 50,
        diagramMarginY: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35,
      },
      gantt: {
        useMaxWidth: true,
        leftPadding: 75,
        gridLineStartPadding: 35,
        fontSize: 11,
        sectionFontSize: 11,
      },
      journey: {
        useMaxWidth: true,
      },
      timeline: {
        useMaxWidth: true,
      },
      gitgraph: {
        useMaxWidth: true,
      },
      c4: {
        useMaxWidth: true,
      },
      sankey: {
        useMaxWidth: true,
      },
      xyChart: {
        useMaxWidth: true,
      },
      requirement: {
        useMaxWidth: true,
      },
      mindmap: {
        useMaxWidth: true,
        padding: 10,
      },
      pie: {
        useMaxWidth: true,
      },
      quadrantChart: {
        useMaxWidth: true,
      },
      er: {
        useMaxWidth: true,
      },
      class: {
        useMaxWidth: true,
      },
      state: {
        useMaxWidth: true,
      },
    });
  }, []);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!elementRef.current || !chart.trim()) return;

      try {
        const diagramId = id || `mermaid-${Math.random().toString(36).substr(2, 9)}`;

        // Clear previous content
        elementRef.current.innerHTML = '';

        // Render the diagram
        const { svg } = await mermaid.render(diagramId, chart);
        setSvgContent(svg);

        if (elementRef.current) {
          elementRef.current.innerHTML = svg;

          // Style the SVG for better appearance - similar to Mermaid Live
          const svgElement = elementRef.current.querySelector('svg');
          if (svgElement) {
            svgElement.style.maxWidth = '100%';
            svgElement.style.height = 'auto';
            svgElement.style.background = 'transparent';
            svgElement.style.display = 'block';
            svgElement.style.margin = '0 auto';

            // Improve text rendering
            const textElements = svgElement.querySelectorAll('text');
            textElements.forEach((text) => {
              text.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            });
          }
        }
      } catch (error) {
        console.error('Error rendering Mermaid diagram:', error);
        if (elementRef.current) {
          elementRef.current.innerHTML = `
            <div class="text-red-400 p-4 border border-red-500/30 rounded-lg bg-red-500/10">
              <p class="font-medium">Error rendering diagram</p>
              <p class="text-sm text-red-300 mt-1">${error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          `;
        }
      }
    };

    renderDiagram();
  }, [chart, id]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(chart);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy diagram source:', err);
    }
  };

  const handleDownload = () => {
    if (!svgContent) return;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mermaid-diagram-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <>
      <div className="relative group">
        {/* Diagram Container */}
        <div
          ref={elementRef}
          className="mermaid-diagram flex justify-center items-center min-h-[200px] overflow-auto bg-slate-900/30 border border-slate-600/50 rounded-lg p-6"
          style={{
            maxHeight: 'none',
          }}
        />

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handleCopy}
            className="p-1.5 bg-slate-800/80 backdrop-blur-sm border border-slate-600 rounded-md text-slate-300 hover:text-white hover:bg-slate-700/80 transition-all duration-200"
            title="Copy diagram source"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 bg-slate-800/80 backdrop-blur-sm border border-slate-600 rounded-md text-slate-300 hover:text-white hover:bg-slate-700/80 transition-all duration-200"
            title="Download as SVG"
          >
            <Download size={14} />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 bg-slate-800/80 backdrop-blur-sm border border-slate-600 rounded-md text-slate-300 hover:text-white hover:bg-slate-700/80 transition-all duration-200"
            title="View fullscreen"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-7xl max-h-full w-full h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Mermaid Diagram</h3>
              <button
                onClick={toggleFullscreen}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Diagram */}
            <div className="flex-1 bg-slate-900/50 border border-slate-600 rounded-lg p-6 overflow-auto">
              <div className="flex justify-center items-center h-full">
                <div dangerouslySetInnerHTML={{ __html: svgContent }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MermaidDiagram;
