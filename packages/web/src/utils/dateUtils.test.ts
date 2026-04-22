import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatRelativeTime } from './dateUtils';

describe('dateUtils', () => {
  describe('formatRelativeTime', () => {
    let mockNow: Date;

    beforeEach(() => {
      // Mock current time to 2024-01-15 12:00:00
      mockNow = new Date('2024-01-15T12:00:00Z');
      vi.setSystemTime(mockNow);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return "Unknown" for empty string', () => {
      expect(formatRelativeTime('')).toBe('Unknown');
    });

    it('should return "Just now" for dates less than 1 hour ago', () => {
      const date30MinsAgo = new Date('2024-01-15T11:30:00Z').toISOString();
      expect(formatRelativeTime(date30MinsAgo)).toBe('Just now');
    });

    it('should return "Just now" for dates 0 hours ago', () => {
      const dateNow = new Date('2024-01-15T12:00:00Z').toISOString();
      expect(formatRelativeTime(dateNow)).toBe('Just now');
    });

    it('should return "1 hour ago" for dates exactly 1 hour ago', () => {
      const date1HourAgo = new Date('2024-01-15T11:00:00Z').toISOString();
      expect(formatRelativeTime(date1HourAgo)).toBe('1 hour ago');
    });

    it('should return "5 hours ago" for dates 5 hours ago', () => {
      const date5HoursAgo = new Date('2024-01-15T07:00:00Z').toISOString();
      expect(formatRelativeTime(date5HoursAgo)).toBe('5 hours ago');
    });

    it('should return "23 hours ago" for dates 23 hours ago', () => {
      const date23HoursAgo = new Date('2024-01-14T13:00:00Z').toISOString();
      expect(formatRelativeTime(date23HoursAgo)).toBe('23 hours ago');
    });

    it('should return "1 day ago" for dates 1 day ago', () => {
      const date1DayAgo = new Date('2024-01-14T11:00:00Z').toISOString();
      expect(formatRelativeTime(date1DayAgo)).toBe('1 day ago');
    });

    it('should return "3 days ago" for dates 3 days ago', () => {
      const date3DaysAgo = new Date('2024-01-12T12:00:00Z').toISOString();
      expect(formatRelativeTime(date3DaysAgo)).toBe('3 days ago');
    });

    it('should return "6 days ago" for dates 6 days ago', () => {
      const date6DaysAgo = new Date('2024-01-09T12:00:00Z').toISOString();
      expect(formatRelativeTime(date6DaysAgo)).toBe('6 days ago');
    });

    it('should return formatted date for dates 7 or more days ago', () => {
      const date7DaysAgo = new Date('2024-01-08T12:00:00Z').toISOString();
      const result = formatRelativeTime(date7DaysAgo);
      // Result will be in local format like "1/8/2024" or "08/01/2024"
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should return formatted date for dates several weeks ago', () => {
      const dateOld = new Date('2023-12-01T12:00:00Z').toISOString();
      const result = formatRelativeTime(dateOld);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should handle invalid date strings gracefully', () => {
      const result = formatRelativeTime('invalid-date');
      // Invalid dates will return 'Invalid Date' when converted
      expect(result).toBeDefined();
    });
  });
});
