import { describe, it, expect, vi, beforeEach } from 'vitest';
import eventBus from './eventBus';

describe('eventBus', () => {
  beforeEach(() => {
    // Clean up all listeners between tests
    eventBus.$off('test-event');
    eventBus.$off('multiple-event');
    eventBus.$off('data-event');
  });

  describe('$on', () => {
    it('should register an event listener', () => {
      const callback = vi.fn();
      eventBus.$on('test-event', callback);
      eventBus.$emit('test-event');

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should call listener with emitted data', () => {
      const callback = vi.fn();
      const testData = { message: 'hello' };

      eventBus.$on('data-event', callback);
      eventBus.$emit('data-event', testData);

      expect(callback).toHaveBeenCalledWith(testData);
    });

    it('should support multiple listeners for same event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.$on('multiple-event', callback1);
      eventBus.$on('multiple-event', callback2);
      eventBus.$emit('multiple-event');

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should call listener multiple times when event emitted multiple times', () => {
      const callback = vi.fn();

      eventBus.$on('test-event', callback);
      eventBus.$emit('test-event');
      eventBus.$emit('test-event');
      eventBus.$emit('test-event');

      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('should not call listener for different event', () => {
      const callback = vi.fn();

      eventBus.$on('event-a', callback);
      eventBus.$emit('event-b');

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('$once', () => {
    it('should register a one-time event listener', () => {
      const callback = vi.fn();

      eventBus.$once('test-event', callback);
      eventBus.$emit('test-event');
      eventBus.$emit('test-event');

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should call one-time listener with data', () => {
      const callback = vi.fn();
      const testData = { value: 42 };

      eventBus.$once('data-event', callback);
      eventBus.$emit('data-event', testData);

      expect(callback).toHaveBeenCalledWith(testData);
    });

    it('should work with multiple one-time listeners', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.$once('multiple-event', callback1);
      eventBus.$once('multiple-event', callback2);
      eventBus.$emit('multiple-event');

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      eventBus.$emit('multiple-event');

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe('$off', () => {
    it('should remove specific event listener', () => {
      const callback = vi.fn();

      eventBus.$on('test-event', callback);
      eventBus.$off('test-event', callback);
      eventBus.$emit('test-event');

      expect(callback).not.toHaveBeenCalled();
    });

    it('should remove only specified callback', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.$on('multiple-event', callback1);
      eventBus.$on('multiple-event', callback2);
      eventBus.$off('multiple-event', callback1);
      eventBus.$emit('multiple-event');

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should remove all listeners when callback not specified', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.$on('test-event', callback1);
      eventBus.$on('test-event', callback2);
      eventBus.$off('test-event');
      eventBus.$emit('test-event');

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    it('should not throw error when removing non-existent listener', () => {
      expect(() => {
        eventBus.$off('non-existent-event');
      }).not.toThrow();
    });
  });

  describe('$emit', () => {
    it('should emit event without data', () => {
      const callback = vi.fn();

      eventBus.$on('test-event', callback);
      eventBus.$emit('test-event');

      expect(callback).toHaveBeenCalledWith(undefined);
    });

    it('should emit event with data', () => {
      const callback = vi.fn();
      const data = { id: 1, name: 'test' };

      eventBus.$on('data-event', callback);
      eventBus.$emit('data-event', data);

      expect(callback).toHaveBeenCalledWith(data);
    });

    it('should emit event with primitive data', () => {
      const callback = vi.fn();

      eventBus.$on('test-event', callback);
      eventBus.$emit('test-event', 'string data');

      expect(callback).toHaveBeenCalledWith('string data');
    });

    it('should emit event with null data', () => {
      const callback = vi.fn();

      eventBus.$on('test-event', callback);
      eventBus.$emit('test-event', null);

      expect(callback).toHaveBeenCalledWith(null);
    });

    it('should not throw error when emitting event with no listeners', () => {
      expect(() => {
        eventBus.$emit('no-listeners-event');
      }).not.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should support event-driven communication pattern', () => {
      const receiver = vi.fn();

      eventBus.$on('user:login', receiver);
      eventBus.$emit('user:login', { userId: 123, username: 'test' });

      expect(receiver).toHaveBeenCalledWith({ userId: 123, username: 'test' });
    });

    it('should support pub-sub pattern', () => {
      const subscriber1 = vi.fn();
      const subscriber2 = vi.fn();

      eventBus.$on('data:updated', subscriber1);
      eventBus.$on('data:updated', subscriber2);

      eventBus.$emit('data:updated', { timestamp: Date.now() });

      expect(subscriber1).toHaveBeenCalled();
      expect(subscriber2).toHaveBeenCalled();
    });

    it('should support event cleanup pattern', () => {
      const listener = vi.fn();

      eventBus.$on('component:mounted', listener);
      eventBus.$emit('component:mounted');

      eventBus.$off('component:mounted', listener);
      eventBus.$emit('component:mounted');

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should support one-time initialization pattern', () => {
      const initCallback = vi.fn();

      eventBus.$once('app:initialized', initCallback);

      eventBus.$emit('app:initialized');
      eventBus.$emit('app:initialized');
      eventBus.$emit('app:initialized');

      expect(initCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should handle listener errors gracefully', () => {
      const errorListener = () => {
        throw new Error('Listener error');
      };
      const normalListener = vi.fn();

      eventBus.$on('test-event', errorListener);
      eventBus.$on('test-event', normalListener);

      expect(() => {
        eventBus.$emit('test-event');
      }).toThrow('Listener error');

      // Note: behavior depends on TinyEmitter implementation
      // This test documents the current behavior
    });
  });

  describe('event naming conventions', () => {
    it('should support colon-separated event names', () => {
      const callback = vi.fn();

      eventBus.$on('namespace:event:action', callback);
      eventBus.$emit('namespace:event:action');

      expect(callback).toHaveBeenCalled();
    });

    it('should support hyphenated event names', () => {
      const callback = vi.fn();

      eventBus.$on('user-logged-in', callback);
      eventBus.$emit('user-logged-in');

      expect(callback).toHaveBeenCalled();
    });

    it('should support camelCase event names', () => {
      const callback = vi.fn();

      eventBus.$on('dataUpdated', callback);
      eventBus.$emit('dataUpdated');

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('complex data types', () => {
    it('should handle array data', () => {
      const callback = vi.fn();
      const arrayData = [1, 2, 3, 4, 5];

      eventBus.$on('test-event', callback);
      eventBus.$emit('test-event', arrayData);

      expect(callback).toHaveBeenCalledWith(arrayData);
    });

    it('should handle nested object data', () => {
      const callback = vi.fn();
      const nestedData = {
        user: {
          id: 1,
          profile: {
            name: 'Test',
            settings: { theme: 'dark' }
          }
        }
      };

      eventBus.$on('test-event', callback);
      eventBus.$emit('test-event', nestedData);

      expect(callback).toHaveBeenCalledWith(nestedData);
    });

    it('should handle function as data', () => {
      const callback = vi.fn();
      const fnData = () => 'test';

      eventBus.$on('test-event', callback);
      eventBus.$emit('test-event', fnData);

      expect(callback).toHaveBeenCalledWith(fnData);
    });
  });
});
