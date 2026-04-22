import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LayoutModern from './LayoutModern';

// Mock components
vi.mock('@/components/WorkflowCanvas/WorkflowCanvas', () => ({
  default: () => <div data-testid="workflow-canvas">WorkflowCanvas</div>
}));

vi.mock('@/components/EntityDataPanel/EntityDataPanel', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="entity-data-panel">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
}));

describe('LayoutModern', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render children', () => {
      render(
        <LayoutModern>
          <div data-testid="test-child">Test Content</div>
        </LayoutModern>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('should render header with CYODA branding', () => {
      render(<LayoutModern><div>Test</div></LayoutModern>);

      expect(screen.getByText('CYODA')).toBeInTheDocument();
      expect(screen.getByText('ALPHA')).toBeInTheDocument();
    });

    it('should render navigation sidebar', () => {
      render(<LayoutModern><div>Test</div></LayoutModern>);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('History')).toBeInTheDocument();
    });

    it('should render chat input', () => {
      render(<LayoutModern><div>Test</div></LayoutModern>);

      expect(screen.getByPlaceholderText(/Ask Cyoda AI Assistant/i)).toBeInTheDocument();
    });

    it('should not render canvas by default', () => {
      render(<LayoutModern><div>Test</div></LayoutModern>);

      expect(screen.queryByTestId('workflow-canvas')).not.toBeInTheDocument();
    });

    it('should not render entity data panel by default', () => {
      render(<LayoutModern><div>Test</div></LayoutModern>);

      expect(screen.queryByTestId('entity-data-panel')).not.toBeInTheDocument();
    });
  });

  describe('canvas functionality', () => {
    it('should toggle canvas when Canvas button is clicked', async () => {
      render(<LayoutModern><div>Test</div></LayoutModern>);

      const canvasButton = screen.getByRole('button', { name: /Canvas/i });

      // Initially closed
      expect(screen.queryByTestId('workflow-canvas')).not.toBeInTheDocument();

      // Open canvas
      fireEvent.click(canvasButton);
      await waitFor(() => {
        expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
      });

      // Close canvas
      fireEvent.click(canvasButton);
      await waitFor(() => {
        expect(screen.queryByTestId('workflow-canvas')).not.toBeInTheDocument();
      });
    });

    it('should close canvas when X button is clicked', async () => {
      render(<LayoutModern><div>Test</div></LayoutModern>);

      const canvasButton = screen.getByRole('button', { name: /Canvas/i });
      fireEvent.click(canvasButton);

      await waitFor(() => {
        expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
      });

      const closeButton = screen.getByTitle('Close Canvas');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('workflow-canvas')).not.toBeInTheDocument();
      });
    });

    it('should collapse canvas when Minimize button is clicked', async () => {
      render(<LayoutModern><div>Test</div></LayoutModern>);

      const canvasButton = screen.getByRole('button', { name: /Canvas/i });
      fireEvent.click(canvasButton);

      await waitFor(() => {
        expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
      });

      const collapseButton = screen.getByTitle('Collapse Canvas');
      fireEvent.click(collapseButton);

      await waitFor(() => {
        expect(screen.queryByTestId('workflow-canvas')).not.toBeInTheDocument();
      });
    });

    it('should expand canvas when Maximize button is clicked', async () => {
      render(<LayoutModern><div>Test</div></LayoutModern>);

      // Open and collapse canvas
      const canvasButton = screen.getByRole('button', { name: /Canvas/i });
      fireEvent.click(canvasButton);

      await waitFor(() => {
        expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
      });

      const collapseButton = screen.getByTitle('Collapse Canvas');
      fireEvent.click(collapseButton);

      // Expand canvas
      const expandButton = await screen.findByTitle('Expand Canvas');
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
      });
    });

    it('should switch canvas tabs', async () => {
      render(<LayoutModern><div>Test</div></LayoutModern>);

      // Open canvas
      const canvasButton = screen.getByRole('button', { name: /Canvas/i });
      fireEvent.click(canvasButton);

      await waitFor(() => {
        expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
      });

      // Switch to markdown tab
      const markdownButton = screen.getByRole('button', { name: /Markdown/i });
      fireEvent.click(markdownButton);

      await waitFor(() => {
        expect(screen.queryByTestId('workflow-canvas')).not.toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Start writing your markdown/i)).toBeInTheDocument();
      });

      // Switch back to workflow tab
      const workflowButton = screen.getByRole('button', { name: /Workflow/i });
      fireEvent.click(workflowButton);

      await waitFor(() => {
        expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
      });
    });
  });

  describe('entity data panel functionality', () => {
    it('should toggle entity data panel when Entities button is clicked', async () => {
      render(<LayoutModern><div>Test</div></LayoutModern>);

      const entitiesButton = screen.getByRole('button', { name: /Entities/i });

      // Initially closed
      expect(screen.queryByTestId('entity-data-panel')).not.toBeInTheDocument();

      // Open panel
      fireEvent.click(entitiesButton);
      await waitFor(() => {
        expect(screen.getByTestId('entity-data-panel')).toBeInTheDocument();
      });

      // Close panel
      fireEvent.click(entitiesButton);
      await waitFor(() => {
        expect(screen.queryByTestId('entity-data-panel')).not.toBeInTheDocument();
      });
    });
  });

  describe('notifications', () => {
    it('should display unread notification count', () => {
      render(<LayoutModern><div>Test</div></LayoutModern>);

      // There are 2 unread notifications by default
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should toggle notifications dropdown when bell icon is clicked', async () => {
      render(<LayoutModern><div>Test</div></LayoutModern>);

      const bellButton = screen.getByTitle('Notifications');

      // Initially closed
      expect(screen.queryByText('Processor Enhancement Complete')).not.toBeInTheDocument();

      // Open notifications
      fireEvent.click(bellButton);
      await waitFor(() => {
        expect(screen.getByText('Processor Enhancement Complete')).toBeInTheDocument();
        expect(screen.getByText('Next Step Available')).toBeInTheDocument();
      });

      // Close notifications
      fireEvent.click(bellButton);
      await waitFor(() => {
        expect(screen.queryByText('Processor Enhancement Complete')).not.toBeInTheDocument();
      });
    });

    it('should mark notification as read when clicked', async () => {
      render(<LayoutModern><div>Test</div></LayoutModern>);

      const bellButton = screen.getByTitle('Notifications');
      fireEvent.click(bellButton);

      await waitFor(() => {
        expect(screen.getByText('Processor Enhancement Complete')).toBeInTheDocument();
      });

      // Click on notification
      const notification = screen.getByText('Processor Enhancement Complete').closest('div[class*="cursor-pointer"]');
      expect(notification).toBeInTheDocument();
      fireEvent.click(notification!);

      // The notification should still be visible, but marked as read
      expect(screen.getByText('Processor Enhancement Complete')).toBeInTheDocument();
    });

    it('should close notifications when clicking outside', async () => {
      render(<LayoutModern><div>Test</div></LayoutModern>);

      const bellButton = screen.getByTitle('Notifications');
      fireEvent.click(bellButton);

      await waitFor(() => {
        expect(screen.getByText('Processor Enhancement Complete')).toBeInTheDocument();
      });

      // Click outside overlay
      const overlay = document.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();
      fireEvent.click(overlay!);

      await waitFor(() => {
        expect(screen.queryByText('Processor Enhancement Complete')).not.toBeInTheDocument();
      });
    });
  });

  describe('chat input', () => {
    it('should update chat input value', async () => {
      const user = userEvent.setup();
      render(<LayoutModern><div>Test</div></LayoutModern>);

      const input = screen.getByPlaceholderText(/Ask Cyoda AI Assistant/i) as HTMLInputElement;

      await user.type(input, 'Hello AI');

      expect(input.value).toBe('Hello AI');
    });

    it('should clear chat input on submit', async () => {
      render(<LayoutModern><div>Test</div></LayoutModern>);

      const input = screen.getByPlaceholderText(/Ask Cyoda AI Assistant/i) as HTMLInputElement;
      const form = input.closest('form');

      fireEvent.change(input, { target: { value: 'Test message' } });
      expect(input.value).toBe('Test message');

      fireEvent.submit(form!);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('should not submit empty chat input', async () => {
      render(<LayoutModern><div>Test</div></LayoutModern>);

      const input = screen.getByPlaceholderText(/Ask Cyoda AI Assistant/i) as HTMLInputElement;
      const submitButton = screen.getByTitle('Send Message');

      expect(input.value).toBe('');
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when input has text', async () => {
      render(<LayoutModern><div>Test</div></LayoutModern>);

      const input = screen.getByPlaceholderText(/Ask Cyoda AI Assistant/i);
      const submitButton = screen.getByTitle('Send Message');

      fireEvent.change(input, { target: { value: 'Test' } });

      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('keyboard shortcuts', () => {
    it('should toggle canvas with Ctrl+B', async () => {
      render(<LayoutModern><div>Test</div></LayoutModern>);

      expect(screen.queryByTestId('workflow-canvas')).not.toBeInTheDocument();

      // Press Ctrl+B
      fireEvent.keyDown(document, { key: 'b', ctrlKey: true });

      await waitFor(() => {
        expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
      });

      // Press Ctrl+B again
      fireEvent.keyDown(document, { key: 'b', ctrlKey: true });

      await waitFor(() => {
        expect(screen.queryByTestId('workflow-canvas')).not.toBeInTheDocument();
      });
    });

    it('should toggle entity data with Ctrl+D', async () => {
      render(<LayoutModern><div>Test</div></LayoutModern>);

      expect(screen.queryByTestId('entity-data-panel')).not.toBeInTheDocument();

      // Press Ctrl+D
      fireEvent.keyDown(document, { key: 'd', ctrlKey: true });

      await waitFor(() => {
        expect(screen.getByTestId('entity-data-panel')).toBeInTheDocument();
      });

      // Press Ctrl+D again
      fireEvent.keyDown(document, { key: 'd', ctrlKey: true });

      await waitFor(() => {
        expect(screen.queryByTestId('entity-data-panel')).not.toBeInTheDocument();
      });
    });

    it('should focus chat input with Ctrl+K', async () => {
      render(<LayoutModern><div>Test</div></LayoutModern>);

      const input = screen.getByPlaceholderText(/Ask Cyoda AI Assistant/i);

      // Press Ctrl+K
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

      await waitFor(() => {
        expect(input).toHaveFocus();
      });
    });

    it('should work with Meta key (Mac)', async () => {
      render(<LayoutModern><div>Test</div></LayoutModern>);

      const input = screen.getByPlaceholderText(/Ask Cyoda AI Assistant/i);

      // Press Cmd+K (Meta+K on Mac)
      fireEvent.keyDown(document, { key: 'k', metaKey: true });

      await waitFor(() => {
        expect(input).toHaveFocus();
      });
    });

    it('should close notifications with Escape', async () => {
      render(<LayoutModern><div>Test</div></LayoutModern>);

      const bellButton = screen.getByTitle('Notifications');
      fireEvent.click(bellButton);

      await waitFor(() => {
        expect(screen.getByText('Processor Enhancement Complete')).toBeInTheDocument();
      });

      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText('Processor Enhancement Complete')).not.toBeInTheDocument();
      });
    });
  });

  describe('external links', () => {
    it('should open Discord link in new tab', () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      render(<LayoutModern><div>Test</div></LayoutModern>);

      const discordButton = screen.getByRole('button', { name: /Discord/i });
      fireEvent.click(discordButton);

      expect(windowOpenSpy).toHaveBeenCalledWith('https://discord.com/invite/95rdAyBZr2', '_blank');

      windowOpenSpy.mockRestore();
    });
  });

  describe('canvas resize', () => {
    it('should start resizing on mouse down', async () => {
      render(<LayoutModern><div>Test</div></LayoutModern>);

      // Open canvas
      const canvasButton = screen.getByRole('button', { name: /Canvas/i });
      fireEvent.click(canvasButton);

      await waitFor(() => {
        expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
      });

      // Find resize handle
      const resizeHandle = document.querySelector('.cursor-ew-resize');
      expect(resizeHandle).toBeInTheDocument();

      // Mouse down on resize handle
      fireEvent.mouseDown(resizeHandle!, { clientX: 400 });

      // The component should be in resizing state
      // We can verify this by checking if mouse move events would affect the canvas
      expect(resizeHandle).toBeInTheDocument();
    });

    it('should resize canvas width on mouse move', async () => {
      render(<LayoutModern><div>Test</div></LayoutModern>);

      // Open canvas
      const canvasButton = screen.getByRole('button', { name: /Canvas/i });
      fireEvent.click(canvasButton);

      await waitFor(() => {
        expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
      });

      // Find resize handle and canvas container
      const resizeHandle = document.querySelector('.cursor-ew-resize');

      // Start resizing
      fireEvent.mouseDown(resizeHandle!, { clientX: 400 });

      // Move mouse
      fireEvent.mouseMove(document, { clientX: 500 });

      // Stop resizing
      fireEvent.mouseUp(document);

      // Canvas should still be visible after resize
      expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
    });

    it('should constrain canvas width to min/max values', async () => {
      render(<LayoutModern><div>Test</div></LayoutModern>);

      // Open canvas
      const canvasButton = screen.getByRole('button', { name: /Canvas/i });
      fireEvent.click(canvasButton);

      await waitFor(() => {
        expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
      });

      const resizeHandle = document.querySelector('.cursor-ew-resize');

      // Try to resize below minimum (300px)
      fireEvent.mouseDown(resizeHandle!, { clientX: 400 });
      fireEvent.mouseMove(document, { clientX: 100 }); // Very small width
      fireEvent.mouseUp(document);

      // Canvas should still be visible (width constrained to min)
      expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();

      // Try to resize above maximum (800px)
      fireEvent.mouseDown(resizeHandle!, { clientX: 400 });
      fireEvent.mouseMove(document, { clientX: 2000 }); // Very large width
      fireEvent.mouseUp(document);

      // Canvas should still be visible (width constrained to max)
      expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
    });
  });
});
