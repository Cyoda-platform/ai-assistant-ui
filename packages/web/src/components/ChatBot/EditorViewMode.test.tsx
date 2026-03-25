import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditorViewMode from './EditorViewMode';
import { Modal } from 'antd';

// Mock Ant Design Grid breakpoint hook
const mockUseBreakpoint = vi.fn();

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    Grid: {
      useBreakpoint: () => mockUseBreakpoint(),
    },
  };
});

describe('EditorViewMode', () => {
  const defaultProps = {
    value: 'editor',
    onChange: vi.fn(),
    onClear: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default to desktop view
    mockUseBreakpoint.mockReturnValue({ md: true, lg: true });
  });

  describe('rendering', () => {
    it('should render radio buttons', () => {
      render(<EditorViewMode {...defaultProps} />);

      const radios = screen.getAllByRole('radio');
      expect(radios.length).toBeGreaterThan(0);
    });

    it('should render clear button', () => {
      render(<EditorViewMode {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('title', 'Clear data');
    });

    it('should render Editor option', () => {
      render(<EditorViewMode {...defaultProps} />);

      expect(screen.getByText('Editor')).toBeInTheDocument();
    });

    it('should have delete icon in clear button', () => {
      const { container } = render(<EditorViewMode {...defaultProps} />);

      // DeleteOutlined renders as SVG
      const deleteIcon = container.querySelector('svg');
      expect(deleteIcon).toBeInTheDocument();
    });
  });

  describe('desktop view (md breakpoint)', () => {
    beforeEach(() => {
      mockUseBreakpoint.mockReturnValue({ md: true });
    });

    it('should show all three options on desktop', () => {
      render(<EditorViewMode {...defaultProps} />);

      expect(screen.getByText('Editor')).toBeInTheDocument();
      expect(screen.getByText('Preview')).toBeInTheDocument();
      expect(screen.getByText('Editor + Preview')).toBeInTheDocument();
    });

    it('should render Preview option', () => {
      render(<EditorViewMode {...defaultProps} />);

      expect(screen.getByText('Preview')).toBeInTheDocument();
    });

    it('should render Editor + Preview option', () => {
      render(<EditorViewMode {...defaultProps} />);

      expect(screen.getByText('Editor + Preview')).toBeInTheDocument();
    });
  });

  describe('mobile view (no md breakpoint)', () => {
    beforeEach(() => {
      mockUseBreakpoint.mockReturnValue({ md: false });
    });

    it('should only show Editor option on mobile', () => {
      render(<EditorViewMode {...defaultProps} />);

      expect(screen.getByText('Editor')).toBeInTheDocument();
      expect(screen.queryByText('Preview')).not.toBeInTheDocument();
      expect(screen.queryByText('Editor + Preview')).not.toBeInTheDocument();
    });

    it('should auto-switch to editor mode when not already in editor mode', () => {
      const onChange = vi.fn();
      render(<EditorViewMode {...defaultProps} value="preview" onChange={onChange} />);

      expect(onChange).toHaveBeenCalledWith('editor');
    });

    it('should not call onChange if already in editor mode', () => {
      const onChange = vi.fn();
      render(<EditorViewMode {...defaultProps} value="editor" onChange={onChange} />);

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('value prop', () => {
    beforeEach(() => {
      mockUseBreakpoint.mockReturnValue({ md: true });
    });

    it('should reflect current value', () => {
      const { rerender } = render(<EditorViewMode {...defaultProps} value="editor" />);

      const radios = screen.getAllByRole('radio');
      const editorRadio = radios.find(r => (r as HTMLInputElement).value === 'editor');
      expect(editorRadio).toBeChecked();

      rerender(<EditorViewMode {...defaultProps} value="preview" />);
      const previewRadio = radios.find(r => (r as HTMLInputElement).value === 'preview');
      expect(previewRadio).toBeChecked();
    });

    it('should support editor value', () => {
      render(<EditorViewMode {...defaultProps} value="editor" />);

      const radios = screen.getAllByRole('radio');
      const editorRadio = radios.find(r => (r as HTMLInputElement).value === 'editor');
      expect(editorRadio).toBeChecked();
    });

    it('should support preview value', () => {
      render(<EditorViewMode {...defaultProps} value="preview" />);

      const radios = screen.getAllByRole('radio');
      const previewRadio = radios.find(r => (r as HTMLInputElement).value === 'preview');
      expect(previewRadio).toBeChecked();
    });

    it('should support editorPreview value', () => {
      render(<EditorViewMode {...defaultProps} value="editorPreview" />);

      const radios = screen.getAllByRole('radio');
      const editorPreviewRadio = radios.find(r => (r as HTMLInputElement).value === 'editorPreview');
      expect(editorPreviewRadio).toBeChecked();
    });
  });

  describe('onChange callback', () => {
    beforeEach(() => {
      mockUseBreakpoint.mockReturnValue({ md: true });
    });

    it('should call onChange when radio selection changes', () => {
      const onChange = vi.fn();
      render(<EditorViewMode {...defaultProps} onChange={onChange} />);

      const previewLabel = screen.getByText('Preview');
      fireEvent.click(previewLabel);

      expect(onChange).toHaveBeenCalledWith('preview');
    });

    it('should call onChange with correct value for Editor', () => {
      const onChange = vi.fn();
      render(<EditorViewMode {...defaultProps} value="preview" onChange={onChange} />);

      const editorLabel = screen.getByText('Editor');
      fireEvent.click(editorLabel);

      expect(onChange).toHaveBeenCalledWith('editor');
    });

    it('should call onChange with correct value for Editor + Preview', () => {
      const onChange = vi.fn();
      render(<EditorViewMode {...defaultProps} onChange={onChange} />);

      const editorPreviewLabel = screen.getByText('Editor + Preview');
      fireEvent.click(editorPreviewLabel);

      expect(onChange).toHaveBeenCalledWith('editorPreview');
    });
  });

  describe('clear functionality', () => {
    it('should show confirmation modal when clear button is clicked', () => {
      const confirmSpy = vi.spyOn(Modal, 'confirm');

      render(<EditorViewMode {...defaultProps} />);

      const clearButton = screen.getByRole('button');
      fireEvent.click(clearButton);

      expect(confirmSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Confirm!',
          content: 'Are you sure you want to clear the data?',
        })
      );
    });

    it('should call onClear when modal is confirmed', () => {
      const onClear = vi.fn();
      const confirmSpy = vi.spyOn(Modal, 'confirm');

      render(<EditorViewMode {...defaultProps} onClear={onClear} />);

      const clearButton = screen.getByRole('button');
      fireEvent.click(clearButton);

      // Get the onOk callback and call it
      const confirmOptions = confirmSpy.mock.calls[0][0];
      confirmOptions.onOk?.();

      expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('should not call onClear when modal is cancelled', () => {
      const onClear = vi.fn();
      vi.spyOn(Modal, 'confirm');

      render(<EditorViewMode {...defaultProps} onClear={onClear} />);

      const clearButton = screen.getByRole('button');
      fireEvent.click(clearButton);

      // Don't call onOk, just check onClear wasn't called
      expect(onClear).not.toHaveBeenCalled();
    });
  });

  describe('styling', () => {
    it('should have flex layout container', () => {
      const { container } = render(<EditorViewMode {...defaultProps} />);

      const editorViewMode = container.querySelector('.editor-view-mode');
      expect(editorViewMode).toBeInTheDocument();
      expect(editorViewMode).toHaveStyle({ display: 'flex' });
    });

    it('should have border bottom style', () => {
      const { container } = render(<EditorViewMode {...defaultProps} />);

      const editorViewMode = container.querySelector('.editor-view-mode');
      // CSS variables don't parse in test environment, just check the style attribute contains border
      expect(editorViewMode).toBeInTheDocument();
      const style = editorViewMode?.getAttribute('style');
      expect(style).toContain('border-bottom');
    });

    it('should have padding', () => {
      const { container } = render(<EditorViewMode {...defaultProps} />);

      const editorViewMode = container.querySelector('.editor-view-mode');
      expect(editorViewMode).toHaveStyle({ padding: '8px 0' });
    });

    it('should have space-between justification', () => {
      const { container } = render(<EditorViewMode {...defaultProps} />);

      const editorViewMode = container.querySelector('.editor-view-mode');
      expect(editorViewMode).toHaveStyle({ justifyContent: 'space-between' });
    });
  });

  describe('radio group properties', () => {
    beforeEach(() => {
      mockUseBreakpoint.mockReturnValue({ md: true });
    });

    it('should use button option type', () => {
      const { container } = render(<EditorViewMode {...defaultProps} />);

      const buttonRadio = container.querySelector('.ant-radio-button-wrapper');
      expect(buttonRadio).toBeInTheDocument();
    });

    it('should use small size', () => {
      const { container } = render(<EditorViewMode {...defaultProps} />);

      const radioGroup = container.querySelector('.ant-radio-group-small');
      expect(radioGroup).toBeInTheDocument();
    });

    it('should use solid button style', () => {
      const { container } = render(<EditorViewMode {...defaultProps} />);

      const radioGroup = container.querySelector('.ant-radio-group-solid');
      expect(radioGroup).toBeInTheDocument();
    });
  });

  describe('responsive behavior', () => {
    it('should update when breakpoint changes from mobile to desktop', () => {
      mockUseBreakpoint.mockReturnValue({ md: false });
      const { rerender } = render(<EditorViewMode {...defaultProps} />);

      expect(screen.queryByText('Preview')).not.toBeInTheDocument();

      mockUseBreakpoint.mockReturnValue({ md: true });
      rerender(<EditorViewMode {...defaultProps} />);

      expect(screen.getByText('Preview')).toBeInTheDocument();
    });

    it('should call onChange when switching from desktop to mobile in non-editor mode', () => {
      const onChange = vi.fn();
      mockUseBreakpoint.mockReturnValue({ md: true });
      const { rerender } = render(
        <EditorViewMode {...defaultProps} value="preview" onChange={onChange} />
      );

      onChange.mockClear();

      mockUseBreakpoint.mockReturnValue({ md: false });
      rerender(<EditorViewMode {...defaultProps} value="preview" onChange={onChange} />);

      expect(onChange).toHaveBeenCalledWith('editor');
    });
  });
});
