import React from 'react';
import { Modal } from 'antd';
import { Lock, LogIn } from 'lucide-react';

interface GuestLimitModalProps {
  visible: boolean;
  title: string;
  message: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  onClose: () => void;
}

const GuestLimitModal: React.FC<GuestLimitModalProps> = ({
  visible,
  title,
  message,
  description,
  actionLabel,
  onAction,
  onClose
}) => {
  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      width={520}
      keyboard={true}
      maskClosable={true}
      className="guest-limit-modal beautiful-modal"
      closeIcon={
        <span className="text-slate-400 hover:text-teal-400 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2L2 14M2 2L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      }
      style={{
        borderRadius: '16px',
      }}
    >
      <div className="p-10">
        {/* Icon with animation */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-amber-500/10 flex items-center justify-center backdrop-blur-sm border border-slate-600/30 shadow-lg animate-gentle-pulse">
            <Lock size={48} className="text-amber-400" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-semibold text-slate-100">
            {title}
          </h2>
        </div>

        {/* Message */}
        <div className="text-center mb-6">
          <p className="text-lg text-slate-300 leading-relaxed font-medium">
            {message}
          </p>
        </div>

        {/* Description */}
        <div className="text-center mb-8">
          <p className="text-sm text-slate-400 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition-all duration-300 text-slate-100 min-w-[120px]"
          >
            Cancel
          </button>
          <button
            onClick={onAction}
            className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-teal-500/30 min-w-[140px] transform hover:scale-105 flex items-center justify-center gap-2"
            style={{ color: '#ffffff' }}
          >
            <LogIn size={18} />
            {actionLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default GuestLimitModal;

