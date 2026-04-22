import React from 'react';
import { X } from 'lucide-react';
import { BackgroundVariant } from '@xyflow/react';

interface AppsSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  showMinimap: boolean;
  onToggleMinimap: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  gridVariant: BackgroundVariant;
  onGridVariantChange: (variant: BackgroundVariant) => void;
  edgeType: 'default' | 'straight' | 'step' | 'smoothstep';
  onEdgeTypeChange: (type: 'default' | 'straight' | 'step' | 'smoothstep') => void;
  layoutDirection: 'TB' | 'LR';
  onLayoutDirectionChange: (direction: 'TB' | 'LR') => void;
  theme: string;
  onThemeChange: (theme: string) => void;
}

export const AppsSettings: React.FC<AppsSettingsProps> = ({
  isOpen,
  onClose,
  showMinimap,
  onToggleMinimap,
  showGrid,
  onToggleGrid,
  gridVariant,
  onGridVariantChange,
  edgeType,
  onEdgeTypeChange,
  layoutDirection,
  onLayoutDirectionChange,
  theme,
  onThemeChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-4 right-4 bg-slate-800/95 rounded-lg shadow-2xl border border-slate-700 z-50 w-80">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-white">Settings</h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Minimap Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-slate-300">Show Minimap</label>
          <button
            onClick={onToggleMinimap}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              showMinimap ? 'bg-teal-600' : 'bg-slate-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                showMinimap ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Grid Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-slate-300">Show Grid</label>
          <button
            onClick={onToggleGrid}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              showGrid ? 'bg-teal-600' : 'bg-slate-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                showGrid ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Grid Variant */}
        {showGrid && (
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Grid Style</label>
            <select
              value={gridVariant}
              onChange={(e) => onGridVariantChange(e.target.value as BackgroundVariant)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value={BackgroundVariant.Dots}>Dots</option>
              <option value={BackgroundVariant.Lines}>Lines</option>
              <option value={BackgroundVariant.Cross}>Cross</option>
            </select>
          </div>
        )}

        {/* Edge Type */}
        <div className="space-y-2">
          <label className="text-sm text-slate-300">Edge Type</label>
          <select
            value={edgeType}
            onChange={(e) => onEdgeTypeChange(e.target.value as any)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="default">Default (Bezier)</option>
            <option value="straight">Straight</option>
            <option value="step">Step</option>
            <option value="smoothstep">Smooth Step</option>
          </select>
        </div>

        {/* Layout Direction */}
        <div className="space-y-2">
          <label className="text-sm text-slate-300">Layout Direction</label>
          <select
            value={layoutDirection}
            onChange={(e) => onLayoutDirectionChange(e.target.value as 'TB' | 'LR')}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="TB">Top to Bottom</option>
            <option value="LR">Left to Right</option>
          </select>
          <p className="text-xs text-slate-400">
            Direction for auto-layout algorithm
          </p>
        </div>

        {/* Theme */}
        <div className="space-y-2">
          <label className="text-sm text-slate-300">Color Theme</label>
          <select
            value={theme}
            onChange={(e) => onThemeChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="bluey-orange">Bluey-Orange (Default)</option>
            <option value="greeny-pink">Greeny-Pink</option>
            <option value="cyberpunk">Cyberpunk</option>
          </select>
          <p className="text-xs text-slate-400">
            Visual theme for nodes and edges
          </p>
        </div>

        {/* Node Features */}
        <div className="pt-4 border-t border-slate-700 space-y-2">
          <h4 className="text-sm font-semibold text-slate-200">Node Features</h4>
          <div className="space-y-1 text-xs text-slate-400">
            <p>✓ 8 anchor points per node (top, right, bottom, left + corners)</p>
            <p>✓ Snap to grid (15px) for precise alignment</p>
            <p>✓ Auto horizontal/vertical alignment buttons</p>
            <p>✓ Drag and drop enabled</p>
            <p>✓ Resizable JSON editor panel</p>
            <p>✓ Auto-save with 500ms debouncing</p>
          </div>
        </div>

        {/* Info */}
        <div className="pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-400">
            Settings are saved to localStorage and persist across sessions.
          </p>
        </div>
      </div>
    </div>
  );
};

