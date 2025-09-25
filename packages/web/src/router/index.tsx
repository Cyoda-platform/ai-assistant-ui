import React from 'react';
import { createBrowserRouter, createHashRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useAssistantStore } from '@/stores/assistant';
import { isInIframe } from '@/helpers/HelperIframe';

// Import views
import NewChatView from '@/views/NewChatView';
import DashboardView from '@/views/DashboardView';
import ChatBotView from '@/views/ChatBotView';

// Import layouts
import LayoutDefault from '@/layouts/LayoutDefault';
import LayoutSidebar from '@/layouts/LayoutSidebar';

// Route guard component
const RouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Layout wrapper component
const LayoutWrapper: React.FC<{
  layout: 'default' | 'sidebar';
  children: React.ReactNode;
}> = ({ layout, children }) => {
  const Layout = layout === 'sidebar' ? LayoutSidebar : LayoutDefault;
  return (
    <Layout>
      <RouteGuard>
        {children}
      </RouteGuard>
    </Layout>
  );
};

// Import App component
import App from '@/App';

// Route configuration
const routes = [
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: (
          <LayoutWrapper layout="default">
            <NewChatView />
          </LayoutWrapper>
        ),
      },
      {
        path: "home",
        element: (
          <LayoutWrapper layout="sidebar">
            <DashboardView />
          </LayoutWrapper>
        ),
      },
      {
        path: "chat-bot/view/:technicalId",
        element: (
          <LayoutWrapper layout="sidebar">
            <ChatBotView />
          </LayoutWrapper>
        ),
      },
    ],
  },
  // Catch all route - redirect to home
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
];

// Create router based on environment
const createRouter = () => {
  const isElectron = import.meta.env.VITE_IS_ELECTRON;

  if (isElectron) {
    return createHashRouter(routes);
  } else {
    return createBrowserRouter(routes);
  }
};

export const router = createRouter();

// Navigation guard logic (to be called in App.tsx)
export const useNavigationGuards = () => {
  const authStore = useAuthStore();
  const assistantStore = useAssistantStore();

  const handleFirstVisit = (pathname: string, search: string) => {
    const params = new URLSearchParams(search);
    const isFirstVisit = !params.has('authState');

    if (!isFirstVisit) return null;

    // Handle Auth0 callback
    if (params.has('auth0')) {
      return null; // Allow navigation to continue
    }

    // Handle authenticated user first visit
    if (authStore.isLoggedIn) {
      if (isInIframe) {
        return { pathname: "/", search };
      }
      return { pathname: "/home", search };
    }

    // Handle unauthenticated user first visit
    if (!authStore.isLoggedIn) {
      if (!assistantStore.isGuestChatsExist || isInIframe) {
        return { pathname: "/", search };
      } else {
        return { pathname: "/home", search };
      }
    }

    return null;
  };

  return { handleFirstVisit };
};

export default router;
