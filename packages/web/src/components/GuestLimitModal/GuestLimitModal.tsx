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
          <div className="w-24 h-24 rounded-full bg-amber-50 flex items-center justify-center border border-amber-200 shadow-sm">
            <Lock size={48} className="text-amber-600" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-semibold text-slate-900">
            {title}
          </h2>
        </div>

        {/* Message */}
        <div className="text-center mb-6">
          <p className="text-lg text-slate-700 leading-relaxed font-medium">
            {message}
          </p>
        </div>

        {/* Description */}
        <div className="text-center mb-8">
          <p className="text-sm text-slate-600 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold transition-colors text-slate-700 min-w-[120px]"
          >
            Cancel
          </button>
          <button
            onClick={onAction}
            className="px-8 py-3 bg-teal-600 hover:bg-teal-700 rounded-xl font-semibold transition-colors min-w-[140px] flex items-center justify-center gap-2"
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

