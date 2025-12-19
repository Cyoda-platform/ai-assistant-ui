import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Bell, Bot, Sparkles } from 'lucide-react';
import dayjs from 'dayjs';
import { useTextResponsiveContainer } from '@/hooks/useTextResponsiveContainer';

interface NotificationProps {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
  onClose?: () => void;
  showIcon?: boolean;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  title,
  message,
  duration = 5000,
  onClose,
  showIcon = true
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  // Get responsive container class based on message content
  const containerInfo = useTextResponsiveContainer(`${title} ${message}`);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} className="text-green-400" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-400" />;
      case 'warning':
        return <AlertCircle size={16} className="text-yellow-400" />;
      default:
        return <Info size={16} className="text-blue-400" />;
    }
  };

  const getAvatarColors = () => {
    switch (type) {
      case 'success':
        return 'from-green-500 to-green-600';
      case 'error':
        return 'from-red-500 to-red-600';
      case 'warning':
        return 'from-yellow-500 to-yellow-600';
      default:
        return 'from-blue-500 to-blue-600';
    }
  };

  const getBadgeText = () => {
    switch (type) {
      case 'success':
        return 'SUCCESS';
      case 'error':
        return 'ERROR';
      case 'warning':
        return 'WARNING';
      default:
        return 'INFO';
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${title}: ${message}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy notification:', err);
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`
      w-full transform transition-all duration-300 ease-out animate-fadeInUp
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `}>
      <div className="flex items-start space-x-4 mb-4">
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${getAvatarColors()} flex items-center justify-center flex-shrink-0 shadow-lg`}>
          {showIcon && getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          {/* Notification Badge */}
          <div className="flex items-center space-x-2 mb-2">
            <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-300">
              <Sparkles size={10} />
              <span>CYODA {getBadgeText()}</span>
            </span>
            <span className="text-xs text-slate-500">
              {dayjs().format('HH:mm')}
            </span>
          </div>

          {/* Notification Bubble */}
          <div className={`${containerInfo.className} rounded-tl-md group`}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-semibold text-white mb-2">{title}</h4>
                <p className="text-base text-slate-300 leading-relaxed">{message}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700/50">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-700/50 hover:bg-slate-600 text-slate-300 hover:text-white transition-all duration-200 text-xs"
                  title="Copy notification"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 size={12} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={handleClose}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 text-xs"
                title="Dismiss notification"
              >
                <X size={12} />
                <span>Dismiss</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Toast notification manager
interface ToastNotification extends NotificationProps {
  id: string;
}

interface NotificationManagerProps {
  notifications: ToastNotification[];
  onRemove: (id: string) => void;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({
  notifications,
  onRemove
}) => {
  return (
    <div className="fixed top-20 right-6 z-50 space-y-4 max-w-sm">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className="transform transition-all duration-300 ease-out"
          style={{
            transform: `translateY(${index * 8}px)`,
            zIndex: 50 - index
          }}
        >
          <Notification
            {...notification}
            onClose={() => onRemove(notification.id)}
          />
        </div>
      ))}
    </div>
  );
};

// Hook for managing notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const addNotification = (notification: Omit<ToastNotification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { ...notification, id }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showSuccess = (title: string, message: string) => {
    addNotification({ type: 'success', title, message });
  };

  const showError = (title: string, message: string) => {
    addNotification({ type: 'error', title, message });
  };

  const showInfo = (title: string, message: string) => {
    addNotification({ type: 'info', title, message });
  };

  const showWarning = (title: string, message: string) => {
    addNotification({ type: 'warning', title, message });
  };

  return {
    notifications,
    removeNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning
  };
};

export default Notification;
