import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Database,
  MessageCircle,
  Settings,
  Home,
  History,
  User,
  Bell,
  Grid3X3,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  X,
  Plus,
  Send,
  Maximize2,
  Minimize2,
  HelpCircle,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  Layers3
} from 'lucide-react';
import WorkflowCanvas from '@/components/WorkflowCanvas/WorkflowCanvas';
import EntityDataPanel from '@/components/EntityDataPanel/EntityDataPanel';

interface LayoutModernProps {
  children: React.ReactNode;
}

const LayoutModern: React.FC<LayoutModernProps> = ({ children }) => {
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(400);
  const [isEntityDataOpen, setIsEntityDataOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('workflow');
  const [isResizing, setIsResizing] = useState(false);
  const [isCanvasCollapsed, setIsCanvasCollapsed] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'success',
      title: 'Processor Enhancement Complete',
      message: 'Implementation has been successfully completed',
      timestamp: '2 minutes ago',
      isRead: false
    },
    {
      id: 2,
      type: 'info',
      title: 'Next Step Available',
      message: 'Proceed to compiling the complete project',
      timestamp: '3 minutes ago',
      isRead: false
    }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  const resizeRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            chatInputRef.current?.focus();
            break;
          case 'b':
            e.preventDefault();
            setIsCanvasOpen(!isCanvasOpen);
            break;
          case 'd':
            e.preventDefault();
            setIsEntityDataOpen(!isEntityDataOpen);
            break;
        }
      }
      if (e.key === 'Escape') {
        setShowNotifications(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCanvasOpen, isEntityDataOpen]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    startX.current = e.clientX;
    startWidth.current = canvasWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = startWidth.current + (e.clientX - startX.current);
      const minWidth = 300;
      const maxWidth = 800;
      setCanvasWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [canvasWidth]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      // Handle chat submission
      console.log('Chat submitted:', chatInput);
      setChatInput('');
    }
  };

  const markNotificationAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={16} className="text-green-400" />;
      case 'warning': return <AlertCircle size={16} className="text-yellow-400" />;
      case 'error': return <AlertCircle size={16} className="text-red-400" />;
      default: return <Info size={16} className="text-blue-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="text-2xl font-bold text-teal-400">CYODA</div>
              <span className="text-xs bg-slate-700 px-2 py-1 rounded-full text-slate-300 font-medium">ALPHA</span>
            </div>

            {/* Breadcrumb */}
            <div className="hidden md:flex items-center space-x-2 text-sm text-slate-400">
              <ChevronRight size={14} />
              <span>Build a fun 'Purrfect Pets' API app</span>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Canvas Toggle */}
            <button
              onClick={() => setIsCanvasOpen(!isCanvasOpen)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isCanvasOpen
                  ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                  : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600 hover:text-white border border-slate-600'
              }`}
              title="Toggle Canvas (Ctrl+B)"
            >
              <Layers3 size={16} />
              <span className="hidden sm:inline">Canvas</span>
              {isCanvasOpen && <ChevronLeft size={14} className="opacity-70" />}
            </button>

            {/* Entity Data Toggle */}
            <button
              onClick={() => setIsEntityDataOpen(!isEntityDataOpen)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isEntityDataOpen
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600 hover:text-white border border-slate-600'
              }`}
              title="Toggle Entity Data (Ctrl+D)"
            >
              <Database size={16} />
              <span className="hidden sm:inline">Entities</span>
              {isEntityDataOpen && <ChevronRight size={14} className="opacity-70" />}
            </button>

            {/* Discord Link */}
            <button
              onClick={() => window.open('https://discord.com/invite/95rdAyBZr2', '_blank')}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-slate-700/80 text-slate-300 hover:bg-indigo-600 hover:text-white border border-slate-600 group"
              title="Join Discord Community"
            >
              <MessageCircle size={16} />
              <span className="hidden sm:inline">Discord</span>
            </button>

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
                  <div className="p-4 border-b border-slate-700">
                    <h3 className="font-medium text-white">Notifications</h3>
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
                    <button className="text-sm text-teal-400 hover:text-teal-300 transition-colors">
                      Mark all as read
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Settings */}
            <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" title="Settings">
              <Settings size={20} />
            </button>

            {/* User Profile */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-400 to-blue-500 flex items-center justify-center cursor-pointer hover:shadow-lg hover:shadow-teal-500/25 transition-all">
                <User size={16} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Enhanced Left Sidebar */}
        <div className="w-64 bg-slate-800/90 backdrop-blur-sm border-r border-slate-700 flex flex-col">
          {/* Quick Actions */}
          <div className="p-4 border-b border-slate-700">
            <button className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02]">
              <Plus size={16} />
              <span>New Request</span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <div className="flex items-center space-x-3 text-slate-300 hover:text-white cursor-pointer p-3 rounded-lg hover:bg-slate-700/50 transition-all duration-200 group">
              <Home size={18} className="group-hover:scale-110 transition-transform" />
              <span className="font-medium">Home</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-3 text-slate-300 hover:text-white cursor-pointer p-3 rounded-lg hover:bg-slate-700/50 transition-all duration-200 group">
                <History size={18} className="group-hover:scale-110 transition-transform" />
                <span className="font-medium">History</span>
                <ChevronRight size={14} className="ml-auto group-hover:translate-x-1 transition-transform" />
              </div>

              {/* History Items */}
              <div className="ml-8 space-y-1">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider px-2 py-1">Today</div>
                <div className="space-y-1">
                  <div className="text-slate-400 hover:text-white cursor-pointer p-2 rounded-md hover:bg-slate-700/30 transition-all duration-200 text-sm flex items-center space-x-2">
                    <Clock size={14} className="text-slate-500" />
                    <span>please deploy my env</span>
                  </div>
                  <div className="text-slate-400 hover:text-white cursor-pointer p-2 rounded-md hover:bg-slate-700/30 transition-all duration-200 text-sm flex items-center space-x-2">
                    <Clock size={14} className="text-slate-500" />
                    <span>what is my cyoda env</span>
                  </div>
                  <div className="text-teal-400 hover:text-teal-300 cursor-pointer p-2 rounded-md hover:bg-slate-700/30 transition-all duration-200 text-sm flex items-center space-x-2 bg-teal-500/10 border border-teal-500/20">
                    <Activity size={14} className="text-teal-400" />
                    <span>Build a fun 'Purrfect Pets'...</span>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-700 space-y-2">
            <div className="flex items-center space-x-3 text-slate-400 hover:text-white cursor-pointer p-3 rounded-lg hover:bg-slate-700/50 transition-all duration-200 group">
              <HelpCircle size={18} className="group-hover:scale-110 transition-transform" />
              <span className="font-medium">Help & Support</span>
            </div>
            <div className="flex items-center space-x-3 text-slate-400 hover:text-white cursor-pointer p-3 rounded-lg hover:bg-slate-700/50 transition-all duration-200 group">
              <Settings size={18} className="group-hover:scale-110 transition-transform" />
              <span className="font-medium">Settings</span>
            </div>
          </div>
        </div>

        {/* Enhanced Draggable Canvas Sidebar */}
        {isCanvasOpen && (
          <div
            className={`relative bg-slate-800/95 backdrop-blur-sm border-r border-slate-600 flex flex-col transition-all duration-300 ${
              isCanvasCollapsed ? 'w-12' : ''
            }`}
            style={{ width: isCanvasCollapsed ? 48 : canvasWidth }}
          >
            {/* Canvas Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
              {!isCanvasCollapsed && (
                <>
                  <div className="flex items-center space-x-2">
                    <Layers3 size={18} className="text-teal-400" />
                    <h3 className="font-semibold">Canvas</h3>
                    <span className="text-xs bg-teal-500/20 text-teal-300 px-2 py-1 rounded-full">Active</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsCanvasCollapsed(true)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                      title="Collapse Canvas"
                    >
                      <Minimize2 size={14} />
                    </button>
                    <button
                      onClick={() => setIsCanvasOpen(false)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                      title="Close Canvas"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </>
              )}

              {isCanvasCollapsed && (
                <button
                  onClick={() => setIsCanvasCollapsed(false)}
                  className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors mx-auto"
                  title="Expand Canvas"
                >
                  <Maximize2 size={16} />
                </button>
              )}
            </div>

            {!isCanvasCollapsed && (
              <>
                {/* Canvas Tabs */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/30">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setActiveTab('workflow')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                        activeTab === 'workflow'
                          ? 'bg-teal-500 text-white shadow-md'
                          : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      <Activity size={14} />
                      <span>Workflow</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('markdown')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                        activeTab === 'markdown'
                          ? 'bg-teal-500 text-white shadow-md'
                          : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      <Grid3X3 size={14} />
                      <span>Markdown</span>
                    </button>
                  </div>

                  <button className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" title="Canvas Settings">
                    <Settings size={14} />
                  </button>
                </div>

                {/* Canvas Content */}
                <div className="flex-1 relative overflow-hidden">
                  {activeTab === 'workflow' ? (
                    <div className="h-full">
                      <WorkflowCanvas />
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-slate-900/50 p-4">
                      <div className="h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
                            <Grid3X3 size={16} className="text-teal-400" />
                            <span>Markdown Editor</span>
                          </h4>
                        </div>
                        <div className="flex-1 bg-slate-800/80 rounded-lg border border-slate-600 p-4 backdrop-blur-sm">
                          <textarea
                            className="w-full h-full bg-transparent text-slate-300 placeholder-slate-500 resize-none focus:outline-none font-mono text-sm leading-relaxed"
                            placeholder="# Start writing your markdown here...

## Features
- Real-time preview
- Syntax highlighting
- Export options

**Bold text** and *italic text* supported.

> Blockquotes for important notes

```javascript
// Code blocks with syntax highlighting
const example = 'Hello World';
```"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Enhanced Resize Handle */}
            {!isCanvasCollapsed && (
              <div
                ref={resizeRef}
                onMouseDown={handleMouseDown}
                className="absolute top-0 right-0 w-2 h-full cursor-ew-resize group hover:bg-teal-500/20 transition-colors"
              >
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-6 h-16 -mr-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-700/80 rounded-l-lg">
                  <GripVertical size={16} className="text-slate-400" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Main Content */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
          <div className="p-8 flex-1 overflow-y-auto">
            {children}
          </div>

          {/* Enhanced Chat Input */}
          <div className="p-6 border-t border-slate-700 bg-slate-800/30 backdrop-blur-sm">
            <form onSubmit={handleChatSubmit} className="flex items-end space-x-4">
              <div className="flex-1 relative">
                <input
                  ref={chatInputRef}
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask Cyoda AI Assistant... (Ctrl+K to focus)"
                  className="w-full bg-slate-800/80 backdrop-blur-sm border border-slate-600 rounded-xl px-4 py-4 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-200 pr-12"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-500 font-mono">
                  ⌘K
                </div>
              </div>
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:from-slate-600 disabled:to-slate-700 text-white p-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                title="Send Message"
              >
                <Send size={20} />
              </button>
            </form>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2 mt-3">
              <span className="text-xs text-slate-500">Quick actions:</span>
              <button className="text-xs bg-slate-700/50 hover:bg-slate-600 text-slate-300 hover:text-white px-2 py-1 rounded-md transition-colors">
                Deploy
              </button>
              <button className="text-xs bg-slate-700/50 hover:bg-slate-600 text-slate-300 hover:text-white px-2 py-1 rounded-md transition-colors">
                Status
              </button>
              <button className="text-xs bg-slate-700/50 hover:bg-slate-600 text-slate-300 hover:text-white px-2 py-1 rounded-md transition-colors">
                Help
              </button>
            </div>
          </div>
        </div>

        {/* Entity Data Panel */}
        <EntityDataPanel
          isOpen={isEntityDataOpen}
          onClose={() => setIsEntityDataOpen(false)}
          chatData={null} // TODO: Pass actual chat data from props or context
          onRefresh={() => {
            // TODO: Implement refresh functionality
            console.log('Refreshing entity data...');
          }}
          onRollbackChat={() => {
            // TODO: Implement rollback functionality
            console.log('Rolling back chat...');
          }}
        />
      </div>

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
};

export default LayoutModern;
