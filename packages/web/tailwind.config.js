/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        // Display (H0)
        'display': ['clamp(32px, 4vw, 48px)', { lineHeight: '1.2', fontWeight: '700' }],
        // Heading 1
        'h1': ['clamp(24px, 3vw, 32px)', { lineHeight: '1.2', fontWeight: '700' }],
        // Heading 2
        'h2': ['clamp(20px, 2.5vw, 28px)', { lineHeight: '1.2', fontWeight: '600' }],
        // Heading 3
        'h3': ['clamp(16px, 1.5vw, 20px)', { lineHeight: '1.2', fontWeight: '600' }],
        // Heading 4
        'h4': ['clamp(14px, 1.2vw, 18px)', { lineHeight: '1.2', fontWeight: '600' }],
        // Body Large
        'body-lg': ['clamp(16px, 1.5vw, 20px)', { lineHeight: '1.5', fontWeight: '400' }],
        // Body
        'body': ['clamp(14px, 1.2vw, 16px)', { lineHeight: '1.5', fontWeight: '400' }],
        // Body Small
        'body-sm': ['clamp(12px, 0.9vw, 14px)', { lineHeight: '1.5', fontWeight: '400' }],
        // Caption
        'caption': ['clamp(11px, 0.8vw, 13px)', { lineHeight: '1.4', fontWeight: '400' }],
        // Tiny
        'tiny': ['clamp(10px, 0.7vw, 12px)', { lineHeight: '1.4', fontWeight: '400' }],
      },
      fontWeight: {
        'regular': '400',
        'semibold': '600',
        'bold': '700',
      },
      colors: {
        // Text colors
        'text-primary': '#ffffff',
        'text-secondary': '#e2e8f0',
        'text-tertiary': '#94a3b8',
        'text-disabled': '#64748b',
        'text-accent-green': '#4ade80',
        'text-accent-teal': '#14b8a6',
      },
    },
  },
}
