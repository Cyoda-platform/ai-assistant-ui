import React, { useState, useMemo } from 'react';
import { Database, History, Clock, X, RotateCcw } from 'lucide-react';
import ResizeHandle from '@/components/ResizeHandle/ResizeHandle';
import { useResizablePanel } from '@/hooks/useResizablePanel';

interface EntityVersion {
  date: string;
  state: string;
  version?: string;
}

interface EntityData {
  id: string;
  workflow_name: string;
  next_transitions: string[];
  entity_versions: EntityVersion[];
}

interface EntityDataPanelProps {
  isOpen: boolean;
  onClose: () => void;
  chatData?: any;
  onRefresh?: () => void;
  onRollbackChat?: () => void;
  isLoadingRollback?: boolean;
  width?: number;
  onWidthChange?: (width: number) => void;
}

const EntityDataPanel: React.FC<EntityDataPanelProps> = ({
  isOpen,
  onClose,
  chatData,
  onRefresh,
  onRollbackChat,
  isLoadingRollback = false,
  width: externalWidth,
  onWidthChange
}) => {
  const [activeEntityId, setActiveEntityId] = useState<string>('');
  const [isExternalResizing, setIsExternalResizing] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  // Use external width if provided, otherwise use internal resize hook
  const internalResize = useResizablePanel({
    defaultWidth: 384, // 96 * 4 = 384px (w-96)
    minWidth: 320,     // Minimum width for usability
    maxWidth: 600,     // Maximum width to not overwhelm the layout
    storageKey: 'entityDataPanel-width'
  });

  const panelWidth = externalWidth ?? internalResize.width;
  const isResizing = onWidthChange ? isExternalResizing : internalResize.isResizing;

  // Custom resize handler for external width control
  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (onWidthChange) {
      // Use external width control - implement custom resize logic
      e.preventDefault();
      setIsExternalResizing(true);
      const startX = e.clientX;
      const startWidth = panelWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = startX - moveEvent.clientX; // Reverse for left border
        const newWidth = Math.max(320, Math.min(600, startWidth + deltaX));
        onWidthChange(newWidth);
      };

      const handleMouseUp = () => {
        setIsExternalResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.body.classList.remove('resizing-active');
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.body.classList.add('resizing-active');
    } else {
      // Use internal resize hook
      internalResize.handleMouseDown(e);
    }
  }, [onWidthChange, panelWidth, internalResize.handleMouseDown]);

  // Extract entities data from chat data
  const entitiesData = useMemo(() => {
    const entities = chatData?.chat_body?.entities_data || {};
    return Object.keys(entities).map(id => ({
      id,
      workflow_name: entities[id].workflow_name || id,
      next_transitions: entities[id].next_transitions || [],
      entity_versions: entities[id].entity_versions || []
    }));
  }, [chatData]);

  // Set active entity to first one if not set
  React.useEffect(() => {
    if (entitiesData.length > 0 && !activeEntityId) {
      setActiveEntityId(entitiesData[0].id);
    }
  }, [entitiesData, activeEntityId]);

  const activeEntity = entitiesData.find(entity => entity.id === activeEntityId);

  const handleRollbackClick = () => {
    setShowRestartConfirm(true);
  };

  const handleRollbackConfirm = () => {
    setShowRestartConfirm(false);
    if (onRollbackChat) {
      onRollbackChat();
    }
  };

  const handleRollbackCancel = () => {
    setShowRestartConfirm(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`bg-slate-800/95 backdrop-blur-sm border-l border-slate-600 flex flex-col relative resizable-panel ${isResizing ? 'resizing' : ''}`}
      style={{ width: `${panelWidth}px` }}
    >
      {/* Resize Handle */}
      <ResizeHandle
        onMouseDown={handleMouseDown}
        isResizing={isResizing}
        position="left"
      />
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center space-x-2">
          <Database size={18} className="text-blue-400" />
          <h3 className="font-semibold text-white translate-y-[20%]">Entity Data</h3>
          <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full font-medium">
            Live
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {/* Restart Button */}
          {onRollbackChat && (
            <button
              onClick={handleRollbackClick}
              disabled={isLoadingRollback}
              className="p-2 rounded-lg text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={isLoadingRollback ? 'Restarting...' : 'Restart Workflows'}
            >
              <RotateCcw size={16} className={isLoadingRollback ? 'animate-spin' : ''} />
            </button>
          )}
          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Close Panel"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {entitiesData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <Database size={48} className="text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No entity data available</p>
          </div>
        </div>
      ) : (
        <>
          {/* Entity Tabs */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex flex-col space-y-2 mb-4">
              {entitiesData.map((entity) => (
                <button
                  key={entity.id}
                  onClick={() => setActiveEntityId(entity.id)}
                  className={`text-left p-3 rounded-lg text-sm font-medium transition-colors border ${
                    activeEntityId === entity.id
                      ? 'bg-slate-700/80 hover:bg-slate-600 border-slate-600 text-white'
                      : 'text-slate-400 hover:bg-slate-700/50 hover:text-white border-transparent'
                  }`}
                >
                  {entity.workflow_name}
                </button>
              ))}
            </div>

            {/* Entity Details */}
            {activeEntity && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Entity ID
                  </label>
                  <div className="text-sm font-mono bg-slate-700/50 p-3 rounded-lg mt-2 border border-slate-600 text-slate-200 break-all">
                    {activeEntity.id}
                  </div>
                </div>

                {activeEntity.next_transitions.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Next Transitions
                    </label>
                    <div className="text-sm bg-slate-700/50 p-3 rounded-lg mt-2 border border-slate-600">
                      <div className="flex flex-wrap gap-2">
                        {activeEntity.next_transitions.map((transition, index) => (
                          <span
                            key={index}
                            className="bg-teal-500/20 text-teal-300 px-2 py-1 rounded text-xs"
                          >
                            {transition}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Entity States */}
          <div className="flex-1 p-4 overflow-y-auto chat-container">
            <h4 className="text-sm font-semibold mb-4 flex items-center space-x-2 text-white">
              <History size={16} className="text-blue-400" />
              <span>Entity States</span>
            </h4>

            {activeEntity?.entity_versions.length === 0 ? (
              <div className="text-center py-8">
                <History size={32} className="text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No state history available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeEntity?.entity_versions.map((version, index) => (
                  <div
                    key={index}
                    className="bg-slate-700/50 rounded-lg p-3 border border-slate-600 hover:border-slate-500 transition-colors"
                  >
                    <div className="font-medium text-white text-sm">{version.state}</div>
                    <div className="text-slate-400 text-xs mt-1 flex items-center space-x-2">
                      <Clock size={12} />
                      <span>{version.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Restart Confirmation Dialog */}
      {showRestartConfirm && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-start space-x-3 mb-6">
              <div className="p-2 bg-yellow-500/20 rounded-lg flex-shrink-0">
                <RotateCcw size={24} className="text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">Restart Workflows?</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Are you sure you'd like to restart the workflows? This action will reset all workflow states.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-end mt-6">
              <button
                onClick={handleRollbackCancel}
                className="px-5 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors font-medium flex-shrink-0"
              >
                Cancel
              </button>
              <button
                onClick={handleRollbackConfirm}
                className="px-5 py-2.5 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white transition-colors font-medium flex-shrink-0"
              >
                Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntityDataPanel;
