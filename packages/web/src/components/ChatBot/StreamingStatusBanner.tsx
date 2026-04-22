import React from 'react';
import { Wifi, WifiOff, RefreshCw, X } from 'lucide-react';

interface StreamingStatusBannerProps {
  isStreamingEnabled: boolean;
  onEnableStreaming: () => void;
  onDismiss: () => void;
  visible?: boolean;
}

/**
 * StreamingStatusBanner Component
 * Shows a banner when streaming is disabled, allowing users to re-enable it
 */
const StreamingStatusBanner: React.FC<StreamingStatusBannerProps> = ({
  isStreamingEnabled,
  onEnableStreaming,
  onDismiss,
  visible = true
}) => {
  if (isStreamingEnabled || !visible) return null;

  return (
    <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-40 animate-slideInDown">
      <div className="bg-amber-900/90 backdrop-blur-sm border border-amber-700/50 rounded-lg shadow-xl px-4 py-3 max-w-md">
        <div className="flex items-center space-x-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            <WifiOff size={18} className="text-amber-400" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-amber-100 text-sm font-medium">
              Real-time streaming is disabled
            </p>
            <p className="text-amber-200 text-xs mt-0.5">
              Messages will use standard API calls instead
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onEnableStreaming}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors duration-200 text-xs font-medium"
              title="Re-enable streaming"
            >
              <Wifi size={12} />
              <span>Enable</span>
            </button>

            <button
              onClick={onDismiss}
              className="p-1 rounded-md text-amber-400 hover:text-amber-200 hover:bg-amber-800/50 transition-colors"
              title="Dismiss banner"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamingStatusBanner;
