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
 * Heading 2 - clamp(20px, 2.5vw, 28px) | Semibold
 * Section headings
 */
export const H2: React.FC<TypographyProps> = ({ children, className = '', style }) => (
  <h2 className={`typo-h2 ${className}`} style={style}>
    {children}
  </h2>
);

/**
 * Heading 3 - clamp(16px, 1.5vw, 20px) | Semibold
 * Subsection headings
 */
export const H3: React.FC<TypographyProps> = ({ children, className = '', style }) => (
  <h3 className={`typo-h3 ${className}`} style={style}>
    {children}
  </h3>
);

/**
 * Heading 4 - clamp(14px, 1.2vw, 18px) | Semibold
 * Card titles, labels
 */
export const H4: React.FC<TypographyProps> = ({ children, className = '', style }) => (
  <h4 className={`typo-h4 ${className}`} style={style}>
    {children}
  </h4>
);

/**
 * Body Large - clamp(16px, 1.5vw, 20px) | Regular
 * Main body text, descriptions
 */
export const BodyLarge: React.FC<TypographyProps> = ({ children, className = '', style }) => (
  <p className={`typo-body-lg ${className}`} style={style}>
    {children}
  </p>
);

/**
 * Body - clamp(14px, 1.2vw, 16px) | Regular
 * Standard body text
 */
export const Body: React.FC<TypographyProps> = ({ children, className = '', style }) => (
  <p className={`typo-body ${className}`} style={style}>
    {children}
  </p>
);

/**
 * Body Small - clamp(12px, 0.9vw, 14px) | Regular
 * Secondary text, descriptions
 */
export const BodySmall: React.FC<TypographyProps> = ({ children, className = '', style }) => (
  <p className={`typo-body-sm ${className}`} style={style}>
    {children}
  </p>
);

/**
 * Caption - clamp(11px, 0.8vw, 13px) | Regular
 * Small text, captions, helper text
 */
export const Caption: React.FC<TypographyProps> = ({ children, className = '', style }) => (
  <span className={`typo-caption ${className}`} style={style}>
    {children}
  </span>
);

/**
 * Tiny - clamp(10px, 0.7vw, 12px) | Regular
 * Very small text, timestamps
 */
export const Tiny: React.FC<TypographyProps> = ({ children, className = '', style }) => (
  <span className={`typo-tiny ${className}`} style={style}>
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

