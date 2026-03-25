import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FileSubmitPreview from './FileSubmitPreview';

describe('FileSubmitPreview', () => {
  const defaultProps = {
    file: new File(['content'], 'test.txt', { type: 'text/plain' }),
    onDelete: vi.fn(),
  };

  describe('rendering', () => {
    it('should render file name', () => {
      render(<FileSubmitPreview {...defaultProps} />);

      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });

    it('should render file size in KB', () => {
      const file = new File(['a'.repeat(2048)], 'large.txt', { type: 'text/plain' });
      render(<FileSubmitPreview {...defaultProps} file={file} />);

      expect(screen.getByText(/2\.00 KB/)).toBeInTheDocument();
    });

    it('should render delete button', () => {
      render(<FileSubmitPreview {...defaultProps} />);

      const deleteButton = screen.getByRole('button');
      expect(deleteButton).toBeInTheDocument();
    });

    it('should render file name in bold', () => {
      const { container } = render(<FileSubmitPreview {...defaultProps} />);

      const strong = container.querySelector('strong');
      expect(strong?.textContent).toBe('test.txt');
    });
  });

  describe('className prop', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <FileSubmitPreview {...defaultProps} className="custom-class" />
      );

      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
    });

    it('should work without custom className', () => {
      const { container } = render(<FileSubmitPreview {...defaultProps} />);

      const card = container.querySelector('.file-submit-preview');
      expect(card).toBeInTheDocument();
    });

    it('should combine base class with custom class', () => {
      const { container } = render(
        <FileSubmitPreview {...defaultProps} className="my-class" />
      );

      const card = container.querySelector('.file-submit-preview.my-class');
      expect(card).toBeInTheDocument();
    });
  });

  describe('delete functionality', () => {
    it('should call onDelete when delete button is clicked', () => {
      const onDelete = vi.fn();
      render(<FileSubmitPreview {...defaultProps} onDelete={onDelete} />);

      const deleteButton = screen.getByRole('button');
      fireEvent.click(deleteButton);

      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple delete clicks', () => {
      const onDelete = vi.fn();
      render(<FileSubmitPreview {...defaultProps} onDelete={onDelete} />);

      const deleteButton = screen.getByRole('button');

      fireEvent.click(deleteButton);
      fireEvent.click(deleteButton);
      fireEvent.click(deleteButton);

      expect(onDelete).toHaveBeenCalledTimes(3);
    });
  });

  describe('file size formatting', () => {
    it('should format small files correctly', () => {
      const file = new File(['a'.repeat(100)], 'small.txt', { type: 'text/plain' });
      render(<FileSubmitPreview {...defaultProps} file={file} />);

      expect(screen.getByText(/0\.10 KB/)).toBeInTheDocument();
    });

    it('should format 1KB file correctly', () => {
      const file = new File(['a'.repeat(1024)], '1kb.txt', { type: 'text/plain' });
      render(<FileSubmitPreview {...defaultProps} file={file} />);

      expect(screen.getByText(/1\.00 KB/)).toBeInTheDocument();
    });

    it('should format large files correctly', () => {
      const file = new File(['a'.repeat(10240)], 'large.txt', { type: 'text/plain' });
      render(<FileSubmitPreview {...defaultProps} file={file} />);

      expect(screen.getByText(/10\.00 KB/)).toBeInTheDocument();
    });

    it('should show two decimal places', () => {
      const file = new File(['a'.repeat(1536)], 'file.txt', { type: 'text/plain' });
      render(<FileSubmitPreview {...defaultProps} file={file} />);

      expect(screen.getByText(/1\.50 KB/)).toBeInTheDocument();
    });
  });

  describe('different file types', () => {
    it('should render PDF file', () => {
      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      render(<FileSubmitPreview {...defaultProps} file={file} />);

      expect(screen.getByText('document.pdf')).toBeInTheDocument();
    });

    it('should render image file', () => {
      const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
      render(<FileSubmitPreview {...defaultProps} file={file} />);

      expect(screen.getByText('photo.jpg')).toBeInTheDocument();
    });

    it('should render JSON file', () => {
      const file = new File(['{}'], 'data.json', { type: 'application/json' });
      render(<FileSubmitPreview {...defaultProps} file={file} />);

      expect(screen.getByText('data.json')).toBeInTheDocument();
    });

    it('should render file with long name', () => {
      const longName = 'very-long-file-name-that-might-need-special-handling.txt';
      const file = new File(['content'], longName, { type: 'text/plain' });
      render(<FileSubmitPreview {...defaultProps} file={file} />);

      expect(screen.getByText(longName)).toBeInTheDocument();
    });
  });

  describe('card properties', () => {
    it('should render as small size card', () => {
      const { container } = render(<FileSubmitPreview {...defaultProps} />);

      const card = container.querySelector('.ant-card-small');
      expect(card).toBeInTheDocument();
    });

    it('should have delete button in extra slot', () => {
      render(<FileSubmitPreview {...defaultProps} />);

      const deleteButton = screen.getByRole('button');
      expect(deleteButton).toBeInTheDocument();
    });
  });

  describe('structure', () => {
    it('should have two divs in card body', () => {
      const { container } = render(<FileSubmitPreview {...defaultProps} />);

      const cardBody = container.querySelector('.ant-card-body');
      const divs = cardBody?.querySelectorAll(':scope > div');
      expect(divs?.length).toBeGreaterThanOrEqual(2);
    });

    it('should display file name first', () => {
      const { container } = render(<FileSubmitPreview {...defaultProps} />);

      const cardBody = container.querySelector('.ant-card-body');
      const firstDiv = cardBody?.querySelector('div:first-child');
      expect(firstDiv?.querySelector('strong')).toBeInTheDocument();
    });
  });
});
