import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FilePreview from './FilePreview';

describe('FilePreview', () => {
  describe('file name display', () => {
    it('should render file name', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      render(<FilePreview file={file} />);

      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });

    it('should truncate long file names', () => {
      const longFileName = 'very-long-file-name-that-should-be-truncated-for-display.txt';
      const file = new File(['content'], longFileName, { type: 'text/plain' });

      const { container } = render(<FilePreview file={file} />);

      const nameSpan = container.querySelector('.truncate');
      expect(nameSpan).toBeInTheDocument();
      expect(nameSpan?.textContent).toBe(longFileName);
    });

    it('should display full file name in title attribute', () => {
      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });

      const { container } = render(<FilePreview file={file} />);

      const nameSpan = container.querySelector('[title="document.pdf"]');
      expect(nameSpan).toBeInTheDocument();
    });
  });

  describe('file size formatting', () => {
    it('should format bytes correctly (< 1KB)', () => {
      const content = 'a'.repeat(500); // 500 bytes
      const file = new File([content], 'small.txt', { type: 'text/plain' });

      render(<FilePreview file={file} />);

      expect(screen.getByText(/500 B/)).toBeInTheDocument();
    });

    it('should format kilobytes correctly (< 1MB)', () => {
      const content = 'a'.repeat(5000); // ~5KB
      const file = new File([content], 'medium.txt', { type: 'text/plain' });

      render(<FilePreview file={file} />);

      expect(screen.getByText(/4\.\d KB/)).toBeInTheDocument();
    });

    it('should format megabytes correctly (>= 1MB)', () => {
      const content = 'a'.repeat(2 * 1024 * 1024); // 2MB
      const file = new File([content], 'large.txt', { type: 'text/plain' });

      render(<FilePreview file={file} />);

      expect(screen.getByText(/2\.0 MB/)).toBeInTheDocument();
    });

    it('should handle exactly 1KB', () => {
      const content = 'a'.repeat(1024); // 1KB
      const file = new File([content], 'exact-kb.txt', { type: 'text/plain' });

      render(<FilePreview file={file} />);

      expect(screen.getByText(/1\.0 KB/)).toBeInTheDocument();
    });

    it('should handle exactly 1MB', () => {
      const content = 'a'.repeat(1024 * 1024); // 1MB
      const file = new File([content], 'exact-mb.txt', { type: 'text/plain' });

      render(<FilePreview file={file} />);

      expect(screen.getByText(/1\.0 MB/)).toBeInTheDocument();
    });

    it('should handle zero bytes', () => {
      const file = new File([], 'empty.txt', { type: 'text/plain' });

      render(<FilePreview file={file} />);

      expect(screen.getByText(/0 B/)).toBeInTheDocument();
    });
  });

  describe('different file types', () => {
    it('should render text file', () => {
      const file = new File(['content'], 'document.txt', { type: 'text/plain' });

      render(<FilePreview file={file} />);

      expect(screen.getByText('document.txt')).toBeInTheDocument();
    });

    it('should render PDF file', () => {
      const file = new File(['content'], 'report.pdf', { type: 'application/pdf' });

      render(<FilePreview file={file} />);

      expect(screen.getByText('report.pdf')).toBeInTheDocument();
    });

    it('should render image file', () => {
      const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });

      render(<FilePreview file={file} />);

      expect(screen.getByText('photo.jpg')).toBeInTheDocument();
    });

    it('should render JSON file', () => {
      const file = new File(['{}'], 'data.json', { type: 'application/json' });

      render(<FilePreview file={file} />);

      expect(screen.getByText('data.json')).toBeInTheDocument();
    });
  });

  describe('styling and layout', () => {
    it('should have paperclip icon', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      const { container } = render(<FilePreview file={file} />);

      // Lucide icon renders as an SVG
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should have correct CSS classes', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      const { container } = render(<FilePreview file={file} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('inline-flex');
      expect(wrapper.className).toContain('items-center');
      expect(wrapper.className).toContain('gap-2');
    });

    it('should display file size in parentheses', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      const { container } = render(<FilePreview file={file} />);

      const sizeText = container.querySelector('.text-slate-500');
      expect(sizeText?.textContent).toMatch(/^\(/);
      expect(sizeText?.textContent).toMatch(/\)$/);
    });
  });
});
