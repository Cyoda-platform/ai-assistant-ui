import React from 'react';
import { useTextResponsiveContainer, useTextResponsiveStyles } from '@/hooks/useTextResponsiveContainer';

interface TextResponsiveContainerProps {
  children: React.ReactNode;
  content?: string;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'compact' | 'comfortable' | 'auto';
  useInlineStyles?: boolean;
  onClick?: () => void;
  onHover?: () => void;
}

/**
 * A container component that automatically adjusts its size based on text content
 */
const TextResponsiveContainer: React.FC<TextResponsiveContainerProps> = ({
  children,
  content = '',
  className = '',
  style = {},
  variant = 'auto',
  useInlineStyles = false,
  onClick,
  onHover
}) => {
  // Extract text content from children if content prop is not provided
  const textContent = content || extractTextFromChildren(children);
  
  // Get responsive container info
  const containerInfo = useTextResponsiveContainer(textContent, {
    baseClass: 'text-responsive-container'
  });
  
  // Get inline styles if requested
  const inlineStyles = useInlineStyles ? useTextResponsiveStyles(textContent) : {};
  
  // Determine final className
  let finalClassName = containerInfo.className;
  
  // Override with specific variant if provided
  if (variant !== 'auto') {
    finalClassName = `text-responsive-container ${variant}`;
  }
  
  // Add custom className
  if (className) {
    finalClassName = `${finalClassName} ${className}`;
  }
  
  // Combine styles
  const finalStyle = {
    ...inlineStyles,
    ...style
  };

  return (
    <div 
      className={finalClassName}
      style={finalStyle}
      onClick={onClick}
      onMouseEnter={onHover}
      data-text-length={containerInfo.textLength}
      data-size-variant={containerInfo.sizeVariant}
    >
      {children}
    </div>
  );
};

/**
 * Extract text content from React children
 */
function extractTextFromChildren(children: React.ReactNode): string {
  if (typeof children === 'string') {
    return children;
  }
  
  if (typeof children === 'number') {
    return children.toString();
  }
  
  if (React.isValidElement(children)) {
    // Try to extract text from props
    if (children.props.children) {
      return extractTextFromChildren(children.props.children);
    }
    
    // Check for common text props
    if (children.props.text) {
      return children.props.text;
    }
    
    if (children.props.content) {
      return children.props.content;
    }
  }
  
  if (Array.isArray(children)) {
    return children
      .map(child => extractTextFromChildren(child))
      .join(' ');
  }
  
  return '';
}

/**
 * Hook version for use in other components
 */
export const useTextResponsiveContainerProps = (
  content: string,
  options?: {
    baseClass?: string;
    variant?: 'compact' | 'comfortable' | 'auto';
    useInlineStyles?: boolean;
  }
) => {
  const { variant = 'auto', useInlineStyles = false, baseClass } = options || {};
  
  const containerInfo = useTextResponsiveContainer(content, { baseClass });
  const inlineStyles = useInlineStyles ? useTextResponsiveStyles(content) : {};
  
  let className = containerInfo.className;
  if (variant !== 'auto') {
    className = `${baseClass || 'text-responsive-container'} ${variant}`;
  }
  
  return {
    className,
    style: inlineStyles,
    'data-text-length': containerInfo.textLength,
    'data-size-variant': containerInfo.sizeVariant
  };
};

export default TextResponsiveContainer;
