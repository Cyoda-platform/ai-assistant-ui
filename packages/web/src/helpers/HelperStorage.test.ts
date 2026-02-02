import { describe, it, expect, beforeEach, vi } from 'vitest';
import HelperStorage from './HelperStorage';

describe('HelperStorage', () => {
  let storage: HelperStorage;
  let mockStorage: Storage;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    storage = new HelperStorage();
  });

  describe('constructor', () => {
    it('should use localStorage by default', () => {
      const helper = new HelperStorage();
      helper.set('test', 'value');
      expect(localStorage.getItem('test')).toBe('value');
    });

    it('should accept custom storage implementation', () => {
      const customStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(),
      } as unknown as Storage;

      const helper = new HelperStorage(customStorage);
      helper.set('test', 'value');

      expect(customStorage.setItem).toHaveBeenCalledWith('test', 'value');
    });
  });

  describe('set', () => {
    it('should store a string value', () => {
      storage.set('testKey', 'testValue');
      expect(localStorage.getItem('testKey')).toBe('testValue');
    });

    it('should store an object as JSON', () => {
      const obj = { name: 'John', age: 30 };
      storage.set('user', obj);

      const stored = localStorage.getItem('user');
      expect(stored).toBe(JSON.stringify(obj));
    });

    it('should store an array as JSON', () => {
      const arr = [1, 2, 3, 4, 5];
      storage.set('numbers', arr);

      const stored = localStorage.getItem('numbers');
      expect(stored).toBe(JSON.stringify(arr));
    });

    it('should store a number as JSON', () => {
      storage.set('count', 42);

      const stored = localStorage.getItem('count');
      expect(stored).toBe('42');
    });

    it('should store a boolean as JSON', () => {
      storage.set('isActive', true);

      const stored = localStorage.getItem('isActive');
      expect(stored).toBe('true');
    });

    it('should store null as JSON', () => {
      storage.set('empty', null);

      const stored = localStorage.getItem('empty');
      expect(stored).toBe('null');
    });

    it('should overwrite existing values', () => {
      storage.set('key', 'value1');
      storage.set('key', 'value2');

      expect(localStorage.getItem('key')).toBe('value2');
    });
  });

  describe('get', () => {
    it('should retrieve a string value', () => {
      localStorage.setItem('testKey', 'testValue');

      const result = storage.get<string>('testKey');
      expect(result).toBe('testValue');
    });

    it('should retrieve and parse a JSON object', () => {
      const obj = { name: 'John', age: 30 };
      localStorage.setItem('user', JSON.stringify(obj));

      const result = storage.get<typeof obj>('user');
      expect(result).toEqual(obj);
    });

    it('should retrieve and parse a JSON array', () => {
      const arr = [1, 2, 3, 4, 5];
      localStorage.setItem('numbers', JSON.stringify(arr));

      const result = storage.get<number[]>('numbers');
      expect(result).toEqual(arr);
    });

    it('should return null for non-existent keys', () => {
      const result = storage.get('nonExistent');
      expect(result).toBeNull();
    });

    it('should return default value for non-existent keys', () => {
      const result = storage.get('nonExistent', 'defaultValue');
      expect(result).toBe('defaultValue');
    });

    it('should return default value as object', () => {
      const defaultObj = { name: 'Default' };
      const result = storage.get('nonExistent', defaultObj);
      expect(result).toEqual(defaultObj);
    });

    it('should handle non-JSON strings', () => {
      localStorage.setItem('plainText', 'just a string');

      const result = storage.get('plainText');
      expect(result).toBe('just a string');
    });

    it('should parse boolean values', () => {
      localStorage.setItem('flag', 'true');

      const result = storage.get<boolean>('flag');
      expect(result).toBe(true);
    });

    it('should parse number values', () => {
      localStorage.setItem('count', '42');

      const result = storage.get<number>('count');
      expect(result).toBe(42);
    });
  });

  describe('removeItem', () => {
    it('should remove an item from storage', () => {
      localStorage.setItem('testKey', 'testValue');

      storage.removeItem('testKey');

      expect(localStorage.getItem('testKey')).toBeNull();
    });

    it('should not throw error when removing non-existent item', () => {
      expect(() => storage.removeItem('nonExistent')).not.toThrow();
    });

    it('should only remove specified item', () => {
      localStorage.setItem('key1', 'value1');
      localStorage.setItem('key2', 'value2');

      storage.removeItem('key1');

      expect(localStorage.getItem('key1')).toBeNull();
      expect(localStorage.getItem('key2')).toBe('value2');
    });
  });

  describe('clear', () => {
    it('should remove all items from storage', () => {
      localStorage.setItem('key1', 'value1');
      localStorage.setItem('key2', 'value2');
      localStorage.setItem('key3', 'value3');

      storage.clear();

      expect(localStorage.length).toBe(0);
    });

    it('should preserve app:consentDialog key', () => {
      localStorage.setItem('app:consentDialog', 'true');
      localStorage.setItem('otherKey', 'value');

      storage.clear();

      expect(localStorage.getItem('app:consentDialog')).toBe('true');
      expect(localStorage.getItem('otherKey')).toBeNull();
    });

    it('should preserve app:consentDialog even with other items', () => {
      localStorage.setItem('app:consentDialog', JSON.stringify({ accepted: true }));
      localStorage.setItem('user', JSON.stringify({ name: 'John' }));
      localStorage.setItem('settings', JSON.stringify({ theme: 'dark' }));

      storage.clear();

      expect(localStorage.getItem('app:consentDialog')).toBe(JSON.stringify({ accepted: true }));
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('settings')).toBeNull();
      expect(localStorage.length).toBe(1);
    });

    it('should work when app:consentDialog does not exist', () => {
      localStorage.setItem('key1', 'value1');
      localStorage.setItem('key2', 'value2');

      storage.clear();

      expect(localStorage.length).toBe(0);
    });
  });

  describe('isJsonString (private method - tested through get)', () => {
    it('should correctly identify JSON objects', () => {
      localStorage.setItem('json', '{"key":"value"}');
      const result = storage.get('json');
      expect(result).toEqual({ key: 'value' });
    });

    it('should correctly identify JSON arrays', () => {
      localStorage.setItem('json', '[1,2,3]');
      const result = storage.get('json');
      expect(result).toEqual([1, 2, 3]);
    });

    it('should return string for non-JSON values', () => {
      localStorage.setItem('notJson', 'plain text');
      const result = storage.get('notJson');
      expect(result).toBe('plain text');
    });

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem('invalid', '{invalid json}');
      const result = storage.get('invalid');
      expect(result).toBe('{invalid json}');
    });
  });

  describe('complex scenarios', () => {
    it('should handle set and get chain', () => {
      const data = { user: 'John', settings: { theme: 'dark' } };

      storage.set('complexData', data);
      const result = storage.get<typeof data>('complexData');

      expect(result).toEqual(data);
    });

    it('should handle multiple operations', () => {
      storage.set('key1', 'value1');
      storage.set('key2', { nested: 'object' });
      storage.set('key3', [1, 2, 3]);

      expect(storage.get('key1')).toBe('value1');
      expect(storage.get('key2')).toEqual({ nested: 'object' });
      expect(storage.get('key3')).toEqual([1, 2, 3]);

      storage.removeItem('key2');
      expect(storage.get('key2')).toBeNull();

      storage.clear();
      expect(storage.get('key1')).toBeNull();
      expect(storage.get('key3')).toBeNull();
    });

    it('should handle empty strings (returns null due to falsy check)', () => {
      storage.set('empty', '');
      // Note: Empty string is falsy, so get() returns defaultValue (null)
      // This is a quirk of the implementation
      const result = storage.get('empty');
      expect(result).toBeNull();
    });

    it('should handle nested objects with arrays', () => {
      const complex = {
        users: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' }
        ],
        settings: {
          theme: 'dark',
          notifications: true
        }
      };

      storage.set('complex', complex);
      const result = storage.get<typeof complex>('complex');

      expect(result).toEqual(complex);
    });
  });

  describe('edge cases', () => {
    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      storage.set('long', longString);

      const result = storage.get('long');
      expect(result).toBe(longString);
    });

    it('should handle special characters', () => {
      const special = 'Hello 世界 🌍 @#$%^&*()';
      storage.set('special', special);

      const result = storage.get('special');
      expect(result).toBe(special);
    });

    it('should handle undefined in objects', () => {
      const obj = { defined: 'value', undefined: undefined };
      storage.set('withUndefined', obj);

      const result = storage.get<typeof obj>('withUndefined');
      // Note: undefined values are removed during JSON serialization
      expect(result).toEqual({ defined: 'value' });
    });

    it('should handle Date objects', () => {
      const date = new Date('2024-01-01');
      storage.set('date', date);

      const result = storage.get('date');
      // Date is serialized as ISO string
      expect(result).toBe(date.toJSON());
    });
  });
});
