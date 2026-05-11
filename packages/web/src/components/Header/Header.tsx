import React, { useState, useEffect, useMemo } from 'react';
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
  BookOpen,
  MessageCircle,
  Github,
  Shield,
  Menu,
  Server,
  LogOut
} from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';
import AuthState from '@/components/AuthState/AuthState';
import Logo from '@/assets/images/logo.svg';
import LogoSmall from '@/assets/images/logo-small.svg';
import { useSuperUserMode, useIsCyodaEmployee, useAuthStore } from '@/stores/auth';

interface Notification {
  id: number;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  messageId?: string; // ID of the related message for navigation
  taskId?: string; // ID of the related task for opening tasks panel
  chatId?: string; // ID of the chat to navigate to
}

interface HeaderProps {
  onToggleCanvas?: () => void;
  onToggleChatHistory?: () => void;
  onToggleEntities?: () => void;
  onToggleEnvironments?: () => void;
  onToggleTasks?: () => void;
  canvasVisible?: boolean;
  chatHistoryVisible?: boolean;
  entitiesVisible?: boolean;
  environmentsVisible?: boolean;
  tasksVisible?: boolean;
  showActions?: boolean;
  notifications?: Notification[];
  onMarkNotificationAsRead?: (id: number) => void;
  onMarkAllNotificationsAsRead?: () => void;
  onNotificationClick?: (notificationId: number, messageId?: string, taskId?: string, chatId?: string) => void;
  isArchivedChat?: boolean; // Disable canvas for archived chats
  showCanvasButton?: boolean; // Show canvas button only on chat pages
  showRepositoryConfigPrompt?: boolean; // Whether to show repository config prompt
  onConfigureRepository?: () => void; // Handler for configure new repository action
  onUseExistingRepository?: () => void; // Handler for use existing repository action
  onCloseRepositoryConfigPrompt?: () => void; // Handler for closing the prompt
  isLoadingCanvasToggle?: boolean; // Whether canvas toggle is loading
}

const Header: React.FC<HeaderProps> = ({
  onToggleCanvas,
  onToggleChatHistory,
  onToggleEntities,
  onToggleEnvironments,
  onToggleTasks,
  canvasVisible = false,
  chatHistoryVisible = true,
  entitiesVisible = false,
  environmentsVisible = false,
  tasksVisible = false,
  showActions = false,
  notifications: externalNotifications,
  onMarkNotificationAsRead: externalMarkAsRead,
  onMarkAllNotificationsAsRead: externalMarkAllAsRead,
  onNotificationClick: externalNotificationClick,
  isArchivedChat = false,
  showCanvasButton = true, // Default to true for backward compatibility
  showRepositoryConfigPrompt = false,
  onConfigureRepository,
  onUseExistingRepository,
  onCloseRepositoryConfigPrompt,
  isLoadingCanvasToggle = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth0();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Check if user is logged in (not in guest mode)
  const authStore = useAuthStore();
  const { token, tokenType } = authStore;
  const isLoggedIn = !!token && tokenType === 'private';

  // Super user mode state
  const superUserMode = useSuperUserMode();
  const isCyodaEmployee = useIsCyodaEmployee();

  // User initials for avatar
  const initials = useMemo(() => {
    const { family_name = 'C', given_name = 'U' } = authStore;
    const familyInitial = family_name.charAt(0).toUpperCase();
    const givenInitial = given_name.charAt(0).toUpperCase();
    return `${givenInitial}${familyInitial}`;
  }, [authStore.family_name, authStore.given_name]);

  // Logout handler
  const handleLogout = () => {
    setShowMobileMenu(false);
    const isElectron = import.meta.env.VITE_IS_ELECTRON;

    if (isElectron) {
      authStore.logout();
      navigate('/');
    } else {
      authStore.logout(() => {
        logout({
          logoutParams: {
            returnTo: window.location.origin
          }
        });
      });
      navigate('/');
    }
  };

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
      default: return <Info size={16} className="text-teal-500" />;
    }
  };

  const getBreadcrumb = () => {
    if (location.pathname === '/') {
      return 'Home';
    }
    if (location.pathname.startsWith('/chat/')) {
      return 'Chat Session';
    }
    return 'Cyoda Cloud';
  };

  return (
    <>
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
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
              <img src={Logo} alt="Cyoda Cloud" className="h-6 sm:h-7 md:h-8" />
              <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-500 font-medium">BETA</span>
            </a>

            {/* Super User Mode Badge - Hidden on mobile */}
            {superUserMode && isCyodaEmployee && (
              <div className="hidden sm:flex items-center space-x-2 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
                <Shield size={14} className="text-teal-600" />
                <span className="text-xs text-teal-600 font-semibold">SUPER USER</span>
              </div>
            )}
          </div>

          {/* Right Section - Desktop */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Action Buttons - Only show on chat page */}
            {showActions && (
              <div className="flex items-center gap-2">
                {/* Chat History Button */}
                {onToggleChatHistory && isLoggedIn && (
                  <button
                    onClick={onToggleChatHistory}
                    className={`relative px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                      chatHistoryVisible
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'
                    }`}
                    title={`${chatHistoryVisible ? 'Hide' : 'Show'} History`}
                  >
                    <History size={18} />
                    <span className="text-sm font-medium hidden md:inline">History</span>
                  </button>
                )}

                {/* Canvas Button - Only show on chat pages */}
                {onToggleCanvas && showCanvasButton && (
                  <div className="relative">
                    <button
                      onClick={onToggleCanvas}
                      disabled={isArchivedChat || isLoadingCanvasToggle}
                      className={`relative px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                        isArchivedChat || isLoadingCanvasToggle
                          ? 'text-slate-400 cursor-not-allowed opacity-50'
                          : canvasVisible
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'
                      }`}
                      title={isArchivedChat ? 'Canvas not available for archived chats' : isLoadingCanvasToggle ? 'Loading...' : `${canvasVisible ? 'Close' : 'Open'} Canvas`}
                    >
                      {isLoadingCanvasToggle ? (
                        <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                      ) : (
                        <Activity size={18} />
                      )}
                      <span className="text-sm font-medium hidden md:inline">Canvas</span>
                    </button>

                    {/* Repository Config Info Block */}
                    {showRepositoryConfigPrompt && (
                      <div className="absolute top-full right-0 mt-2 w-80 z-50 animate-slideDown">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                          {/* Close button */}
                          <button
                            onClick={onCloseRepositoryConfigPrompt}
                            className="absolute top-3 right-3 w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors z-10"
                            title="Close"
                          >
                            <X size={14} className="text-slate-500" />
                          </button>

                          <div className="relative p-4">
                            {/* Icon and Title */}
                            <div className="flex items-start space-x-3 mb-3">
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                                <Github size={20} className="text-blue-600" />
                              </div>
                              <div className="flex-1 pr-6">
                                <h3 className="text-sm font-semibold text-slate-900 mb-1">
                                  Repository Not Configured
                                </h3>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  Canvas requires a GitHub repository branch to be configured for this conversation.
                                </p>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4 mt-3">
                              <button
                                onClick={onConfigureRepository}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors flex items-center space-x-1.5"
                              >
                                <Github size={12} />
                                <span>New Branch</span>
                              </button>

                              <button
                                onClick={onUseExistingRepository}
                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-md transition-colors flex items-center space-x-1.5"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-2a2 2 0 00-2-2H8z" />
                                </svg>
                                <span>Existing Branch</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Cloud Button - Only show for logged in users */}
                {onToggleEnvironments && isLoggedIn && (
                  <button
                    onClick={onToggleEnvironments}
                    className={`relative px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                      environmentsVisible
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'
                    }`}
                    title={`${environmentsVisible ? 'Hide' : 'Show'} Cloud`}
                  >
                    <Server size={18} />
                    <span className="text-sm font-medium hidden md:inline">Cloud</span>
                  </button>
                )}

                {/* Tasks Button - Only show on chat details page */}
                {onToggleTasks && (
                  <button
                    onClick={onToggleTasks}
                    className={`relative px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                      tasksVisible
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'
                    }`}
                    title={`${tasksVisible ? 'Hide' : 'Show'} Tasks`}
                  >
                    <Database size={18} />
                    <span className="text-sm font-medium hidden md:inline">Tasks</span>
                  </button>
                )}
              </div>
            )}

            {/* Documentation */}
            {isLoggedIn && <a
              href="https://docs.cyoda.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:block p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
              title="Documentation"
            >
              <BookOpen size={16} />
            </a>}

            {/* Discord */}
            {isLoggedIn && <a
              href="https://discord.com/invite/95rdAyBZr2"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:block p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
              title="Discord Community"
            >
              <MessageCircle size={16} />
            </a>}

            {/* Notifications */}
            {isLoggedIn && <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                }}
                className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Notifications"
              >
                <Bell size={17} />
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
                  className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-lg shadow-lg z-[10000]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
                    <h3 className="text-sm font-medium text-slate-900">Notifications</h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center">
                        <p className="text-xs text-slate-400">No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-3 py-2 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${
                            !notification.isRead ? 'bg-teal-50/50' : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (externalNotificationClick) {
                              externalNotificationClick(notification.id, notification.messageId, notification.taskId, notification.chatId);
                            } else {
                              markNotificationAsRead(notification.id);
                            }
                            setShowNotifications(false);
                          }}
                        >
                          <div className="flex items-start space-x-2">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-medium text-slate-900 truncate">{notification.title}</p>
                                <span className="text-xs text-slate-400 shrink-0">{notification.timestamp}</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notification.message}</p>
                            </div>
                            {!notification.isRead && (
                              <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-1 shrink-0"></div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div
                      className="px-3 py-2 border-t border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAllAsRead();
                      }}
                    >
                      <span className="text-xs text-teal-600 hover:text-teal-700 transition-colors">
                        Mark all as read
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>}

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
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
              title="Menu"
            >
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <div className="px-3 py-4 space-y-3">
              {/* Super User Mode Badge - Mobile */}
              {superUserMode && isCyodaEmployee && (
                <div className="flex items-center space-x-2 bg-teal-50 border border-teal-200 px-3 py-2 rounded-lg">
                  <Shield size={14} className="text-teal-600" />
                  <span className="text-xs text-teal-600 font-semibold">SUPER USER MODE</span>
                </div>
              )}

              {/* Action Buttons - Mobile */}
              {showActions && (
                <div className="space-y-2">
                  {onToggleChatHistory && isLoggedIn && (
                    <button
                      onClick={() => {
                        onToggleChatHistory();
                        setShowMobileMenu(false);
                      }}
                      className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 ${
                        chatHistoryVisible
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'
                      }`}
                    >
                      <History size={20} />
                      <span className="text-sm">{chatHistoryVisible ? 'Hide' : 'Show'} History</span>
                    </button>
                  )}

                  {onToggleCanvas && showCanvasButton && (
                    <button
                      onClick={() => {
                        if (!isArchivedChat && !isLoadingCanvasToggle) {
                          onToggleCanvas();
                          setShowMobileMenu(false);
                        }
                      }}
                      disabled={isArchivedChat || isLoadingCanvasToggle}
                      className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 ${
                        isArchivedChat || isLoadingCanvasToggle
                          ? 'text-slate-400 cursor-not-allowed opacity-50'
                          : canvasVisible
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'
                      }`}
                    >
                      {isLoadingCanvasToggle ? (
                        <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                      ) : (
                        <Activity size={20} />
                      )}
                      <span className="text-sm font-medium">
                        {isLoadingCanvasToggle ? 'Loading...' : isArchivedChat ? 'Canvas (Archived)' : canvasVisible ? 'Close Canvas' : 'Open Canvas'}
                      </span>
                    </button>
                  )}

                  {onToggleEnvironments && isLoggedIn && (
                    <button
                      onClick={() => {
                        onToggleEnvironments();
                        setShowMobileMenu(false);
                      }}
                      className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 ${
                        environmentsVisible
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'
                      }`}
                    >
                      <Server size={20} />
                      <span className="text-sm">{environmentsVisible ? 'Hide' : 'Show'} Cloud</span>
                    </button>
                  )}

                  {onToggleTasks && (
                    <button
                      onClick={() => {
                        onToggleTasks();
                        setShowMobileMenu(false);
                      }}
                      className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 ${
                        tasksVisible
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'
                      }`}
                    >
                      <Database size={20} />
                      <span className="text-sm">{tasksVisible ? 'Hide' : 'Show'} Tasks</span>
                    </button>
                  )}
                </div>
              )}

              {/* User Profile - Mobile */}
              <div className="border-t border-slate-200 pt-3 space-y-2">
                {isLoggedIn ? (
                  <>
                    {/* User Info */}
                    <div className="flex items-center space-x-3 px-4 py-3">
                      {authStore.picture ? (
                        <img
                          className="w-10 h-10 rounded-full"
                          src={authStore.picture}
                          alt="User avatar"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 text-sm font-medium flex items-center justify-center">
                          {initials}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900">
                          {authStore.given_name && authStore.family_name
                            ? `${authStore.given_name} ${authStore.family_name}`
                            : authStore.email}
                        </div>
                        {authStore.given_name && authStore.family_name && (
                          <div className="text-xs text-slate-500">{authStore.email}</div>
                        )}
                      </div>
                    </div>

                    {/* Logout Button */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      <LogOut size={20} className="text-red-500" />
                      <span className="text-sm font-medium text-red-500">Logout</span>
                    </button>
                  </>
                ) : (
                  <div className="px-4 py-3">
                    <AuthState />
                  </div>
                )}
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
