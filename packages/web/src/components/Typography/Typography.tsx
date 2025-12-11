import React from 'react';

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Display (H0) - clamp(32px, 4vw, 48px) | Bold
 * Used for the largest headings on landing pages
 */
export const Display: React.FC<TypographyProps> = ({ children, className = '', style }) => (
  <h1 className={`typo-display ${className}`} style={style}>
    {children}
  </h1>
);

/**
 * Heading 1 - clamp(24px, 3vw, 32px) | Bold
 * Main page headings
 */
export const H1: React.FC<TypographyProps> = ({ children, className = '', style }) => (
  <h1 className={`typo-h1 ${className}`} style={style}>
    {children}
  </h1>
);

/**
 * Heading 2 - clamp(18px, 2vw, 24px) | Semibold
 * Section headings
 */
export const H2: React.FC<TypographyProps> = ({ children, className = '', style }) => (
  <h2 className={`typo-h2 ${className}`} style={style}>
    {children}
  </h2>
);

/**
 * Heading 3 - clamp(14px, 1.2vw, 18px) | Semibold
 * Subsection headings, card titles
 */
export const H3: React.FC<TypographyProps> = ({ children, className = '', style }) => (
  <h3 className={`typo-h3 ${className}`} style={style}>
    {children}
  </h3>
);

/**
 * Body - clamp(14px, 1.2vw, 16px) | Regular
 * Main body text, descriptions
 */
export const Body: React.FC<TypographyProps> = ({ children, className = '', style }) => (
  <p className={`typo-body ${className}`} style={style}>
    {children}
  </p>
);

/**
 * Body Small - clamp(12px, 0.9vw, 14px) | Regular
 * Secondary text, helper text
 */
export const BodySmall: React.FC<TypographyProps> = ({ children, className = '', style }) => (
  <p className={`typo-body-sm ${className}`} style={style}>
    {children}
  </p>
);

/**
 * Caption - clamp(11px, 0.8vw, 13px) | Regular
 * Small text, captions, labels
 */
export const Caption: React.FC<TypographyProps> = ({ children, className = '', style }) => (
  <span className={`typo-caption ${className}`} style={style}>
    {children}
  </span>
);

/**
 * Caption Uppercase - for labels and badges
 */
export const CaptionUppercase: React.FC<TypographyProps> = ({ children, className = '', style }) => (
  <span className={`typo-caption-uppercase ${className}`} style={style}>
    {children}
  </span>
);

