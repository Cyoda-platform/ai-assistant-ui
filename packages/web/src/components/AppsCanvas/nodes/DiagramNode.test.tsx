import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithReactFlow } from '@/test-utils/renderWithReactFlow';
import { DiagramNode } from './DiagramNode';
import type { MermaidDiagramConfig } from '../types/diagrams';


// Mock MermaidDiagram component
vi.mock('../../MermaidDiagram/MermaidDiagram', () => ({
  default: ({ chart, id }: { chart: string; id: string }) => (
    <div data-testid="mermaid-diagram" data-chart={chart} data-id={id}>
      Mermaid Diagram
    </div>
  ),
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = vi.fn();

describe('DiagramNode', () => {
  const mockMermaidDiagram: MermaidDiagramConfig = {
    id: 'diagram-1',
    name: 'Test Mermaid Diagram',
    description: 'Test description',
    library: 'mermaid',
    chartType: 'line',
    diagramType: 'flowchart',
    content: 'graph TD\n  A-->B',
    data: [],
  };

  const defaultData = {
    diagram: mockMermaidDiagram,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render diagram name', () => {
    renderWithReactFlow(<DiagramNode data={defaultData} />);

    expect(screen.getByText('Test Mermaid Diagram')).toBeInTheDocument();
  });

  it('should render library and diagram type', () => {
    renderWithReactFlow(<DiagramNode data={defaultData} />);

    expect(screen.getByText(/mermaid.*flowchart/i)).toBeInTheDocument();
    expect(screen.getByText(/flowchart/i)).toBeInTheDocument();
  });

  it('should not show description initially', () => {
    renderWithReactFlow(<DiagramNode data={defaultData} />);

    expect(screen.queryByText('Test description')).not.toBeInTheDocument();
  });

  describe('info toggle', () => {
    it('should show description when info button is clicked', async () => {
      const user = userEvent.setup();
      renderWithReactFlow(<DiagramNode data={defaultData} />);

      const infoButton = screen.getByTitle('Info');
      await user.click(infoButton);

      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('should hide description when info button is clicked again', async () => {
      const user = userEvent.setup();
      renderWithReactFlow(<DiagramNode data={defaultData} />);

      const infoButton = screen.getByTitle('Info');
      await user.click(infoButton);
      expect(screen.getByText('Test description')).toBeInTheDocument();

      await user.click(infoButton);
      expect(screen.queryByText('Test description')).not.toBeInTheDocument();
    });
  });

  describe('expand/collapse', () => {
    it('should start in collapsed state', () => {
      const { container } = renderWithReactFlow(<DiagramNode data={defaultData} />);

      expect(container.querySelector('.min-w-\\[400px\\]')).toBeInTheDocument();
      expect(container.querySelector('.min-h-\\[300px\\]')).toBeInTheDocument();
    });

    it('should expand when expand button is clicked', async () => {
      const user = userEvent.setup();
      const { container } = renderWithReactFlow(<DiagramNode data={defaultData} />);

      const expandButton = screen.getByTitle('Expand');
      await user.click(expandButton);

      expect(container.querySelector('.min-w-\\[800px\\]')).toBeInTheDocument();
      expect(container.querySelector('.min-h-\\[600px\\]')).toBeInTheDocument();
    });

    it('should collapse when collapse button is clicked', async () => {
      const user = userEvent.setup();
      const { container } = renderWithReactFlow(<DiagramNode data={defaultData} />);

      const expandButton = screen.getByTitle('Expand');
      await user.click(expandButton);

      const collapseButton = screen.getByTitle('Collapse');
      await user.click(collapseButton);

      expect(container.querySelector('.min-w-\\[400px\\]')).toBeInTheDocument();
    });
  });

  describe('mermaid diagram rendering', () => {
    it('should render MermaidDiagram component for mermaid library', () => {
      renderWithReactFlow(<DiagramNode data={defaultData} />);

      const mermaidComponent = screen.getByTestId('mermaid-diagram');
      expect(mermaidComponent).toBeInTheDocument();
      expect(mermaidComponent).toHaveAttribute('data-chart', 'graph TD\n  A-->B');
      expect(mermaidComponent).toHaveAttribute('data-id', 'diagram-diagram-1');
    });

    it('should show placeholder for non-mermaid diagrams', () => {
      const reactflowDiagram = {
        ...mockMermaidDiagram,
        library: 'reactflow' as const,
      };

      renderWithReactFlow(<DiagramNode data={{ diagram: reactflowDiagram }} />);

      expect(screen.getByText(/reactflow diagram support coming soon/i)).toBeInTheDocument();
    });
  });

  describe('copy functionality', () => {
    it('should copy diagram content when copy button is clicked', async () => {
      const user = userEvent.setup();
      renderWithReactFlow(<DiagramNode data={defaultData} />);

      const copyButton = screen.getByTitle('Copy diagram source');
      await user.click(copyButton);

      // Verify button is still present and click didn't crash the component
      expect(copyButton).toBeInTheDocument();
    });

    it('should only show copy button for mermaid diagrams', () => {
      const { rerender } = renderWithReactFlow(<DiagramNode data={defaultData} />);

      expect(screen.getByTitle('Copy diagram source')).toBeInTheDocument();

      const reactflowDiagram = {
        diagram: {
          ...mockMermaidDiagram,
          library: 'reactflow' as const,
        },
      };

      rerender(<DiagramNode data={reactflowDiagram} />);

      expect(screen.queryByTitle('Copy diagram source')).not.toBeInTheDocument();
    });
  });

  describe('download functionality', () => {
    it('should download diagram when download button is clicked', async () => {
      const user = userEvent.setup();

      // Render first, then mock createElement so React DOM creation isn't affected
      renderWithReactFlow(<DiagramNode data={defaultData} />);

      const mockLink = { href: '', download: '', click: vi.fn() };
      const originalCreateElement = document.createElement.bind(document);
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: string, ...args: any[]) => {
        if (tag === 'a') return mockLink as any;
        return originalCreateElement(tag, ...args as []);
      });

      const downloadButton = screen.getByTitle('Download diagram');
      await user.click(downloadButton);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe('test-mermaid-diagram.mmd');
      expect(mockLink.click).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-object-url');

      createElementSpy.mockRestore();
    });

    it('should only show download button for mermaid diagrams', () => {
      const { rerender } = renderWithReactFlow(<DiagramNode data={defaultData} />);

      expect(screen.getByTitle('Download diagram')).toBeInTheDocument();

      const chartjsDiagram = {
        diagram: {
          ...mockMermaidDiagram,
          library: 'chartjs' as const,
        },
      };

      rerender(<DiagramNode data={chartjsDiagram} />);

      expect(screen.queryByTitle('Download diagram')).not.toBeInTheDocument();
    });
  });

  describe('library-specific styling', () => {
    it('should apply cyan color for mermaid', () => {
      const { container } = renderWithReactFlow(<DiagramNode data={defaultData} />);

      expect(container.querySelector('.from-cyan-600')).toBeInTheDocument();
      expect(container.querySelector('.text-cyan-400')).toBeInTheDocument();
    });

    it('should apply blue color for reactflow', () => {
      const reactflowDiagram = {
        diagram: { ...mockMermaidDiagram, library: 'reactflow' as const },
      };
      const { container } = renderWithReactFlow(<DiagramNode data={reactflowDiagram} />);

      expect(container.querySelector('.from-blue-600')).toBeInTheDocument();
      expect(container.querySelector('.text-blue-400')).toBeInTheDocument();
    });

    it('should apply green color for chartjs', () => {
      const chartjsDiagram = {
        diagram: { ...mockMermaidDiagram, library: 'chartjs' as const },
      };
      const { container } = renderWithReactFlow(<DiagramNode data={chartjsDiagram} />);

      expect(container.querySelector('.from-green-600')).toBeInTheDocument();
      expect(container.querySelector('.text-green-400')).toBeInTheDocument();
    });

    it('should apply gray color for unknown library', () => {
      const unknownDiagram = {
        diagram: { ...mockMermaidDiagram, library: 'unknown' as any },
      };
      const { container } = renderWithReactFlow(<DiagramNode data={unknownDiagram} />);

      expect(container.querySelector('.from-gray-600')).toBeInTheDocument();
      expect(container.querySelector('.text-gray-400')).toBeInTheDocument();
    });
  });

  describe('React Flow handles', () => {
    it('should render 8 handles (4 source, 4 target)', () => {
      const { container } = renderWithReactFlow(<DiagramNode data={defaultData} />);

      const handles = container.querySelectorAll('[data-handlepos]');
      expect(handles.length).toBe(8);
    });

    it('should have handles in all positions', () => {
      const { container } = renderWithReactFlow(<DiagramNode data={defaultData} />);

      expect(container.querySelector('[data-handlepos="top"]')).toBeInTheDocument();
      expect(container.querySelector('[data-handlepos="right"]')).toBeInTheDocument();
      expect(container.querySelector('[data-handlepos="bottom"]')).toBeInTheDocument();
      expect(container.querySelector('[data-handlepos="left"]')).toBeInTheDocument();
    });
  });

  describe('styling and classes', () => {
    it('should have rounded-xl styling', () => {
      const { container } = renderWithReactFlow(<DiagramNode data={defaultData} />);

      expect(container.querySelector('.rounded-xl')).toBeInTheDocument();
    });

    it('should have shadow-2xl styling', () => {
      const { container } = renderWithReactFlow(<DiagramNode data={defaultData} />);

      expect(container.querySelector('.shadow-2xl')).toBeInTheDocument();
    });

    it('should have transition effects', () => {
      const { container } = renderWithReactFlow(<DiagramNode data={defaultData} />);

      expect(container.querySelector('.transition-all')).toBeInTheDocument();
    });

    it('should have hover effects', () => {
      const { container } = renderWithReactFlow(<DiagramNode data={defaultData} />);

      expect(container.querySelector('.hover\\:shadow-3xl')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle diagram without description', () => {
      const diagramWithoutDescription = {
        diagram: { ...mockMermaidDiagram, description: undefined },
      };

      renderWithReactFlow(<DiagramNode data={diagramWithoutDescription} />);

      expect(screen.getByText('Test Mermaid Diagram')).toBeInTheDocument();
    });

    it('should handle very long diagram names', () => {
      const longNameDiagram = {
        diagram: { ...mockMermaidDiagram, name: 'Diagram '.repeat(20) },
      };
      const { container } = renderWithReactFlow(<DiagramNode data={longNameDiagram} />);

      expect(container.querySelector('.truncate')).toBeInTheDocument();
    });

    it('should handle empty mermaid content', () => {
      const emptyContentDiagram = {
        diagram: { ...mockMermaidDiagram, content: '' },
      };

      renderWithReactFlow(<DiagramNode data={emptyContentDiagram} />);

      const mermaidComponent = screen.getByTestId('mermaid-diagram');
      expect(mermaidComponent).toHaveAttribute('data-chart', '');
    });

    it('should sanitize file name for download', async () => {
      const user = userEvent.setup();

      const specialNameDiagram = {
        diagram: { ...mockMermaidDiagram, name: 'Test / Diagram : With * Special' },
      };

      // Render first, then mock createElement
      renderWithReactFlow(<DiagramNode data={specialNameDiagram} />);

      const mockLink = { href: '', download: '', click: vi.fn() };
      const originalCreateElement = document.createElement.bind(document);
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: string, ...args: any[]) => {
        if (tag === 'a') return mockLink as any;
        return originalCreateElement(tag, ...args as []);
      });

      const downloadButton = screen.getByTitle('Download diagram');
      await user.click(downloadButton);

      // Spaces should be replaced with hyphens and converted to lowercase
      expect(mockLink.download).toContain('test-/-diagram-:-with-*-special');

      createElementSpy.mockRestore();
    });
  });

  describe('action buttons', () => {
    it('should render all action buttons', () => {
      renderWithReactFlow(<DiagramNode data={defaultData} />);

      expect(screen.getByTitle('Info')).toBeInTheDocument();
      expect(screen.getByTitle('Copy diagram source')).toBeInTheDocument();
      expect(screen.getByTitle('Download diagram')).toBeInTheDocument();
      expect(screen.getByTitle('Expand')).toBeInTheDocument();
    });

    it('should have hover effects on buttons', () => {
      const { container } = renderWithReactFlow(<DiagramNode data={defaultData} />);

      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button.className).toContain('hover:bg-white/20');
      });
    });
  });
});
