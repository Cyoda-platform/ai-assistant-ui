import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CanvasEmptyState from './CanvasEmptyState';

describe('CanvasEmptyState', () => {
  describe('requirements type', () => {
    it('should render requirements empty state', () => {
      render(<CanvasEmptyState type="requirements" />);

      expect(screen.getByText('Define Your Requirements')).toBeInTheDocument();
      expect(screen.getByText(/Start by defining your application requirements/)).toBeInTheDocument();
      expect(screen.getByText(/Functional Requirements/)).toBeInTheDocument();
    });

    it('should have orange color theme for requirements', () => {
      const { container } = render(<CanvasEmptyState type="requirements" />);

      const bgElement = container.querySelector('.bg-orange-500\\/10');
      expect(bgElement).toBeInTheDocument();

      const icon = container.querySelector('.text-orange-400\\/80');
      expect(icon).toBeInTheDocument();
    });

    it('should show tip for requirements', () => {
      render(<CanvasEmptyState type="requirements" />);

      expect(screen.getByText(/Tip: Use the "Add Requirement" button above/)).toBeInTheDocument();
    });
  });

  describe('entities type', () => {
    it('should render entities empty state', () => {
      render(<CanvasEmptyState type="entities" />);

      expect(screen.getByText('Start Building Your Data Model')).toBeInTheDocument();
      expect(screen.getByText(/Entities are the core data structures/)).toBeInTheDocument();
      expect(screen.getByText(/Customer/)).toBeInTheDocument();
    });

    it('should have teal color theme for entities', () => {
      const { container } = render(<CanvasEmptyState type="entities" />);

      const bgElement = container.querySelector('.bg-teal-500\\/10');
      expect(bgElement).toBeInTheDocument();

      const icon = container.querySelector('.text-teal-400\\/80');
      expect(icon).toBeInTheDocument();
    });

    it('should show tip for entities', () => {
      render(<CanvasEmptyState type="entities" />);

      expect(screen.getByText(/Tip: Use the "Add Entity" button above/)).toBeInTheDocument();
    });
  });

  describe('workflows type', () => {
    it('should render workflows empty state', () => {
      render(<CanvasEmptyState type="workflows" />);

      expect(screen.getByText('Define Your Business Logic')).toBeInTheDocument();
      expect(screen.getByText(/Workflows orchestrate how your entities/)).toBeInTheDocument();
      expect(screen.getByText(/Order Processing/)).toBeInTheDocument();
    });

    it('should have purple color theme for workflows', () => {
      const { container } = render(<CanvasEmptyState type="workflows" />);

      const bgElement = container.querySelector('.bg-purple-500\\/10');
      expect(bgElement).toBeInTheDocument();

      const icon = container.querySelector('.text-purple-400\\/80');
      expect(icon).toBeInTheDocument();
    });

    it('should show tip for workflows', () => {
      render(<CanvasEmptyState type="workflows" />);

      expect(screen.getByText(/Tip: Use the "Add Workflow" button above/)).toBeInTheDocument();
    });
  });

  describe('code type', () => {
    it('should render code empty state', () => {
      render(<CanvasEmptyState type="code" />);

      expect(screen.getByText('Code Editor')).toBeInTheDocument();
      expect(screen.getByText('View and edit code files')).toBeInTheDocument();
      expect(screen.getByText('Coming soon...')).toBeInTheDocument();
    });

    it('should have gray color theme for code', () => {
      const { container } = render(<CanvasEmptyState type="code" />);

      const bgElement = container.querySelector('.bg-gray-500\\/10');
      expect(bgElement).toBeInTheDocument();

      const icon = container.querySelector('.text-gray-400\\/80');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('common elements', () => {
    it('should render with max width container', () => {
      const { container } = render(<CanvasEmptyState type="entities" />);

      const wrapper = container.querySelector('.max-w-2xl');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('w-full', 'mx-auto', 'text-center');
    });

    it('should have animated background blur', () => {
      const { container } = render(<CanvasEmptyState type="entities" />);

      const blur = container.querySelector('.blur-3xl.animate-pulse');
      expect(blur).toBeInTheDocument();
    });

    it('should have icon container', () => {
      const { container } = render(<CanvasEmptyState type="entities" />);

      const iconContainer = container.querySelector('.relative.mb-6');
      expect(iconContainer).toBeInTheDocument();
    });
  });
});
