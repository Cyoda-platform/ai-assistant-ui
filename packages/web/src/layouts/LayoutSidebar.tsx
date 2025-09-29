import React, { useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/app';
import { useAssistantStore } from '@/stores/assistant';
import SideBar from '@/components/SideBar/SideBar.tsx';

interface LayoutSidebarProps {
  children: React.ReactNode;
}

const LayoutSidebar: React.FC<LayoutSidebarProps> = ({ children }) => {
  const appStore = useAppStore();
  const assistantStore = useAssistantStore();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // Removed duplicate getChats() call - MenuChatList handles loading chats

  useEffect(() => {
    // Handle resize logic (simplified for now)
    const handleResize = () => {
      if (!sidebarRef.current || !mainRef.current) return;

      // Add resize logic here if needed
      // This is a simplified version of the Vue component's resize handling
    };

    const resizeObserver = new ResizeObserver(handleResize);

    if (sidebarRef.current) {
      resizeObserver.observe(sidebarRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="layout-sidebar">
      <div
        ref={sidebarRef}
        className={`layout-sidebar__sidebar hidden-below-md ${appStore.isSidebarHidden ? 'hidden' : ''}`}
      >
        <SideBar />
      </div>
      <div ref={mainRef} className="layout-sidebar__main">
        {children}
      </div>
    </div>
  );
};

export default LayoutSidebar;
