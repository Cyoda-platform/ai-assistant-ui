import { describe, it, expect } from 'vitest';
import {
  parseMarkdownOptions,
  removeMarkdownOptions,
  extractMarkdownOptions,
  type MarkdownOptionsData,
} from './markdownOptionsParser';

describe('markdownOptionsParser', () => {
  describe('parseMarkdownOptions', () => {
    it('should return null for empty string', () => {
      expect(parseMarkdownOptions('')).toBeNull();
    });

    it('should return null for non-string input', () => {
      expect(parseMarkdownOptions(null as any)).toBeNull();
      expect(parseMarkdownOptions(undefined as any)).toBeNull();
    });

    it('should return null for text without options', () => {
      expect(parseMarkdownOptions('Just some regular text')).toBeNull();
    });

    it('should parse single-choice options', () => {
      const text = 'Choose one: [options-single-choice: Apple, Banana, Cherry]';
      const result = parseMarkdownOptions(text);

      expect(result).toBeDefined();
      expect(result?.type).toBe('single');
      expect(result?.options).toHaveLength(3);
      expect(result?.options[0]).toEqual({ label: 'Apple', value: 'apple' });
      expect(result?.options[1]).toEqual({ label: 'Banana', value: 'banana' });
      expect(result?.options[2]).toEqual({ label: 'Cherry', value: 'cherry' });
    });

    it('should parse multiple-choice options', () => {
      const text = 'Select multiple: [options-multiple-choice: Red, Green, Blue]';
      const result = parseMarkdownOptions(text);

      expect(result).toBeDefined();
      expect(result?.type).toBe('multiple');
      expect(result?.options).toHaveLength(3);
    });

    it('should capitalize option labels', () => {
      const text = '[options-single-choice: apple, banana, cherry]';
      const result = parseMarkdownOptions(text);

      expect(result?.options[0].label).toBe('Apple');
      expect(result?.options[1].label).toBe('Banana');
      expect(result?.options[2].label).toBe('Cherry');
    });

    it('should convert labels to snake_case values', () => {
      const text = '[options-single-choice: First Option, Second Option, Third Option]';
      const result = parseMarkdownOptions(text);

      expect(result?.options[0].value).toBe('first_option');
      expect(result?.options[1].value).toBe('second_option');
      expect(result?.options[2].value).toBe('third_option');
    });

    it('should handle options with parentheses', () => {
      const text = '[options-single-choice: Option A (best), Option B (good), Option C (okay)]';
      const result = parseMarkdownOptions(text);

      expect(result?.options).toHaveLength(3);
      expect(result?.options[0].label).toBe('Option A (best)');
      expect(result?.options[1].label).toBe('Option B (good)');
      expect(result?.options[2].label).toBe('Option C (okay)');
    });

    it('should extract text before and after options', () => {
      const text = 'Question here\n[options-single-choice: Yes, No]\nMore text after';
      const result = parseMarkdownOptions(text);

      expect(result?.textBeforeOptions).toBe('Question here');
      expect(result?.textAfterOptions).toBe('More text after');
    });

    it('should handle case-insensitive option tags', () => {
      const text = '[OPTIONS-SINGLE-CHOICE: A, B, C]';
      const result = parseMarkdownOptions(text);

      expect(result).toBeDefined();
      expect(result?.type).toBe('single');
      expect(result?.options).toHaveLength(3);
    });

    it('should trim whitespace from options', () => {
      const text = '[options-single-choice:   Apple  ,  Banana  ,   Cherry  ]';
      const result = parseMarkdownOptions(text);

      expect(result?.options[0].label).toBe('Apple');
      expect(result?.options[1].label).toBe('Banana');
      expect(result?.options[2].label).toBe('Cherry');
    });

    it('should handle repeated prefix pattern', () => {
      const text = '[options-single-choice: Focus: Priority 1. , Focus: Priority 2. , Focus: Priority 3]';
      const result = parseMarkdownOptions(text);

      expect(result?.options).toHaveLength(3);
      expect(result?.options[0].label).toContain('Focus:');
      expect(result?.options[1].label).toContain('Focus:');
      expect(result?.options[2].label).toContain('Focus:');
    });
  });

  describe('removeMarkdownOptions', () => {
    it('should return original text for empty string', () => {
      expect(removeMarkdownOptions('')).toBe('');
    });

    it('should return original text for non-string input', () => {
      expect(removeMarkdownOptions(null as any)).toBeNull();
      expect(removeMarkdownOptions(undefined as any)).toBeUndefined();
    });

    it('should remove single-choice options', () => {
      const text = 'Question [options-single-choice: A, B, C] More text';
      const result = removeMarkdownOptions(text);

      expect(result).toBe('Question  More text');
    });

    it('should remove multiple-choice options', () => {
      const text = 'Question [options-multiple-choice: X, Y, Z] More text';
      const result = removeMarkdownOptions(text);

      expect(result).toBe('Question  More text');
    });

    it('should remove all option tags in text', () => {
      const text = '[options-single-choice: A, B] and [options-multiple-choice: X, Y]';
      const result = removeMarkdownOptions(text);

      expect(result).not.toContain('[options-');
      expect(result).toBe('and');
    });

    it('should handle case-insensitive removal', () => {
      const text = '[OPTIONS-SINGLE-CHOICE: A, B, C]';
      const result = removeMarkdownOptions(text);

      expect(result).toBe('');
    });
  });

  describe('extractMarkdownOptions', () => {
    it('should return original text when no options present', () => {
      const text = 'Just regular text';
      const result = extractMarkdownOptions(text);

      expect(result.cleanText).toBe(text);
      expect(result.optionsData).toBeNull();
    });

    it('should extract options and clean text', () => {
      const text = 'Question\n[options-single-choice: Yes, No]\nMore info';
      const result = extractMarkdownOptions(text);

      expect(result.cleanText).toBe('Question\n\nMore info');
      expect(result.optionsData).toBeDefined();
      expect(result.optionsData?.type).toBe('single');
      expect(result.optionsData?.options).toHaveLength(2);
    });

    it('should handle text with only options', () => {
      const text = '[options-single-choice: A, B, C]';
      const result = extractMarkdownOptions(text);

      expect(result.cleanText).toBe('');
      expect(result.optionsData).toBeDefined();
    });

    it('should combine text before and after with double newline', () => {
      const text = 'Before\n[options-single-choice: X, Y]\nAfter';
      const result = extractMarkdownOptions(text);

      expect(result.cleanText).toBe('Before\n\nAfter');
    });

    it('should handle options at the beginning', () => {
      const text = '[options-single-choice: A, B]\nText after';
      const result = extractMarkdownOptions(text);

      expect(result.cleanText).toBe('Text after');
      expect(result.optionsData).toBeDefined();
    });

    it('should handle options at the end', () => {
      const text = 'Text before\n[options-single-choice: A, B]';
      const result = extractMarkdownOptions(text);

      expect(result.cleanText).toBe('Text before');
      expect(result.optionsData).toBeDefined();
    });
  });
});
