import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  Settings,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Info,
  X
} from 'lucide-react';
import AuthState from '@/components/AuthState/AuthState';

interface Notification {
  id: number;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'success',
      title: 'Chat Response Complete',
      message: 'Your request has been processed successfully',
      timestamp: '2 minutes ago',
      isRead: false
    },
    {
      id: 2,
      type: 'info',
      title: 'New Feature Available',
      message: 'Enhanced markdown rendering is now available',
      timestamp: '5 minutes ago',
      isRead: false
    }
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markNotificationAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={16} className="text-green-400" />;
      case 'warning': return <AlertCircle size={16} className="text-yellow-400" />;
      case 'error': return <AlertCircle size={16} className="text-red-400" />;
      default: return <Info size={16} className="text-blue-400" />;
    }
  };

  const getBreadcrumb = () => {
    if (location.pathname === '/') {
      return 'Home';
    }
    if (location.pathname.startsWith('/chat/')) {
      return 'Chat Session';
    }
    return 'CYODA AI Assistant';
  };

  return (
    <>
      <header className="border-b border-slate-700 bg-slate-800/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-6">
            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="text-2xl font-bold text-teal-400">CYODA</div>
              <span className="text-xs bg-slate-700 px-2 py-1 rounded-full text-slate-300 font-medium">ALPHA</span>
            </div>

            {/* Breadcrumb */}
            <div className="hidden md:flex items-center space-x-2 text-sm text-slate-400">
              <ChevronRight size={14} />
              <span>{getBreadcrumb()}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-px h-6 bg-slate-600 mx-2"></div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                title="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50">
                  <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h3 className="font-medium text-white">Notifications</h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-slate-700 hover:bg-slate-700/50 transition-colors cursor-pointer ${
                          !notification.isRead ? 'bg-slate-700/30' : ''
                        }`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <div className="flex items-start space-x-3">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">{notification.title}</p>
                            <p className="text-sm text-slate-400 mt-1">{notification.message}</p>
                            <p className="text-xs text-slate-500 mt-2">{notification.timestamp}</p>
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-slate-700">
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      Mark all as read
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <AuthState />
          </div>
        </div>
      </header>

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </>
  );
};

export default Header;
