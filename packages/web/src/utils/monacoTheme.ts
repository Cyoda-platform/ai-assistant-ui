/**
 * Shared Monaco editor theme — Cyoda workflow-light
 *
 * Token palette:
 *   keys        #0a6363  Cyoda teal dark  (8.2:1 AAA)
 *   strings     #334155  slate-700        (10.7:1 AAA)
 *   numbers     #c2410c  orange-700       (5.7:1 AA)
 *   keywords    #2563eb  blue-600         (5.9:1 AA)  true/false/null share one token in Monaco JSON
 *   comments    #94a3b8  slate-400
 *   punctuation inherited from vs base
 *   line nums   #cbd5e1 / active #64748b
 *   links       #2563eb  blue-600 + underline
 */

import type { Monaco } from '@monaco-editor/react';

export const WORKFLOW_LIGHT_THEME = 'workflow-light';

type MonacoLike = Monaco | typeof import('monaco-editor');

export function registerWorkflowLightTheme(monaco: MonacoLike): void {
  monaco.editor.defineTheme(WORKFLOW_LIGHT_THEME, {
    base: 'vs',
    inherit: true,
    rules: [
      { token: '',                   foreground: '0f172a' },
      { token: 'string.key.json',   foreground: '0a6363' },
      { token: 'string.value.json', foreground: '334155' },
      { token: 'string',            foreground: '334155' },
      { token: 'number',            foreground: 'c2410c' },
      { token: 'keyword.json',      foreground: '2563eb' },
      { token: 'keyword',           foreground: '2563eb' },
      { token: 'comment',           foreground: '94a3b8', fontStyle: 'italic' },
    ],
    colors: {
      'editor.background':                    '#ffffff',
      'editor.foreground':                    '#0f172a',

      'editorLineNumber.foreground':          '#cbd5e1',
      'editorLineNumber.activeForeground':    '#64748b',
      'editorGutter.background':              '#ffffff',

      'editor.lineHighlightBackground':       '#0a636308',
      'editor.lineHighlightBorder':           '#00000000',

      'editorCursor.foreground':              '#0a6363',

      'editor.selectionBackground':           '#0a636320',
      'editor.inactiveSelectionBackground':   '#0a636310',

      'editorMinimap.background':             '#f8fafc',
      'minimapSlider.background':             '#cbd5e180',
      'minimapSlider.hoverBackground':        '#94a3b8',
      'minimapSlider.activeBackground':       '#64748b',

      'editorStickyScroll.background':        '#ffffff',
      'editorStickyScrollHover.background':   '#f8fafc',

      'scrollbar.shadow':                     '#00000000',
      'scrollbarSlider.background':           '#cbd5e180',
      'scrollbarSlider.hoverBackground':      '#94a3b8a0',
      'scrollbarSlider.activeBackground':     '#64748b',

      'editorBracketMatch.background':        '#0a636315',
      'editorBracketMatch.border':            '#0a6363',

      'editorWidget.background':              '#ffffff',
      'editorWidget.border':                  '#e2e8f0',
      'editorSuggestWidget.background':       '#ffffff',
      'editorSuggestWidget.border':           '#e2e8f0',
      'editorSuggestWidget.selectedBackground': '#f1f5f9',
      'editorHoverWidget.background':         '#ffffff',
      'editorHoverWidget.border':             '#e2e8f0',

      'editorIndentGuide.background1':        '#e2e8f0',
      'editorIndentGuide.activeBackground1':  '#cbd5e1',

      'textLink.foreground':                  '#2563eb',
      'textLink.activeForeground':            '#1d4ed8',
      'editorLink.activeForeground':          '#2563eb',
    },
  });
}
