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
    <div className="w-full bg-white border-t border-slate-200">
      <div className="px-6 py-4">
        <ResponseSeparator
          hookType="background_task"
          label={hook.data?.task_name || 'Background Task'}
        />
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium text-slate-900">
                {hook.data?.task_name}
              </div>
              {hook.data?.task_description && (
                <div className="text-xs text-slate-500 mt-1">
                  {hook.data.task_description}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                console.log('[View Tasks Button] Clicked, calling onOpenTaskPanel');
                onOpenTaskPanel?.();
              }}
              className="w-full px-4 py-2 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 text-sm font-medium transition-colors"
            >
              View Tasks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackgroundTaskNotification;

