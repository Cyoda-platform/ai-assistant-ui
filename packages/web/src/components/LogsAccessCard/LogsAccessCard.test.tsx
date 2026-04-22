import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LogsAccessCard from './LogsAccessCard';

describe('LogsAccessCard', () => {
  let windowOpenSpy: any;

  beforeEach(() => {
    windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    windowOpenSpy.mockRestore();
  });

  describe('rendering', () => {
    it('should render the card', () => {
      const { container } = render(<LogsAccessCard />);

      const card = container.querySelector('.logs-access-card');
      expect(card).toBeInTheDocument();
    });

    it('should render title', () => {
      render(<LogsAccessCard />);

      expect(screen.getByText('Environment Logs')).toBeInTheDocument();
    });

    it('should render description', () => {
      render(<LogsAccessCard />);

      expect(
        screen.getByText(/View and analyze your system logs in real-time/)
      ).toBeInTheDocument();
    });

    it('should render action text', () => {
      render(<LogsAccessCard />);

      expect(screen.getByText('Open Logs Viewer')).toBeInTheDocument();
    });

    it('should render glow effect', () => {
      const { container } = render(<LogsAccessCard />);

      const glow = container.querySelector('.logs-card-glow');
      expect(glow).toBeInTheDocument();
    });

    it('should render card content', () => {
      const { container } = render(<LogsAccessCard />);

      const content = container.querySelector('.logs-card-content');
      expect(content).toBeInTheDocument();
    });

    it('should render icon', () => {
      const { container } = render(<LogsAccessCard />);

      const icon = container.querySelector('.logs-card-icon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('feature badges', () => {
    it('should render Advanced Search badge', () => {
      render(<LogsAccessCard />);

      expect(screen.getByText('Advanced Search')).toBeInTheDocument();
    });

    it('should render Query DSL badge', () => {
      render(<LogsAccessCard />);

      expect(screen.getByText('Query DSL')).toBeInTheDocument();
    });

    it('should render Export JSON badge', () => {
      render(<LogsAccessCard />);

      expect(screen.getByText('Export JSON')).toBeInTheDocument();
    });

    it('should render all three feature badges', () => {
      const { container } = render(<LogsAccessCard />);

      const badges = container.querySelectorAll('.logs-feature-badge');
      expect(badges.length).toBe(3);
    });

    it('should render badge icons', () => {
      const { container } = render(<LogsAccessCard />);

      const badgeIcons = container.querySelectorAll('.badge-icon');
      expect(badgeIcons.length).toBe(3);
    });
  });

  describe('click behavior', () => {
    it('should open logs page when clicked', () => {
      const { container } = render(<LogsAccessCard />);

      const card = container.querySelector('.logs-access-card') as HTMLElement;
      fireEvent.click(card);

      expect(windowOpenSpy).toHaveBeenCalledWith('/logs', '_blank');
    });

    it('should open in new tab', () => {
      const { container } = render(<LogsAccessCard />);

      const card = container.querySelector('.logs-access-card') as HTMLElement;
      fireEvent.click(card);

      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.any(String),
        '_blank'
      );
    });

    it('should handle multiple clicks', () => {
      const { container } = render(<LogsAccessCard />);

      const card = container.querySelector('.logs-access-card') as HTMLElement;

      fireEvent.click(card);
      fireEvent.click(card);
      fireEvent.click(card);

      expect(windowOpenSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('SVG icons', () => {
    it('should render main icon SVG', () => {
      const { container } = render(<LogsAccessCard />);

      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });

    it('should render arrow icon in action', () => {
      const { container } = render(<LogsAccessCard />);

      const arrow = container.querySelector('.action-arrow');
      expect(arrow).toBeInTheDocument();
    });

    it('should have correct viewBox for icons', () => {
      const { container } = render(<LogsAccessCard />);

      const icon = container.querySelector('.logs-card-icon svg');
      expect(icon?.getAttribute('viewBox')).toBe('0 0 24 24');
    });
  });

  describe('styling and structure', () => {
    it('should have features container', () => {
      const { container } = render(<LogsAccessCard />);

      const features = container.querySelector('.logs-card-features');
      expect(features).toBeInTheDocument();
    });

    it('should have action container', () => {
      const { container } = render(<LogsAccessCard />);

      const action = container.querySelector('.logs-card-action');
      expect(action).toBeInTheDocument();
    });

    it('should have correct structure', () => {
      const { container } = render(<LogsAccessCard />);

      const card = container.querySelector('.logs-access-card');
      const glow = card?.querySelector('.logs-card-glow');
      const content = card?.querySelector('.logs-card-content');

      expect(card).toBeInTheDocument();
      expect(glow).toBeInTheDocument();
      expect(content).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should be clickable', () => {
      const { container } = render(<LogsAccessCard />);

      const card = container.querySelector('.logs-access-card') as HTMLElement;
      expect(card).toBeInTheDocument();

      fireEvent.click(card);
      expect(windowOpenSpy).toHaveBeenCalled();
    });

    it('should render with proper SVG attributes', () => {
      const { container } = render(<LogsAccessCard />);

      const svgs = container.querySelectorAll('svg');
      svgs.forEach(svg => {
        expect(svg.getAttribute('fill')).toBeDefined();
        expect(svg.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg');
      });
    });
  });
});
