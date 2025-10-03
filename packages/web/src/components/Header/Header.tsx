import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  Settings,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  Activity,
  History,
  ChevronDown,
  Database,
  MessageCircle,
  Linkedin,
  BookOpen,
  Github,
  Shield,
  Menu
} from 'lucide-react';
import AuthState from '@/components/AuthState/AuthState';
import Logo from '@/assets/images/logo.svg';
import { useSuperUserMode, useIsCyodaEmployee } from '@/stores/auth';

interface Notification {
  id: number;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  messageId?: string; // ID of the related message for navigation
}

interface HeaderProps {
  onToggleCanvas?: () => void;
  onToggleChatHistory?: () => void;
  onToggleEntities?: () => void;
  canvasVisible?: boolean;
  chatHistoryVisible?: boolean;
  entitiesVisible?: boolean;
  showActions?: boolean;
  notifications?: Notification[];
  onMarkNotificationAsRead?: (id: number) => void;
  onMarkAllNotificationsAsRead?: () => void;
  onNotificationClick?: (notificationId: number, messageId?: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  onToggleCanvas,
  onToggleChatHistory,
  onToggleEntities,
  canvasVisible = false,
  chatHistoryVisible = true,
  entitiesVisible = false,
  showActions = false,
  notifications: externalNotifications,
  onMarkNotificationAsRead: externalMarkAsRead,
  onMarkAllNotificationsAsRead: externalMarkAllAsRead,
  onNotificationClick: externalNotificationClick
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Super user mode state
  const superUserMode = useSuperUserMode();
  const isCyodaEmployee = useIsCyodaEmployee();

  // Use external notifications if provided, otherwise use empty array
  const notifications = externalNotifications || [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Debug: Log when notifications prop changes
  useEffect(() => {

  }, [externalNotifications, notifications.length, unreadCount]);

  const markNotificationAsRead = (id: number) => {

    if (externalMarkAsRead) {
      externalMarkAsRead(id);
    } else {
      console.warn('⚠️ Header: No external mark as read handler provided');
    }
  };

  const markAllAsRead = () => {

    if (externalMarkAllAsRead) {
      externalMarkAllAsRead();
    } else {
      console.warn('⚠️ Header: No external mark all as read handler provided');
    }
    // Close notifications dropdown after marking all as read
    setShowNotifications(false);
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
        <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3">
          {/* Left Section - Logo */}
          <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6">
            <a
              href="/"
              className="flex items-center space-x-2 sm:space-x-3 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                // Close canvas if it's visible
                if (canvasVisible && onToggleCanvas) {
                  onToggleCanvas();
                }
                navigate('/');
              }}
            >
              <img src={Logo} alt="CYODA" className="h-6 sm:h-7 md:h-8" />
              <span className="text-xs bg-slate-700 px-2 py-1 rounded-full text-slate-300 font-medium">ALPHA</span>
            </a>

            {/* Super User Mode Badge - Hidden on mobile */}
            {superUserMode && isCyodaEmployee && (
              <div className="hidden sm:flex items-center space-x-2 bg-teal-500/20 border border-teal-500/50 px-3 py-1 rounded-full">
                <Shield size={14} className="text-teal-400" />
                <span className="text-xs text-teal-400 font-semibold">SUPER USER</span>
              </div>
            )}
          </div>

          {/* Right Section - Desktop */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="w-px h-6 bg-slate-600 mx-2"></div>

            {/* Action Buttons - Only show on chat page */}
            {showActions && (
              <div className="flex items-center gap-2">
                {/* Chat History Button */}
                {onToggleChatHistory && (
                  <button
                    onClick={onToggleChatHistory}
                    className={`relative px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                      chatHistoryVisible
                        ? 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                    title={`${chatHistoryVisible ? 'Hide' : 'Show'} History`}
                  >
                    <History size={18} />
                    <span className="text-sm font-medium hidden md:inline">History</span>
                  </button>
                )}

                {/* Canvas Button */}
                {onToggleCanvas && (
                  <button
                    onClick={onToggleCanvas}
                    className={`relative px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                      canvasVisible
                        ? 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                    title={`${canvasVisible ? 'Close' : 'Open'} Canvas`}
                  >
                    <Activity size={18} />
                    <span className="text-sm font-medium hidden md:inline">Canvas</span>
                  </button>
                )}

                {/* Entities Button - Only show on chat details page */}
                {onToggleEntities && (
                  <button
                    onClick={onToggleEntities}
                    className={`relative px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                      entitiesVisible
                        ? 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                    title={`${entitiesVisible ? 'Hide' : 'Show'} Entities`}
                  >
                    <Database size={18} />
                    <span className="text-sm font-medium hidden md:inline">Entities</span>
                  </button>
                )}
              </div>
            )}

            {/* Social Media Buttons - Hidden on mobile and tablet */}
            <div className="hidden lg:flex items-center space-x-2">
              {/* Documentation */}
              <a
                href="https://docs.cyoda.net/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-teal-600/20 hover:border-teal-500/50 border border-transparent transition-all duration-200"
                title="View Documentation"
              >
                <BookOpen size={18} />
              </a>

              {/* GitHub */}
              <a
                href="https://github.com/Cyoda-platform"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-600/20 hover:border-slate-500/50 border border-transparent transition-all duration-200"
                title="View on GitHub"
              >
                <Github size={18} />
              </a>

              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/company/cyoda"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-blue-600/20 hover:border-blue-500/50 border border-transparent transition-all duration-200"
                title="Follow us on LinkedIn"
              >
                <Linkedin size={18} />
              </a>
            </div>

            <div className="hidden lg:block w-px h-6 bg-slate-600"></div>

            {/* Discord - Hidden on mobile */}
            <a
              href="https://discord.com/invite/95rdAyBZr2"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:block relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-indigo-600 transition-all duration-200 group"
              title="Join our Discord Community"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 71 55"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="group-hover:scale-110 transition-transform"
              >
                <g clipPath="url(#clip0)">
                  <path
                    d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"
                    fill="currentColor"
                  />
                </g>
                <defs>
                  <clipPath id="clip0">
                    <rect width="71" height="55" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </a>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                }}
                className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                title="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span
                    key={`badge-${unreadCount}-${notifications.length}`}
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium"
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div
                  className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-[10000]"
                  onClick={(e) => e.stopPropagation()}
                >
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
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-sm text-slate-400">No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-slate-700 hover:bg-slate-700/50 transition-colors cursor-pointer ${
                            !notification.isRead ? 'bg-slate-700/30' : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Use external notification click handler if provided, otherwise just mark as read
                            if (externalNotificationClick) {
                              externalNotificationClick(notification.id, notification.messageId);
                            } else {
                              markNotificationAsRead(notification.id);
                            }
                            // Close the notification dropdown
                            setShowNotifications(false);
                          }}
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
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div
                      className="p-3 border-t border-slate-700 cursor-pointer hover:bg-slate-700/50 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAllAsRead();
                      }}
                    >
                      <span className="text-sm text-teal-400 hover:text-teal-300 transition-colors">
                        Mark all as read
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Profile */}
            <AuthState />
          </div>

          {/* Mobile Right Section - Menu Only */}
          <div className="flex md:hidden items-center space-x-2">
            {/* Hamburger Menu Button */}
            <button
              onClick={() => {
                setShowMobileMenu(!showMobileMenu);
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="Menu"
            >
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-slate-700 bg-slate-800/95 backdrop-blur-sm">
            <div className="px-3 py-4 space-y-3">
              {/* Super User Mode Badge - Mobile */}
              {superUserMode && isCyodaEmployee && (
                <div className="flex items-center space-x-2 bg-teal-500/20 border border-teal-500/50 px-3 py-2 rounded-lg">
                  <Shield size={14} className="text-teal-400" />
                  <span className="text-xs text-teal-400 font-semibold">SUPER USER MODE</span>
                </div>
              )}

              {/* Action Buttons - Mobile */}
              {showActions && (
                <div className="space-y-2">
                  {onToggleChatHistory && (
                    <button
                      onClick={() => {
                        onToggleChatHistory();
                        setShowMobileMenu(false);
                      }}
                      className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 ${
                        chatHistoryVisible
                          ? 'bg-teal-500/20 text-teal-400'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      <History size={20} />
                      <span className="text-sm font-medium">{chatHistoryVisible ? 'Hide' : 'Show'} History</span>
                    </button>
                  )}

                  {onToggleCanvas && (
                    <button
                      onClick={() => {
                        onToggleCanvas();
                        setShowMobileMenu(false);
                      }}
                      className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 ${
                        canvasVisible
                          ? 'bg-teal-500/20 text-teal-400'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      <Activity size={20} />
                      <span className="text-sm font-medium">{canvasVisible ? 'Close' : 'Open'} Canvas</span>
                    </button>
                  )}

                  {onToggleEntities && (
                    <button
                      onClick={() => {
                        onToggleEntities();
                        setShowMobileMenu(false);
                      }}
                      className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 ${
                        entitiesVisible
                          ? 'bg-teal-500/20 text-teal-400'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      <Database size={20} />
                      <span className="text-sm font-medium">{entitiesVisible ? 'Hide' : 'Show'} Entities</span>
                    </button>
                  )}
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-slate-700 my-3"></div>

              {/* Social Links - Mobile */}
              <div className="space-y-2">
                <a
                  href="https://docs.cyoda.net/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <BookOpen size={20} />
                  <span className="text-sm font-medium">Documentation</span>
                </a>

                <a
                  href="https://github.com/Cyoda-platform"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <Github size={20} />
                  <span className="text-sm font-medium">GitHub</span>
                </a>

                <a
                  href="https://www.linkedin.com/company/cyoda"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <Linkedin size={20} />
                  <span className="text-sm font-medium">LinkedIn</span>
                </a>

                <a
                  href="https://discord.com/invite/95rdAyBZr2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <MessageCircle size={20} />
                  <span className="text-sm font-medium">Discord Community</span>
                </a>
              </div>

              {/* User Profile - Mobile */}
              <div className="border-t border-slate-700 pt-3">
                <AuthState />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Click outside to close mobile menu */}
      {showMobileMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowMobileMenu(false);
          }}
        />
      )}

      {/* Click outside to close notifications (desktop only) */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowNotifications(false);
          }}
        />
      )}
    </>
  );
};

export default Header;
