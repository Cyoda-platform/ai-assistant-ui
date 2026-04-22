import React, { useState } from 'react';
import { Loader2, Send, Zap } from 'lucide-react';

// Brand colors from website palette
const BRAND_COLORS = {
  primary: '#0D8484',      // Primary teal
  primaryLight: '#109f9f', // Teal light
  pink: '#EC4899',         // Logo pink
  green: '#2e8861',        // Secondary green
};

interface CanvasWithProceedUIProps {
  hook: any;
  onSelectOption: (option: string) => void;
  isSubmitting?: boolean;
  onOpenCanvas?: () => void; // Callback to open canvas window
}

const CanvasWithProceedUI: React.FC<CanvasWithProceedUIProps> = ({
  hook,
  onSelectOption,
  isSubmitting = false,
  onOpenCanvas
}) => {
  const canvasData = hook?.data?.canvas || {};
  const proceedData = hook?.data?.proceed || {};
  const question = proceedData?.question || 'Ready to proceed?';
  const options = proceedData?.options || [];
  const [isOpeningCanvas, setIsOpeningCanvas] = useState(false);

  const handleOpenCanvas = async () => {
    try {
      setIsOpeningCanvas(true);
      console.log('[Canvas] Opening canvas window and calling analyze...');

      // Call the onOpenCanvas callback to open the canvas window
      if (onOpenCanvas) {
        onOpenCanvas();
      }

      // Trigger analyze on the canvas
      // This will be handled by the parent component through the canvas state
      console.log('[Canvas] Canvas window opened, analyze triggered');
    } catch (error) {
      console.error('[Canvas] Failed to open canvas:', error);
    } finally {
      setIsOpeningCanvas(false);
    }
  };

  const handleProceed = async () => {
    try {
      const proceedOption = options.find((opt: any) => opt.value === 'proceed');
      if (proceedOption) {
        console.log('[Canvas] Proceeding with option:', proceedOption);
        await onSelectOption('proceed');
      }
    } catch (error) {
      console.error('[Canvas] Failed to proceed:', error);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50">
      {/* Canvas Section */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-slate-300">
          📐 Canvas Design
        </div>
        <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/30 space-y-2">
          <div className="text-xs text-slate-400">
            {canvasData.message || 'Open Canvas to design your requirements, entities, and workflows visually.'}
          </div>
          <button
            onClick={handleOpenCanvas}
            disabled={isOpeningCanvas || isSubmitting}
            type="button"
            style={{
              background: `linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.primaryLight} 100%)`,
            }}
            className="w-full px-4 py-2 rounded-lg hover:opacity-90 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
          >
            {isOpeningCanvas ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Opening Canvas...</span>
              </>
            ) : (
              <>
                <Zap size={16} />
                <span>Open Canvas & Analyze</span>
              </>
            )}
          </button>
          {canvasData.repository_name && (
            <div className="text-xs text-slate-500 mt-2">
              Repository: <span className="text-slate-400">{canvasData.repository_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-700/30" />

      {/* Proceed Section */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-slate-300">
          {question}
        </div>
        <button
          onClick={handleProceed}
          disabled={isSubmitting || isOpeningCanvas}
          type="button"
          style={{
            background: `linear-gradient(135deg, ${BRAND_COLORS.pink} 0%, #f472b6 100%)`,
          }}
          className="w-full px-6 py-3 rounded-xl hover:opacity-90 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Send size={18} />
              <span>Proceed</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CanvasWithProceedUI;

