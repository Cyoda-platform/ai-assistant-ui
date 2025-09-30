import { useMemo } from 'react';

interface TextResponsiveContainerOptions {
  baseClass?: string;
  compactThreshold?: number;
  comfortableThreshold?: number;
}

/**
 * Hook to determine the appropriate container class based on text content length
 * @param content - The text content to analyze
 * @param options - Configuration options for thresholds and base class
 * @returns Object with className and container properties
 */
export const useTextResponsiveContainer = (
  content: string,
  options: TextResponsiveContainerOptions = {}
) => {
  const {
    baseClass = 'text-responsive-container',
    compactThreshold = 50,
    comfortableThreshold = 200
  } = options;

  const containerInfo = useMemo(() => {
    const textLength = content?.length || 0;
    const wordCount = content?.split(/\s+/).length || 0;
    const lineCount = content?.split('\n').length || 1;

    // Determine size variant based on content analysis
    let sizeVariant = '';
    let estimatedWidth = 'auto';
    let estimatedHeight = 'auto';

    if (textLength <= compactThreshold) {
      sizeVariant = 'compact';
      estimatedWidth = 'min(300px, 90vw)';
      estimatedHeight = 'auto';
    } else if (textLength >= comfortableThreshold) {
      sizeVariant = 'comfortable';
      estimatedWidth = 'min(600px, 90vw)';
      estimatedHeight = 'auto';
    } else {
      // Default size for medium content
      estimatedWidth = 'min(450px, 90vw)';
      estimatedHeight = 'auto';
    }

    // Build className
    const className = [
      baseClass,
      sizeVariant && `${baseClass}.${sizeVariant}`
    ].filter(Boolean).join(' ');

    return {
      className,
      sizeVariant,
      textLength,
      wordCount,
      lineCount,
      estimatedWidth,
      estimatedHeight,
      isCompact: textLength <= compactThreshold,
      isComfortable: textLength >= comfortableThreshold,
      isMedium: textLength > compactThreshold && textLength < comfortableThreshold
    };
  }, [content, baseClass, compactThreshold, comfortableThreshold]);

  return containerInfo;
};

/**
 * Hook to get inline styles for text-responsive container
 * @param content - The text content to analyze
 * @param options - Configuration options
 * @returns Inline styles object
 */
export const useTextResponsiveStyles = (
  content: string,
  options: TextResponsiveContainerOptions = {}
) => {
  const containerInfo = useTextResponsiveContainer(content, options);

  const styles = useMemo(() => {
    const { textLength, wordCount, lineCount } = containerInfo;

    // Calculate dynamic padding based on content
    const basePadding = 16; // 1rem in pixels
    const paddingMultiplier = Math.min(Math.max(textLength / 100, 0.75), 2);
    const verticalPadding = Math.max(basePadding * paddingMultiplier, 12);
    const horizontalPadding = Math.max(basePadding * paddingMultiplier * 1.25, 16);

    // Calculate width based on content
    let maxWidth = '100%';
    if (textLength <= 50) {
      maxWidth = 'min(300px, 90vw)';
    } else if (textLength <= 150) {
      maxWidth = 'min(450px, 90vw)';
    } else if (textLength <= 300) {
      maxWidth = 'min(600px, 90vw)';
    } else {
      maxWidth = 'min(750px, 90vw)';
    }

    return {
      padding: `${verticalPadding}px ${horizontalPadding}px`,
      maxWidth,
      width: 'fit-content',
      minWidth: textLength <= 30 ? '150px' : '200px',
      wordWrap: 'break-word' as const,
      overflowWrap: 'break-word' as const,
      hyphens: 'auto' as const,
      // Remove transitions to prevent layout shifts when messages appear
      // transition: 'all 0.2s ease-in-out',
    };
  }, [containerInfo]);

  return styles;
};

/**
 * Utility function to get container class name based on text length
 * @param textLength - Length of the text content
 * @param baseClass - Base CSS class name
 * @returns Complete class name string
 */
export const getTextResponsiveClassName = (
  textLength: number,
  baseClass: string = 'text-responsive-container'
): string => {
  if (textLength <= 50) {
    return `${baseClass} compact`;
  } else if (textLength >= 200) {
    return `${baseClass} comfortable`;
  }
  return baseClass;
};

export default useTextResponsiveContainer;
