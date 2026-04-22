import React from 'react';
import { X, Mouse, Keyboard, ZoomIn, Move } from 'lucide-react';

interface AppsQuickHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppsQuickHelp: React.FC<AppsQuickHelpProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-4 right-4 bg-slate-800/95 rounded-lg shadow-2xl border border-slate-700 z-50 w-96">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-white">Quick Help</h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
        {/* Mouse Controls */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-teal-400">
            <Mouse size={18} />
            <h4 className="font-semibold">Mouse Controls</h4>
          </div>
          <div className="space-y-1 text-sm text-slate-300 ml-6">
            <p><span className="text-white font-medium">Click & Drag Node:</span> Move nodes</p>
            <p><span className="text-white font-medium">Click & Drag Edge:</span> Reconnect to different anchor</p>
            <p><span className="text-white font-medium">Drag from Anchor:</span> Create new connection</p>
            <p><span className="text-white font-medium">Click & Drag Canvas:</span> Pan view</p>
            <p><span className="text-white font-medium">Scroll Wheel:</span> Zoom in/out</p>
            <p><span className="text-white font-medium">Click Node:</span> View details</p>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-teal-400">
            <Keyboard size={18} />
            <h4 className="font-semibold">Keyboard Shortcuts</h4>
          </div>
          <div className="space-y-1 text-sm text-slate-300 ml-6">
            <p><kbd className="px-2 py-1 bg-slate-700 rounded text-xs">Cmd/Ctrl + S</kbd> Save changes (JSON editor)</p>
            <p><kbd className="px-2 py-1 bg-slate-700 rounded text-xs">Escape</kbd> Close panels/editor</p>
            <p><kbd className="px-2 py-1 bg-slate-700 rounded text-xs">Backspace/Delete</kbd> Delete selected nodes</p>
            <p><kbd className="px-2 py-1 bg-slate-700 rounded text-xs">+</kbd> Zoom in</p>
            <p><kbd className="px-2 py-1 bg-slate-700 rounded text-xs">-</kbd> Zoom out</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-teal-400">
            <Move size={18} />
            <h4 className="font-semibold">Navigation</h4>
          </div>
          <div className="space-y-1 text-sm text-slate-300 ml-6">
            <p><span className="text-white font-medium">Fit View:</span> Use controls to fit all nodes</p>
            <p><span className="text-white font-medium">Minimap:</span> Click to jump to area</p>
            <p><span className="text-white font-medium">Zoom:</span> 5% to 400% range</p>
          </div>
        </div>

        {/* Node Types */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-teal-400">
            <ZoomIn size={18} />
            <h4 className="font-semibold">Node Types</h4>
          </div>
          <div className="space-y-2 text-sm text-slate-300 ml-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-purple-600"></div>
              <span><span className="text-white font-medium">Purple:</span> App Node</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-green-600"></div>
              <span><span className="text-white font-medium">Green:</span> Environment Node</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-blue-600"></div>
              <span><span className="text-white font-medium">Blue:</span> Entity Node</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-orange-600"></div>
              <span><span className="text-white font-medium">Orange:</span> Workflow Node</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <h4 className="font-semibold text-teal-400">Features</h4>
          <div className="space-y-1 text-sm text-slate-300 ml-6">
            <p>• Drag and drop nodes to rearrange</p>
            <p>• 8 anchor points per node for flexible connections</p>
            <p>• Auto horizontal/vertical alignment</p>
            <p>• Snap to grid (15px) for precise placement</p>
            <p>• Zoom and pan for navigation</p>
            <p>• Settings panel for customization</p>
            <p>• Resizable JSON editor with auto-save</p>
            <p>• Import/Export to file</p>
            <p>• Minimap for overview</p>
            <p>• Theme support (3 color palettes)</p>
            <p>• Layout direction (TB/LR)</p>
            <p>• Edge type customization</p>
            <p>• localStorage persistence</p>
          </div>
        </div>

        {/* Alignment */}
        <div className="space-y-2">
          <h4 className="font-semibold text-teal-400">Auto-Alignment</h4>
          <div className="space-y-1 text-sm text-slate-300 ml-6">
            <p><span className="text-white font-medium">Horizontal:</span> Distributes nodes left-to-right</p>
            <p><span className="text-white font-medium">Vertical:</span> Distributes nodes top-to-bottom</p>
            <p><span className="text-white font-medium">Snap to Grid:</span> Aligns to 15px grid automatically</p>
          </div>
        </div>

        {/* Edge Management */}
        <div className="space-y-2">
          <h4 className="font-semibold text-teal-400">Edge Management</h4>
          <div className="space-y-1 text-sm text-slate-300 ml-6">
            <p><span className="text-white font-medium">Smart Anchors:</span> Auto-selects best anchor points</p>
            <p><span className="text-white font-medium">Reconnect:</span> Drag edge ends to different anchors</p>
            <p><span className="text-white font-medium">Create:</span> Drag from any anchor point to connect</p>
            <p><span className="text-white font-medium">8 Points:</span> Top, Right, Bottom, Left per node</p>
          </div>
        </div>

        {/* Tips */}
        <div className="pt-4 border-t border-slate-700">
          <h4 className="font-semibold text-teal-400 mb-2">Tips</h4>
          <div className="space-y-1 text-xs text-slate-400">
            <p>💡 Edges auto-connect to optimal anchor points</p>
            <p>💡 Drag edge ends to reconnect to different anchors</p>
            <p>💡 Parent nodes connect bottom → child top by default</p>
            <p>💡 Use alignment buttons to organize nodes quickly</p>
            <p>💡 Each node has 8 connection points for flexibility</p>
            <p>💡 Snap to grid helps prevent node overlap</p>
            <p>💡 Click nodes to navigate to their JSON definition</p>
            <p>💡 Use the minimap to quickly navigate large graphs</p>
            <p>💡 Adjust edge types in settings for different visuals</p>
            <p>💡 Export your configuration to save changes</p>
            <p>💡 JSON editor auto-saves after 500ms of inactivity</p>
            <p>💡 Resize JSON editor by dragging left edge</p>
            <p>💡 All settings persist to localStorage</p>
            <p>💡 Select nodes and press Backspace/Delete to remove them</p>
          </div>
        </div>
      </div>
    </div>
  );
};

