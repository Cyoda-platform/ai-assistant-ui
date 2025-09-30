import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Copy, Download, Maximize2, Check } from 'lucide-react';

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
    // Initialize Mermaid with dark theme and smaller font
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      themeVariables: {
        primaryColor: '#0D8484',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#0D8484',
        lineColor: '#64748b',
        sectionBkgColor: '#1e293b',
        altSectionBkgColor: '#334155',
        gridColor: '#475569',
        secondaryColor: '#475569',
        tertiaryColor: '#64748b',
        background: 'transparent',
        mainBkg: '#1e293b',
        secondBkg: '#334155',
        tertiaryBkg: '#475569',
        // Enhanced colors for better visibility
        nodeBkg: '#334155',
        nodeTextColor: '#ffffff',
        edgeLabelBackground: '#1e293b',
        clusterBkg: '#475569',
        clusterBorder: '#0D8484',
        defaultLinkColor: '#0D8484',
        titleColor: '#ffffff',
        activeTaskBkgColor: '#0D8484',
        activeTaskBorderColor: '#ffffff',
        section0: '#1e293b',
        section1: '#334155',
        section2: '#475569',
        section3: '#64748b',
        // Default font size
        fontSize: '16px',
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
        nodeSpacing: 30,
        rankSpacing: 40,
        padding: 10,
      },
      sequence: {
        useMaxWidth: true,
        wrap: true,
      },
      gantt: {
        useMaxWidth: true,
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

          // Style the SVG for better appearance
          const svgElement = elementRef.current.querySelector('svg');
          if (svgElement) {
            svgElement.style.maxWidth = '100%';
            svgElement.style.height = 'auto';
            svgElement.style.background = 'transparent';
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
          className="mermaid-diagram flex justify-center items-center min-h-[150px] max-h-[400px] overflow-auto bg-slate-900/50 border border-slate-600 rounded-lg p-4 max-w-2xl mx-auto"
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
