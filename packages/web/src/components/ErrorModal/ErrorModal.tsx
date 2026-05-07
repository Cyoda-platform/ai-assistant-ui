import React from 'react';
import { Modal } from 'antd';
import { Info, MessageCircle, Cloud, Sparkles } from 'lucide-react';

interface ErrorModalProps {
  visible: boolean;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'network';
  onClose: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  visible,
  message,
  type = 'info',
  onClose
}) => {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <MessageCircle size={48} className="text-teal-600" />;
      case 'warning':
        return <Sparkles size={48} className="text-blue-400" />;
      case 'network':
        return <Cloud size={48} className="text-slate-400" />;
      default:
        return <Info size={48} className="text-teal-600" />;
    }
  };

  const getIconBgColor = () => {
    switch (type) {
      case 'error':
        return 'bg-teal-50';
      case 'warning':
        return 'bg-blue-50';
      case 'network':
        return 'bg-slate-100';
      default:
        return 'bg-teal-50';
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      onOk={onClose}
      footer={null}
      centered
      width={500}
      keyboard={true}
      maskClosable={true}
      className="helper-errors beautiful-modal"
      closeIcon={
        <span className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2L2 14M2 2L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      }
      styles={{
        content: {
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: 0,
          boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)',
        },
        body: {
          padding: 0,
        },
        mask: {
          backdropFilter: 'blur(4px)',
          backgroundColor: 'rgba(15, 23, 42, 0.15)',
        }
      }}
    >
      <div className="p-10">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className={`w-24 h-24 rounded-full ${getIconBgColor()} flex items-center justify-center border border-slate-200 shadow-sm`}>
            {getIcon()}
          </div>
        </div>

        {/* Message */}
        <div className="text-center mb-8">
          <p className="text-xl text-slate-700 leading-relaxed whitespace-pre-wrap font-light">
            {message}
          </p>
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="px-10 py-3.5 bg-teal-600 hover:bg-teal-700 rounded-xl font-semibold transition-colors min-w-[140px]"
            style={{ color: '#ffffff' }}
          >
            Got it
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ErrorModal;

