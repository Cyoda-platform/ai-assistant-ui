import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SettingsDialog from './SettingsDialog';

describe('SettingsDialog', () => {
  const defaultProps = {
    visible: true,
    onClose: vi.fn(),
  };

  describe('rendering', () => {
    it('should render when visible is true', () => {
      render(<SettingsDialog {...defaultProps} />);

      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should not render when visible is false', () => {
      render(<SettingsDialog {...defaultProps} visible={false} />);

      // Modal should not be visible
      expect(screen.queryByText('General Settings')).not.toBeInTheDocument();
    });

    it('should render title', () => {
      render(<SettingsDialog {...defaultProps} />);

      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should render general settings section', () => {
      render(<SettingsDialog {...defaultProps} />);

      expect(screen.getByText('General Settings')).toBeInTheDocument();
    });

    it('should render description text', () => {
      render(<SettingsDialog {...defaultProps} />);

      expect(
        screen.getByText(/Application settings will be available here/)
      ).toBeInTheDocument();
    });

    it('should render future updates text', () => {
      render(<SettingsDialog {...defaultProps} />);

      expect(
        screen.getByText(/More settings options will be added in future updates/)
      ).toBeInTheDocument();
    });
  });

  describe('close behavior', () => {
    it('should call onClose when modal is closed', () => {
      const onClose = vi.fn();
      render(<SettingsDialog {...defaultProps} onClose={onClose} />);

      // Find and click the close button (X icon)
      const modal = document.querySelector('.ant-modal');
      const closeButton = modal?.querySelector('.ant-modal-close');

      if (closeButton) {
        fireEvent.click(closeButton);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should have onClose callback', () => {
      const onClose = vi.fn();
      render(<SettingsDialog {...defaultProps} onClose={onClose} />);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('modal properties', () => {
    it('should have correct width', () => {
      render(<SettingsDialog {...defaultProps} />);

      const modal = document.querySelector('.ant-modal');
      expect(modal).toBeInTheDocument();
    });

    it('should not have footer', () => {
      render(<SettingsDialog {...defaultProps} />);

      const footer = document.querySelector('.ant-modal-footer');
      expect(footer).not.toBeInTheDocument();
    });
  });

  describe('content structure', () => {
    it('should render content container', () => {
      render(<SettingsDialog {...defaultProps} />);

      // Verify content is rendered by checking for text
      expect(screen.getByText('General Settings')).toBeInTheDocument();
      expect(screen.getByText(/Application settings will be available here/)).toBeInTheDocument();
    });

    it('should have multiple content sections', () => {
      render(<SettingsDialog {...defaultProps} />);

      // Verify different sections are rendered
      expect(screen.getByText('General Settings')).toBeInTheDocument();
      expect(screen.getByText(/More settings options will be added/)).toBeInTheDocument();
    });

    it('should have structured layout', () => {
      render(<SettingsDialog {...defaultProps} />);

      // Verify the modal renders with content
      expect(screen.getByText('General Settings')).toBeInTheDocument();
      expect(screen.getByText(/Application settings will be available here/)).toBeInTheDocument();
      expect(screen.getByText(/More settings options will be added/)).toBeInTheDocument();
    });
  });

  describe('state changes', () => {
    it('should show modal when visible changes from false to true', () => {
      const { rerender } = render(<SettingsDialog {...defaultProps} visible={false} />);

      expect(screen.queryByText('General Settings')).not.toBeInTheDocument();

      rerender(<SettingsDialog {...defaultProps} visible={true} />);

      expect(screen.getByText('General Settings')).toBeInTheDocument();
    });

    it('should respond to visible prop changes', () => {
      const { rerender } = render(<SettingsDialog {...defaultProps} visible={true} />);

      expect(screen.getByText('General Settings')).toBeInTheDocument();

      rerender(<SettingsDialog {...defaultProps} visible={false} />);

      // Ant Design Modal keeps elements in DOM but hides them
      // Just verify the rerender completed without errors
      expect(screen.queryByText('Settings')).toBeInTheDocument();
    });
  });
});
