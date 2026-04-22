/**
 * Markdown Options Parser
 *
 * Parses markdown text for options in the format:
 * - [options-single-choice: Option1, Option2, Option3]
 * - [options-multiple-choice: Option1, Option2, Option3]
 */

export interface MarkdownOption {
  label: string;
  value: string;
}

/**
 * Detect if options have a repeated prefix pattern (like "Focus:", "Option:", etc.)
 * @param text - The options text to analyze
 * @returns The detected prefix or null
 */
function detectRepeatedPrefix(text: string): string | null {
  // Look for patterns like "Word:" or "Word -" or "Word —" at the start
  const prefixMatch = text.match(/^([A-Z][a-zA-Z0-9\s]*[:—-])\s*/);
  if (!prefixMatch) return null;

  const prefix = prefixMatch[1];
  // Check if this prefix appears at least twice (with period-comma separator)
  const pattern = new RegExp(`\\.\\s*,\\s*${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
  const matches = text.match(pattern);

  return matches && matches.length > 0 ? prefix : null;
}

/**
 * Split options string intelligently based on structure
 * @param text - The options text to split
 * @returns Array of option strings
 */
function splitOptionsRespectingParentheses(text: string): string[] {
  // First, try to detect a repeated prefix pattern
  const prefix = detectRepeatedPrefix(text);

  if (prefix) {
    // Split on ". , <prefix>" pattern (period, comma, space, prefix)
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const splitPattern = new RegExp(`\\.\\s*,\\s*(?=${escapedPrefix})`, 'g');
    const parts = text.split(splitPattern);

    // Clean up each part and ensure they all start with capital letter
    return parts.map(part => {
      const trimmed = part.trim();
      // Remove leading period if present
      const cleaned = trimmed.replace(/^\.+\s*/, '');
      // Ensure first character is capitalized
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }).filter(opt => opt.length > 0);
  }

  // Fallback: split on commas while respecting parentheses
  const options: string[] = [];
  let currentOption = '';
  let parenDepth = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '(') {
      parenDepth++;
      currentOption += char;
    } else if (char === ')') {
      parenDepth--;
      currentOption += char;
    } else if (char === ',' && parenDepth === 0) {
      // Split here - comma at depth 0
      const trimmed = currentOption.trim();
      if (trimmed) {
        // Ensure first character is capitalized
        options.push(trimmed.charAt(0).toUpperCase() + trimmed.slice(1));
      }
      currentOption = '';
    } else {
      currentOption += char;
    }
  }

  // Add the last option
  if (currentOption.trim()) {
    const trimmed = currentOption.trim();
    options.push(trimmed.charAt(0).toUpperCase() + trimmed.slice(1));
  }

  return options;
}

export interface MarkdownOptionsData {
  type: 'single' | 'multiple';
  options: MarkdownOption[];
  rawText: string;
  textBeforeOptions: string;
  textAfterOptions: string;
}

/**
 * Parse markdown text for options
 * @param text - The markdown text to parse
 * @returns MarkdownOptionsData if options found, null otherwise
 */
export function parseMarkdownOptions(text: string): MarkdownOptionsData | null {
  if (!text || typeof text !== 'string') {
    return null;
  }

  // Match [options-single-choice: ...] or [options-multiple-choice: ...]
  const singleChoiceRegex = /\[options-single-choice:\s*(.+?)\]/i;
  const multipleChoiceRegex = /\[options-multiple-choice:\s*(.+?)\]/i;

  const singleMatch = text.match(singleChoiceRegex);
  const multipleMatch = text.match(multipleChoiceRegex);

  if (!singleMatch && !multipleMatch) {
    return null;
  }

  const match = singleMatch || multipleMatch;
  const type = singleMatch ? 'single' : 'multiple';
  const rawText = match[0];
  const optionsText = match[1];

  // Split options by comma, but ignore commas inside parentheses
  const optionLabels = splitOptionsRespectingParentheses(optionsText)
    .map(opt => opt.trim())
    .filter(opt => opt.length > 0);

  // Create option objects with capitalized labels
  const options: MarkdownOption[] = optionLabels.map(label => {
    // Ensure label starts with capital letter
    const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);
    return {
      label: capitalizedLabel,
      value: label.toLowerCase().replace(/\s+/g, '_') // Convert to snake_case value
    };
  });

  // Split text into before and after options
  const matchIndex = text.indexOf(rawText);
  const textBeforeOptions = text.substring(0, matchIndex).trim();
  const textAfterOptions = text.substring(matchIndex + rawText.length).trim();

  return {
    type,
    options,
    rawText,
    textBeforeOptions,
    textAfterOptions
  };
}

/**
 * Remove the options line from markdown text
 * @param text - The markdown text
 * @returns Text with options line removed
 */
export function removeMarkdownOptions(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // Remove [options-single-choice: ...] or [options-multiple-choice: ...] lines
  return text
    .replace(/\[options-single-choice:\s*.+?\]/gi, '')
    .replace(/\[options-multiple-choice:\s*.+?\]/gi, '')
    .trim();
}

/**
 * Get the text without options formatting
 * @param text - The markdown text
 * @returns Object with clean text and options data if found
 */
export function extractMarkdownOptions(text: string): {
  cleanText: string;
  optionsData: MarkdownOptionsData | null;
} {
  const optionsData = parseMarkdownOptions(text);

  if (!optionsData) {
    return {
      cleanText: text,
      optionsData: null
    };
  }

  // Combine text before and after options
  const cleanText = [
    optionsData.textBeforeOptions,
    optionsData.textAfterOptions
  ]
    .filter(t => t.length > 0)
    .join('\n\n');

  return {
    cleanText,
    optionsData
  };
}
