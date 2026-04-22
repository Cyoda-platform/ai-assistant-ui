import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import streamingService from './streamingService';
import type { SSEChatEvent, SSETaskEvent } from '@/types/streaming';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock EventSource
class MockEventSource {
  public url: string;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  private listeners: Map<string, ((event: MessageEvent) => void)[]> = new Map();

  constructor(url: string) {
    this.url = url;
  }

  addEventListener(type: string, listener: (event: MessageEvent) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(listener);
  }

  dispatchEvent(type: string, data: any) {
    const listeners = this.listeners.get(type) || [];
    const event = new MessageEvent(type, { data: JSON.stringify(data) });
    listeners.forEach(listener => listener(event));
  }

  close() {
    this.listeners.clear();
  }
}

global.EventSource = MockEventSource as any;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('streamingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    // Reset circuit breaker
    streamingService.resetCircuitBreaker();
    // Clean up old states
    streamingService.cleanupOldStates();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('circuit breaker', () => {
    it('should start in CLOSED state', () => {
      const health = streamingService.getHealthStatus();
      expect(health.circuitBreaker.state).toBe('CLOSED');
      expect(health.circuitBreaker.failures).toBe(0);
    });

    it('should open circuit breaker after threshold failures', async () => {
      // Mock fetch to fail
      mockFetch.mockRejectedValue(new Error('Network error'));

      const onEvent = vi.fn();
      const onError = vi.fn();

      // Trigger 5 failures to reach threshold
      for (let i = 0; i < 5; i++) {
        try {
          await streamingService.streamChatMessage(
            `conv-${i}`,
            'test',
            'token',
            onEvent,
            onError
          );
        } catch (error) {
          // Expected
        }
        // Wait for retries to complete
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const health = streamingService.getHealthStatus();
      expect(health.circuitBreaker.state).toBe('OPEN');
      expect(health.circuitBreaker.failures).toBeGreaterThanOrEqual(5);
    });

    it('should reject requests when circuit breaker is OPEN', async () => {
      // Force circuit breaker to OPEN by setting failures
      for (let i = 0; i < 5; i++) {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));
        try {
          await streamingService.streamChatMessage(`conv-${i}`, 'test', 'token', vi.fn(), vi.fn());
        } catch (error) {
          // Expected
        }
      }

      const onEvent = vi.fn();
      const onError = vi.fn();

      await expect(
        streamingService.streamChatMessage('conv-new', 'test', 'token', onEvent, onError)
      ).rejects.toThrow('Circuit breaker is OPEN');

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'CircuitBreakerError'
        })
      );
    });

    it('should reset circuit breaker manually', () => {
      // Set failures
      mockFetch.mockRejectedValue(new Error('Network error'));

      streamingService.resetCircuitBreaker();

      const health = streamingService.getHealthStatus();
      expect(health.circuitBreaker.state).toBe('CLOSED');
      expect(health.circuitBreaker.failures).toBe(0);
    });
  });

  describe('parseSSEMessage', () => {
    it('should parse SSE message with event and data', () => {
      // Access private method through type assertion
      const service = streamingService as any;
      const message = 'event: content\ndata: {"type":"content","chunk":"Hello","accumulated_length":5,"timestamp":"2024-01-01T00:00:00Z"}';

      const parsed = service.parseSSEMessage(message);

      expect(parsed).toEqual({
        type: 'content',
        chunk: 'Hello',
        accumulated_length: 5,
        timestamp: '2024-01-01T00:00:00Z'
      });
    });

    it('should parse SSE message with id', () => {
      const service = streamingService as any;
      const message = 'event: content\nid: event-123\ndata: {"type":"content","chunk":"test","accumulated_length":4,"timestamp":"2024-01-01T00:00:00Z"}';

      const parsed = service.parseSSEMessage(message);

      expect(parsed).toEqual({
        type: 'content',
        chunk: 'test',
        accumulated_length: 4,
        timestamp: '2024-01-01T00:00:00Z',
        id: 'event-123'
      });
    });

    it('should return null for invalid JSON', () => {
      const service = streamingService as any;
      const message = 'event: content\ndata: invalid json';

      const parsed = service.parseSSEMessage(message);

      expect(parsed).toBeNull();
    });

    it('should set type from event field if not in data', () => {
      const service = streamingService as any;
      const message = 'event: custom_event\ndata: {"timestamp":"2024-01-01T00:00:00Z"}';

      const parsed = service.parseSSEMessage(message);

      expect(parsed?.type).toBe('custom_event');
    });
  });

  describe('streamChatMessage', () => {
    it('should abort existing stream for same conversation', async () => {
      // Create a promise that never resolves to keep first stream hanging
      let resolveRead: any;
      const hangingRead = new Promise(resolve => { resolveRead = resolve; });

      const mockResponse1 = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn().mockReturnValue(hangingRead)
          })
        }
      };

      const mockResponse2 = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({ done: true })
          })
        }
      };

      mockFetch
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const onEvent1 = vi.fn();
      const onEvent2 = vi.fn();

      // Start first stream (don't await - let it hang)
      const promise1 = streamingService.streamChatMessage(
        'conv-1',
        'message 1',
        'token',
        onEvent1
      );

      // Wait a bit for first stream to start
      await new Promise(resolve => setTimeout(resolve, 10));

      // Start second stream for same conversation (should abort first)
      const controller2 = await streamingService.streamChatMessage(
        'conv-1',
        'message 2',
        'token',
        onEvent2
      );

      // Second controller should not be aborted
      expect(controller2.signal.aborted).toBe(false);

      // Clean up: resolve the hanging promise
      resolveRead({ done: true });
      await promise1.catch(() => {}); // Ignore abort error
    });

    it('should handle successful stream', async () => {
      const events = [
        'event: start\ndata: {"type":"start","message":"Starting","timestamp":"2024-01-01T00:00:00Z"}\n\n',
        'event: content\ndata: {"type":"content","chunk":"Hello ","accumulated_length":6,"timestamp":"2024-01-01T00:00:00Z"}\n\n',
        'event: content\ndata: {"type":"content","chunk":"World","accumulated_length":11,"timestamp":"2024-01-01T00:00:00Z"}\n\n',
        'event: done\ndata: {"type":"done","message":"Complete","response":"Hello World","timestamp":"2024-01-01T00:00:00Z"}\n\n'
      ];

      let readIndex = 0;
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn().mockImplementation(() => {
              if (readIndex < events.length) {
                return Promise.resolve({
                  done: false,
                  value: new TextEncoder().encode(events[readIndex++])
                });
              }
              return Promise.resolve({ done: true });
            })
          })
        }
      };

      mockFetch.mockResolvedValue(mockResponse);

      const onEvent = vi.fn();
      const onComplete = vi.fn();

      await streamingService.streamChatMessage(
        'conv-1',
        'test message',
        'token',
        onEvent,
        undefined,
        onComplete
      );

      // Wait for stream to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(onEvent).toHaveBeenCalledTimes(4);
      expect(onEvent).toHaveBeenNthCalledWith(1, expect.objectContaining({ type: 'start' }));
      expect(onEvent).toHaveBeenNthCalledWith(2, expect.objectContaining({ type: 'content', chunk: 'Hello ' }));
      expect(onEvent).toHaveBeenNthCalledWith(3, expect.objectContaining({ type: 'content', chunk: 'World' }));
      expect(onEvent).toHaveBeenNthCalledWith(4, expect.objectContaining({ type: 'done' }));
      expect(onComplete).toHaveBeenCalled();
    });

    it('should handle HTTP error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500
      });

      const onEvent = vi.fn();
      const onError = vi.fn();

      await streamingService.streamChatMessage(
        'conv-1',
        'test',
        'token',
        onEvent,
        onError
      );

      // Wait for error handling
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('HTTP error')
        })
      );
    });

    it('should send request with files as FormData', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({ done: true })
          })
        }
      };

      mockFetch.mockResolvedValue(mockResponse);

      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      await streamingService.streamChatMessage(
        'conv-1',
        'test message',
        'token',
        vi.fn(),
        undefined,
        undefined,
        [file]
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      );

      const callArgs = mockFetch.mock.calls[0][1];
      const formData = callArgs.body as FormData;
      expect(formData.get('message')).toBe('test message');
      expect(formData.get('files')).toBeInstanceOf(File);
    });

    it('should send request with JSON when no files', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({ done: true })
          })
        }
      };

      mockFetch.mockResolvedValue(mockResponse);

      await streamingService.streamChatMessage(
        'conv-1',
        'test message',
        'token',
        vi.fn()
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ message: 'test message' })
        })
      );
    });
  });

  describe('stream persistence', () => {
    it('should save stream state to localStorage', async () => {
      const events = [
        'event: content\ndata: {"type":"content","chunk":"Hello","accumulated_length":5,"timestamp":"2024-01-01T00:00:00Z"}\n\n'
      ];

      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(events[0]) })
              .mockResolvedValueOnce({ done: true })
          })
        }
      };

      mockFetch.mockResolvedValue(mockResponse);

      await streamingService.streamChatMessage(
        'conv-persist',
        'test',
        'token',
        vi.fn(),
        undefined,
        vi.fn()
      );

      // Wait for stream to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // State should be cleared after successful completion
      const stored = localStorage.getItem('stream_state_conv-persist');
      expect(stored).toBeNull();
    });

    it('should recover from localStorage on retry', async () => {
      // Set up previous state
      const previousState = {
        accumulatedContent: 'Previous content ',
        lastEventId: 'event-123',
        timestamp: Date.now(),
        conversationId: 'conv-recover',
        message: 'test'
      };
      localStorage.setItem('stream_state_conv-recover', JSON.stringify(previousState));

      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({ done: true })
          })
        }
      };

      mockFetch.mockResolvedValue(mockResponse);

      const onEvent = vi.fn();

      await streamingService.streamChatMessage(
        'conv-recover',
        'test',
        'token',
        onEvent
      );

      // Should emit recovery event with accumulated content
      expect(onEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'content',
          accumulated_length: previousState.accumulatedContent.length
        })
      );

      // Should send Last-Event-ID header
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Last-Event-ID': 'event-123'
          })
        })
      );
    });

    it('should ignore stale state older than 5 minutes', async () => {
      const staleState = {
        accumulatedContent: 'Stale content',
        lastEventId: 'event-old',
        timestamp: Date.now() - 400000, // 6+ minutes old
        conversationId: 'conv-stale',
        message: 'test'
      };
      localStorage.setItem('stream_state_conv-stale', JSON.stringify(staleState));

      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({ done: true })
          })
        }
      };

      mockFetch.mockResolvedValue(mockResponse);

      await streamingService.streamChatMessage(
        'conv-stale',
        'test',
        'token',
        vi.fn()
      );

      // Should NOT send Last-Event-ID header for stale state
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Last-Event-ID': expect.any(String)
          })
        })
      );
    });
  });

  describe('streamTaskProgress', () => {
    it('should create EventSource and listen to events', () => {
      const onEvent = vi.fn();
      const onComplete = vi.fn();

      const eventSource = streamingService.streamTaskProgress(
        'task-123',
        'token',
        onEvent,
        undefined,
        onComplete
      );

      expect(eventSource).toBeInstanceOf(MockEventSource);
      expect(eventSource.url).toContain('task-123');
      expect(eventSource.url).toContain('poll_interval=3');
    });

    it('should handle start event', () => {
      const onEvent = vi.fn();

      const eventSource = streamingService.streamTaskProgress(
        'task-123',
        'token',
        onEvent
      ) as any;

      eventSource.dispatchEvent('start', {
        task_id: 'task-123',
        message: 'Starting task',
        timestamp: '2024-01-01T00:00:00Z'
      });

      expect(onEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'start',
          task_id: 'task-123'
        })
      );
    });

    it('should handle progress event', () => {
      const onEvent = vi.fn();

      const eventSource = streamingService.streamTaskProgress(
        'task-123',
        'token',
        onEvent
      ) as any;

      eventSource.dispatchEvent('progress', {
        task_id: 'task-123',
        progress: 50,
        status: 'running',
        timestamp: '2024-01-01T00:00:00Z'
      });

      expect(onEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'progress',
          progress: 50
        })
      );
    });

    it('should handle done event and close connection', () => {
      const onEvent = vi.fn();
      const onComplete = vi.fn();

      const eventSource = streamingService.streamTaskProgress(
        'task-123',
        'token',
        onEvent,
        undefined,
        onComplete
      ) as any;

      const closeSpy = vi.spyOn(eventSource, 'close');

      eventSource.dispatchEvent('done', {
        task_id: 'task-123',
        message: 'Task complete',
        timestamp: '2024-01-01T00:00:00Z'
      });

      expect(onEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'done'
        })
      );
      expect(onComplete).toHaveBeenCalled();
      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('health monitoring', () => {
    it('should track successful streams', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({ done: true })
          })
        }
      };

      mockFetch.mockResolvedValue(mockResponse);

      const initialHealth = streamingService.getHealthStatus();
      const initialSuccessful = initialHealth.stats.successfulStreams;

      await streamingService.streamChatMessage(
        'conv-1',
        'test',
        'token',
        vi.fn(),
        undefined,
        vi.fn()
      );

      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 100));

      const health = streamingService.getHealthStatus();
      expect(health.stats.successfulStreams).toBe(initialSuccessful + 1);
      expect(health.stats.successRate).toBeGreaterThan(0);
    });

    it('should track failed streams', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const initialHealth = streamingService.getHealthStatus();
      const initialFailed = initialHealth.stats.failedStreams;

      const onError = vi.fn();

      await streamingService.streamChatMessage(
        'conv-fail',
        'test',
        'token',
        vi.fn(),
        onError
      );

      // Wait for error handling
      await new Promise(resolve => setTimeout(resolve, 100));

      const health = streamingService.getHealthStatus();
      expect(health.stats.failedStreams).toBeGreaterThan(initialFailed);
    });

    it('should calculate success rate', () => {
      const health = streamingService.getHealthStatus();

      expect(health.stats).toHaveProperty('successRate');
      expect(typeof health.stats.successRate).toBe('number');
      expect(health.stats.successRate).toBeGreaterThanOrEqual(0);
      expect(health.stats.successRate).toBeLessThanOrEqual(100);
    });
  });

  describe('utility methods', () => {
    it('should abort stream via controller', () => {
      const controller = new AbortController();
      streamingService.abortStream(controller);

      expect(controller.signal.aborted).toBe(true);
    });

    it('should close EventSource', () => {
      const eventSource = new MockEventSource('http://test.com') as any;
      const closeSpy = vi.spyOn(eventSource, 'close');

      streamingService.closeEventSource(eventSource);

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should reset reconnection attempts', () => {
      streamingService.resetReconnectionAttempts();
      // Just verify it doesn't throw - internal state not directly accessible
      expect(true).toBe(true);
    });

    it('should manually retry chat message', async () => {
      const mockResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({ done: true })
          })
        }
      };

      mockFetch.mockResolvedValue(mockResponse);

      const controller = await streamingService.retryChatMessage(
        'conv-retry',
        'test',
        'token',
        vi.fn()
      );

      expect(controller).toBeInstanceOf(AbortController);
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should cleanup old stream states', () => {
      const service = streamingService as any;

      // Add old state
      const oldState = {
        accumulatedContent: 'old',
        lastEventId: 'old-id',
        timestamp: Date.now() - 400000, // 6+ minutes old
        conversationId: 'conv-old',
        message: 'test'
      };
      service.streamStates.set('conv-old', oldState);
      localStorage.setItem('stream_state_conv-old', JSON.stringify(oldState));

      streamingService.cleanupOldStates();

      // Old state should be removed
      expect(service.streamStates.has('conv-old')).toBe(false);
      expect(localStorage.getItem('stream_state_conv-old')).toBeNull();
    });

    it('should keep recent stream states', () => {
      const service = streamingService as any;

      // Add recent state
      const recentState = {
        accumulatedContent: 'recent',
        lastEventId: 'recent-id',
        timestamp: Date.now() - 60000, // 1 minute old
        conversationId: 'conv-recent',
        message: 'test'
      };
      service.streamStates.set('conv-recent', recentState);

      streamingService.cleanupOldStates();

      // Recent state should be kept
      expect(service.streamStates.has('conv-recent')).toBe(true);
    });
  });
});
