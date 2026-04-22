import { describe, it, expect, beforeEach, vi } from 'vitest';
import { taskService, type BackgroundTask, type TaskListResponse } from './taskService';
import privateClient from '@/clients/private';

// Mock dependencies
vi.mock('@/clients/private', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('taskService', () => {
  const mockTask: BackgroundTask = {
    technical_id: 'task-123',
    user_id: 'user-1',
    task_type: 'build_app',
    status: 'running',
    progress: 50,
    name: 'Build App',
    description: 'Building application',
    date: '2024-01-15T12:00:00Z',
    conversation_id: 'conv-1',
    progress_messages: [
      {
        message: 'Starting build',
        timestamp: '2024-01-15T12:00:00Z',
        progress: 10,
      },
    ],
    statistics: {
      duration_formatted: '5m 30s',
      status_message: 'In progress',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTask', () => {
    it('should fetch a single task by ID', async () => {
      vi.mocked(privateClient.get).mockResolvedValue({ data: mockTask });

      const result = await taskService.getTask('task-123');

      expect(privateClient.get).toHaveBeenCalledWith('/v1/tasks/task-123');
      expect(result).toEqual(mockTask);
    });

    it('should handle errors', async () => {
      const mockError = new Error('Task not found');
      vi.mocked(privateClient.get).mockRejectedValue(mockError);

      await expect(taskService.getTask('invalid-id')).rejects.toThrow('Task not found');
    });
  });

  describe('listTasks', () => {
    const mockListResponse: TaskListResponse = {
      tasks: [mockTask],
      count: 1,
    };

    it('should list all tasks without filters', async () => {
      vi.mocked(privateClient.get).mockResolvedValue({ data: mockListResponse });

      const result = await taskService.listTasks();

      expect(privateClient.get).toHaveBeenCalledWith('/v1/tasks', { params: undefined });
      expect(result).toEqual(mockListResponse);
    });

    it('should filter tasks by conversation_id', async () => {
      vi.mocked(privateClient.get).mockResolvedValue({ data: mockListResponse });

      const result = await taskService.listTasks({ conversation_id: 'conv-1' });

      expect(privateClient.get).toHaveBeenCalledWith('/v1/tasks', {
        params: { conversation_id: 'conv-1' },
      });
      expect(result).toEqual(mockListResponse);
    });

    it('should filter tasks by status', async () => {
      vi.mocked(privateClient.get).mockResolvedValue({ data: mockListResponse });

      const result = await taskService.listTasks({ status: 'running' });

      expect(privateClient.get).toHaveBeenCalledWith('/v1/tasks', {
        params: { status: 'running' },
      });
      expect(result).toEqual(mockListResponse);
    });

    it('should filter tasks by task_type', async () => {
      vi.mocked(privateClient.get).mockResolvedValue({ data: mockListResponse });

      const result = await taskService.listTasks({ task_type: 'build_app' });

      expect(privateClient.get).toHaveBeenCalledWith('/v1/tasks', {
        params: { task_type: 'build_app' },
      });
      expect(result).toEqual(mockListResponse);
    });

    it('should filter tasks with multiple parameters', async () => {
      vi.mocked(privateClient.get).mockResolvedValue({ data: mockListResponse });

      const result = await taskService.listTasks({
        conversation_id: 'conv-1',
        status: 'running',
        task_type: 'build_app',
      });

      expect(privateClient.get).toHaveBeenCalledWith('/v1/tasks', {
        params: {
          conversation_id: 'conv-1',
          status: 'running',
          task_type: 'build_app',
        },
      });
      expect(result).toEqual(mockListResponse);
    });
  });

  describe('cancelTask', () => {
    it('should cancel a running task', async () => {
      const mockResponse = {
        message: 'Task cancelled successfully',
        task: { ...mockTask, status: 'cancelled' as const },
      };
      vi.mocked(privateClient.delete).mockResolvedValue({ data: mockResponse });

      const result = await taskService.cancelTask('task-123');

      expect(privateClient.delete).toHaveBeenCalledWith('/v1/tasks/task-123/cancel');
      expect(result).toEqual(mockResponse);
      expect(result.task.status).toBe('cancelled');
    });

    it('should handle cancellation errors', async () => {
      const mockError = new Error('Task already completed');
      vi.mocked(privateClient.delete).mockRejectedValue(mockError);

      await expect(taskService.cancelTask('task-123')).rejects.toThrow(
        'Task already completed'
      );
    });
  });

  describe('pollTask', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should start polling and call onUpdate', async () => {
      vi.mocked(privateClient.get).mockResolvedValue({ data: mockTask });

      const onUpdate = vi.fn();
      const cleanup = taskService.pollTask('task-123', onUpdate);

      // Wait for initial poll
      await vi.runOnlyPendingTimersAsync();

      expect(onUpdate).toHaveBeenCalledWith(mockTask);
      expect(privateClient.get).toHaveBeenCalledWith('/v1/tasks/task-123');

      cleanup();
    });

    it('should stop polling when task completes', async () => {
      const completedTask = { ...mockTask, status: 'completed' as const };
      vi.mocked(privateClient.get).mockResolvedValue({ data: completedTask });

      const onUpdate = vi.fn();
      const onComplete = vi.fn();
      taskService.pollTask('task-123', onUpdate, onComplete);

      // Wait for initial poll
      await vi.runOnlyPendingTimersAsync();

      expect(onComplete).toHaveBeenCalledWith(completedTask);
      expect(onUpdate).toHaveBeenCalledTimes(1);
    });

    it('should stop polling when task fails', async () => {
      const failedTask = { ...mockTask, status: 'failed' as const };
      vi.mocked(privateClient.get).mockResolvedValue({ data: failedTask });

      const onUpdate = vi.fn();
      const onComplete = vi.fn();
      taskService.pollTask('task-123', onUpdate, onComplete);

      // Wait for initial poll
      await vi.runOnlyPendingTimersAsync();

      expect(onComplete).toHaveBeenCalledWith(failedTask);
    });

    it('should stop polling when task is cancelled', async () => {
      const cancelledTask = { ...mockTask, status: 'cancelled' as const };
      vi.mocked(privateClient.get).mockResolvedValue({ data: cancelledTask });

      const onUpdate = vi.fn();
      const onComplete = vi.fn();
      taskService.pollTask('task-123', onUpdate, onComplete);

      // Wait for initial poll
      await vi.runOnlyPendingTimersAsync();

      expect(onComplete).toHaveBeenCalledWith(cancelledTask);
    });

    it('should call cleanup function to stop polling', async () => {
      vi.mocked(privateClient.get).mockResolvedValue({ data: mockTask });

      const onUpdate = vi.fn();
      const cleanup = taskService.pollTask('task-123', onUpdate);

      // Wait for initial poll
      await vi.runOnlyPendingTimersAsync();
      const callsAfterInit = onUpdate.mock.calls.length;
      expect(callsAfterInit).toBeGreaterThanOrEqual(1);

      // Stop polling
      cleanup();

      // Advance time and verify no more calls
      await vi.advanceTimersByTimeAsync(10000);
      expect(onUpdate).toHaveBeenCalledTimes(callsAfterInit); // Should not increase
    });

    it('should handle 404 errors by stopping polling', async () => {
      const error = new Error('Not found');
      (error as any).response = { status: 404 };
      vi.mocked(privateClient.get).mockRejectedValue(error);

      const onUpdate = vi.fn();
      const onError = vi.fn();
      taskService.pollTask('task-123', onUpdate, undefined, onError);

      // Wait for initial poll
      await vi.runOnlyPendingTimersAsync();

      expect(onError).toHaveBeenCalledWith(error);
    });

    it('should continue polling on non-404 errors', async () => {
      const error = new Error('Network error');
      (error as any).response = { status: 500 };
      vi.mocked(privateClient.get)
        .mockRejectedValueOnce(error)
        .mockResolvedValue({ data: mockTask });

      const onUpdate = vi.fn();
      const onError = vi.fn();
      const cleanup = taskService.pollTask('task-123', onUpdate, undefined, onError);

      // Wait for initial poll (will fail)
      await vi.runOnlyPendingTimersAsync();
      expect(onError).toHaveBeenCalledWith(error);

      // Wait for next poll (will succeed)
      await vi.advanceTimersByTimeAsync(3000);
      await vi.runOnlyPendingTimersAsync();
      expect(onUpdate).toHaveBeenCalledWith(mockTask);

      cleanup();
    });
  });

  describe('pollConversationTasks', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should poll tasks for a conversation', async () => {
      const mockResponse: TaskListResponse = {
        tasks: [mockTask],
        count: 1,
      };
      vi.mocked(privateClient.get).mockResolvedValue({ data: mockResponse });

      const onUpdate = vi.fn();
      const cleanup = taskService.pollConversationTasks('conv-1', onUpdate);

      // Wait for initial poll
      await vi.runOnlyPendingTimersAsync();

      expect(privateClient.get).toHaveBeenCalledWith('/v1/tasks', {
        params: { conversation_id: 'conv-1' },
      });
      expect(onUpdate).toHaveBeenCalledWith([mockTask]);

      cleanup();
    });

    it('should continue polling even when all tasks complete', async () => {
      const completedTask = { ...mockTask, status: 'completed' as const };
      const mockResponse: TaskListResponse = {
        tasks: [completedTask],
        count: 1,
      };
      vi.mocked(privateClient.get).mockResolvedValue({ data: mockResponse });

      const onUpdate = vi.fn();
      const cleanup = taskService.pollConversationTasks('conv-1', onUpdate);

      // Wait for initial poll
      await vi.runOnlyPendingTimersAsync();
      const callsAfterInit = onUpdate.mock.calls.length;
      expect(callsAfterInit).toBeGreaterThanOrEqual(1);

      // Wait for next poll - should continue polling
      await vi.advanceTimersByTimeAsync(30000);
      await vi.runOnlyPendingTimersAsync();
      expect(onUpdate.mock.calls.length).toBeGreaterThan(callsAfterInit);

      cleanup();
    });

    it('should handle polling errors', async () => {
      const error = new Error('API error');
      vi.mocked(privateClient.get).mockRejectedValue(error);

      const onUpdate = vi.fn();
      const onError = vi.fn();
      const cleanup = taskService.pollConversationTasks('conv-1', onUpdate, onError);

      // Wait for initial poll
      await vi.runOnlyPendingTimersAsync();

      expect(onError).toHaveBeenCalledWith(error);

      cleanup();
    });

    it('should use custom interval', async () => {
      const mockResponse: TaskListResponse = {
        tasks: [mockTask],
        count: 1,
      };
      vi.mocked(privateClient.get).mockResolvedValue({ data: mockResponse });

      const onUpdate = vi.fn();
      const cleanup = taskService.pollConversationTasks('conv-1', onUpdate, undefined, 5000);

      // Wait for initial poll
      await vi.runOnlyPendingTimersAsync();
      const callsAfterInit = onUpdate.mock.calls.length;
      expect(callsAfterInit).toBeGreaterThanOrEqual(1);

      // Wait for custom interval
      await vi.advanceTimersByTimeAsync(5000);
      await vi.runOnlyPendingTimersAsync();
      expect(onUpdate.mock.calls.length).toBeGreaterThan(callsAfterInit);

      cleanup();
    });
  });
});
