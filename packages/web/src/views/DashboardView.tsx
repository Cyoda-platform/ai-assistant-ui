import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Typography } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
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

  const onCreated = (data: CreateChatResponse) => {
    navigate(`/chat-bot/view/${data.technical_id}`);
  };

  useEffect(() => {
    const BODY_CLASS_NAME = 'body-dashboard-view';
    document.body.classList.add(BODY_CLASS_NAME);

    return () => {
      document.body.classList.remove(BODY_CLASS_NAME);
    };
  }, []);

  return (
    <div className="dashboard-view">
      <div className="dashboard-view__header">
        <Button
          className="btn btn-default btn-icon hidden-above-md"
          onClick={() => setDrawerSidebarVisible(true)}
          icon={<MenuOutlined />}
        />
        <div className="dashboard-view__header-right">
          <AuthState />
        </div>
      </div>

      <div className="dashboard-view__content">
        <Title level={2}>Dashboard</Title>
        <NewChat onCreated={onCreated} />
      </div>

      {/* DrawerSidebar placeholder */}
      {drawerSidebarVisible && (
        <div>Drawer Sidebar Placeholder</div>
      )}
    </div>
  );
};

export default DashboardView;
