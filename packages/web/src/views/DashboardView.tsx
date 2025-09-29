import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Typography } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import {
  Bell,
  ChevronRight,
  CheckCircle2,
  Info,
  Zap,
  AlertCircle
} from 'lucide-react';
import AuthState from '@/components/AuthState/AuthState';
import NewChat from '@/components/NewChat/NewChat';

const { Title } = Typography;

interface CreateChatResponse {
  technical_id: string;
}

const DashboardView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [drawerSidebarVisible, setDrawerSidebarVisible] = useState(false);
  const [notifications] = useState([
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

  const onCreated = (data: CreateChatResponse) => {
    navigate(`/chat-bot/view/${data.technical_id}`);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={16} className="text-green-400" />;
      case 'warning': return <AlertCircle size={16} className="text-yellow-400" />;
      case 'error': return <AlertCircle size={16} className="text-red-400" />;
      default: return <Info size={16} className="text-blue-400" />;
    }
  };

  useEffect(() => {
    const BODY_CLASS_NAME = 'body-dashboard-view';
    document.body.classList.add(BODY_CLASS_NAME);

    return () => {
      document.body.classList.remove(BODY_CLASS_NAME);
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-green-400 uppercase tracking-wider">In Progress</span>
        </div>
        <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          Build a fun 'Purrfect Pets' API app with Petstore
        </h1>
        <p className="text-slate-400 text-lg leading-relaxed">
          Creating a comprehensive pet management system with external API integration
        </p>
      </div>

      {/* Enhanced Progress Cards */}
      <div className="space-y-4">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-all duration-200">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-2">API Integration Complete</h3>
              <p className="text-slate-300 leading-relaxed">
                Successfully integrated with external APIs. Perfect time to test these integrations!
              </p>
              <p className="text-sm text-slate-400 mt-2">
                We're focusing on getting the prototype right before tackling non-functional requirements.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-all duration-200">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
              <Info size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-3">Learn More</h3>
              <div className="space-y-2">
                <a href="#" className="flex items-center space-x-2 text-teal-400 hover:text-teal-300 transition-colors group">
                  <span>What's an Entity Database?</span>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </a>
                <a href="#" className="flex items-center space-x-2 text-teal-400 hover:text-teal-300 transition-colors group">
                  <span>Entity Workflows for Event-Driven Architectures</span>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-all duration-200">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
              <Zap size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-2">Prototype Development</h3>
              <p className="text-slate-300 leading-relaxed mb-3">
                Let's make this prototype work smoothly together! 🎯
              </p>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                <span className="text-orange-400 font-medium">Ready in ~10 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Status Updates */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
          <Bell className="text-teal-400" size={20} />
          <span>Recent Updates</span>
        </h2>

        <div className="space-y-3">
          {notifications.map((notification) => (
            <div key={notification.id} className="bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-all duration-200">
              <div className="flex items-start space-x-3">
                {getNotificationIcon(notification.type)}
                <div className="flex-1">
                  <h4 className="font-medium text-white">{notification.title}</h4>
                  <p className="text-slate-300 text-sm mt-1">{notification.message}</p>
                  <span className="text-xs text-slate-500 mt-2 block">{notification.timestamp}</span>
                </div>
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legacy components for compatibility */}
      <div className="hidden">
        <AuthState />
        <NewChat onCreated={onCreated} />
      </div>
    </div>
  );
};

export default DashboardView;
