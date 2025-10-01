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
        return <MessageCircle size={48} className="text-teal-400" />;
      case 'warning':
        return <Sparkles size={48} className="text-blue-400" />;
      case 'network':
        return <Cloud size={48} className="text-slate-400" />;
      default:
        return <Info size={48} className="text-teal-400" />;
    }
  };

  const getIconBgColor = () => {
    switch (type) {
      case 'error':
        return 'bg-teal-500/10';
      case 'warning':
        return 'bg-blue-500/10';
      case 'network':
        return 'bg-slate-500/10';
      default:
        return 'bg-teal-500/10';
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
        <span className="text-slate-400 hover:text-teal-400 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2L2 14M2 2L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      }
      styles={{
        content: {
          background: 'linear-gradient(135deg, rgb(30, 41, 59) 0%, rgb(51, 65, 85) 100%)',
          border: '1px solid rgb(71, 85, 105)',
          borderRadius: '20px',
          padding: 0,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        },
        body: {
          padding: 0,
        },
        mask: {
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
        }
      }}
    >
      <div className="p-10">
        {/* Icon with gentle animation */}
        <div className="flex justify-center mb-6">
          <div className={`w-24 h-24 rounded-full ${getIconBgColor()} flex items-center justify-center backdrop-blur-sm border border-slate-600/30 shadow-lg animate-gentle-pulse`}>
            {getIcon()}
          </div>
        </div>

        {/* Message */}
        <div className="text-center mb-8">
          <p className="text-xl text-slate-100 leading-relaxed whitespace-pre-wrap font-light">
            {message}
          </p>
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="px-10 py-3.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-teal-500/30 min-w-[140px] transform hover:scale-105"
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

