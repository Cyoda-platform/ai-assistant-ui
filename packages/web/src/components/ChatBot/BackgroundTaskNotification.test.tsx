import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BackgroundTaskNotification from './BackgroundTaskNotification';

// Mock ResponseSeparator
vi.mock('./ResponseSeparator', () => ({
  default: ({ hookType, label }: { hookType: string; label: string }) => (
    <div data-testid="response-separator">
      <span>{hookType}</span>
      <span>{label}</span>
    </div>
  ),
}));

describe('BackgroundTaskNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear console mocks
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('null hook handling', () => {
    it('should return null when hook is null', () => {
      const { container } = render(
        <BackgroundTaskNotification hook={null} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should return null when hook is undefined', () => {
      const { container } = render(
        <BackgroundTaskNotification hook={undefined} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render anything when hook is falsy', () => {
      const { container } = render(
        <BackgroundTaskNotification hook={false} />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('rendering with valid hook', () => {
    const mockHook = {
      data: {
        task_name: 'Test Task',
        task_description: 'This is a test task description',
      },
    };

    it('should render when hook is provided', () => {
      render(<BackgroundTaskNotification hook={mockHook} />);

      const taskNames = screen.getAllByText('Test Task');
      expect(taskNames.length).toBeGreaterThan(0);
    });

    it('should render ResponseSeparator', () => {
      render(<BackgroundTaskNotification hook={mockHook} />);

      expect(screen.getByTestId('response-separator')).toBeInTheDocument();
    });

    it('should pass correct props to ResponseSeparator', () => {
      render(<BackgroundTaskNotification hook={mockHook} />);

      expect(screen.getByText('background_task')).toBeInTheDocument();
      const taskNames = screen.getAllByText('Test Task');
      expect(taskNames.length).toBeGreaterThan(0);
    });

    it('should render task name', () => {
      render(<BackgroundTaskNotification hook={mockHook} />);

      const taskNames = screen.getAllByText('Test Task');
      expect(taskNames.length).toBeGreaterThan(0);
    });

    it('should render task description when provided', () => {
      render(<BackgroundTaskNotification hook={mockHook} />);

      expect(screen.getByText('This is a test task description')).toBeInTheDocument();
    });

    it('should render View Tasks button', () => {
      render(<BackgroundTaskNotification hook={mockHook} />);

      expect(screen.getByText('📊 View Tasks')).toBeInTheDocument();
    });
  });

  describe('hook without description', () => {
    it('should render without task description', () => {
      const hookWithoutDescription = {
        data: {
          task_name: 'Task Without Description',
        },
      };

      render(<BackgroundTaskNotification hook={hookWithoutDescription} />);

      const taskNames = screen.getAllByText('Task Without Description');
      expect(taskNames.length).toBeGreaterThan(0);
      expect(screen.queryByText('This is a test task description')).not.toBeInTheDocument();
    });

    it('should not render description div when description is missing', () => {
      const hookWithoutDescription = {
        data: {
          task_name: 'Task',
        },
      };

      const { container } = render(
        <BackgroundTaskNotification hook={hookWithoutDescription} />
      );

      const descriptionDivs = container.querySelectorAll('.text-xs.text-slate-400');
      expect(descriptionDivs.length).toBe(0);
    });
  });

  describe('fallback task name', () => {
    it('should show fallback task name when task_name is not provided', () => {
      const hookWithoutName = {
        data: {},
      };

      render(<BackgroundTaskNotification hook={hookWithoutName} />);

      expect(screen.getByText('Background Task')).toBeInTheDocument();
    });

    it('should show fallback in ResponseSeparator when task_name is missing', () => {
      const hookWithoutName = {
        data: {},
      };

      render(<BackgroundTaskNotification hook={hookWithoutName} />);

      const separators = screen.getAllByText('Background Task');
      expect(separators.length).toBeGreaterThan(0);
    });
  });

  describe('View Tasks button functionality', () => {
    const mockHook = {
      data: {
        task_name: 'Test Task',
      },
    };

    it('should call onOpenTaskPanel when button is clicked', () => {
      const onOpenTaskPanel = vi.fn();

      render(
        <BackgroundTaskNotification
          hook={mockHook}
          onOpenTaskPanel={onOpenTaskPanel}
        />
      );

      const button = screen.getByText('📊 View Tasks');
      fireEvent.click(button);

      expect(onOpenTaskPanel).toHaveBeenCalledTimes(1);
    });

    it('should not error when onOpenTaskPanel is not provided', () => {
      render(<BackgroundTaskNotification hook={mockHook} />);

      const button = screen.getByText('📊 View Tasks');

      expect(() => {
        fireEvent.click(button);
      }).not.toThrow();
    });

    it('should log to console when button is clicked', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      render(<BackgroundTaskNotification hook={mockHook} />);

      const button = screen.getByText('📊 View Tasks');
      fireEvent.click(button);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[View Tasks Button] Clicked, calling onOpenTaskPanel'
      );
    });

    it('should handle multiple button clicks', () => {
      const onOpenTaskPanel = vi.fn();

      render(
        <BackgroundTaskNotification
          hook={mockHook}
          onOpenTaskPanel={onOpenTaskPanel}
        />
      );

      const button = screen.getByText('📊 View Tasks');

      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(onOpenTaskPanel).toHaveBeenCalledTimes(3);
    });
  });

  describe('styling and structure', () => {
    const mockHook = {
      data: {
        task_name: 'Test Task',
        task_description: 'Description',
      },
    };

    it('should have correct background styling', () => {
      const { container } = render(<BackgroundTaskNotification hook={mockHook} />);

      const mainDiv = container.querySelector('.bg-slate-800\\/50');
      expect(mainDiv).toBeInTheDocument();
    });

    it('should have border styling', () => {
      const { container } = render(<BackgroundTaskNotification hook={mockHook} />);

      const borderDiv = container.querySelector('.border-t.border-slate-700');
      expect(borderDiv).toBeInTheDocument();
    });

    it('should have padding container', () => {
      const { container } = render(<BackgroundTaskNotification hook={mockHook} />);

      const paddingDiv = container.querySelector('.px-6.py-4');
      expect(paddingDiv).toBeInTheDocument();
    });

    it('should have rounded background for task info', () => {
      const { container } = render(<BackgroundTaskNotification hook={mockHook} />);

      const roundedDiv = container.querySelector('.rounded-2xl');
      expect(roundedDiv).toBeInTheDocument();
    });

    it('should have button with teal styling', () => {
      render(<BackgroundTaskNotification hook={mockHook} />);

      const button = screen.getByText('📊 View Tasks');
      expect(button.className).toContain('bg-teal-500/20');
      expect(button.className).toContain('text-teal-300');
    });
  });

  describe('edge cases', () => {
    it('should handle hook with empty data object', () => {
      const emptyHook = {
        data: {},
      };

      const { container } = render(<BackgroundTaskNotification hook={emptyHook} />);

      expect(container.firstChild).not.toBeNull();
    });

    it('should handle hook without data property', () => {
      const hookWithoutData = {};

      render(<BackgroundTaskNotification hook={hookWithoutData} />);

      expect(screen.getByText('Background Task')).toBeInTheDocument();
    });

    it('should handle very long task names', () => {
      const longNameHook = {
        data: {
          task_name: 'A'.repeat(200),
        },
      };

      render(<BackgroundTaskNotification hook={longNameHook} />);

      const taskNames = screen.getAllByText('A'.repeat(200));
      expect(taskNames.length).toBeGreaterThan(0);
    });

    it('should handle very long descriptions', () => {
      const longDescriptionHook = {
        data: {
          task_name: 'Task',
          task_description: 'B'.repeat(500),
        },
      };

      render(<BackgroundTaskNotification hook={longDescriptionHook} />);

      expect(screen.getByText('B'.repeat(500))).toBeInTheDocument();
    });
  });
});
