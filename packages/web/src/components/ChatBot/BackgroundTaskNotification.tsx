import React from 'lucide-react';
import ResponseSeparator from './ResponseSeparator';

interface BackgroundTaskNotificationProps {
  hook: any;
  onOpenTaskPanel?: () => void;
}

const BackgroundTaskNotification: React.FC<BackgroundTaskNotificationProps> = ({
  hook,
  onOpenTaskPanel
}) => {
  if (!hook) return null;

  return (
    <div className="w-full bg-slate-800/50 border-t border-slate-700">
      <div className="px-6 py-4">
        <ResponseSeparator
          hookType="background_task"
          label={hook.data?.task_name || 'Background Task'}
        />
        <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50">
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium text-slate-300">
                {hook.data?.task_name}
              </div>
              {hook.data?.task_description && (
                <div className="text-xs text-slate-400 mt-1">
                  {hook.data.task_description}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                console.log('[View Tasks Button] Clicked, calling onOpenTaskPanel');
                onOpenTaskPanel?.();
              }}
              className="w-full px-4 py-2 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/50 text-teal-300 text-sm font-medium transition-all duration-200"
            >
              📊 View Tasks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackgroundTaskNotification;

