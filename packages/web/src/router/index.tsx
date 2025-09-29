import React from 'react';
import { createBrowserRouter, createHashRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useAssistantStore } from '@/stores/assistant';
import { isInIframe } from '@/helpers/HelperIframe';

// Import views
import HomeView from '@/views/HomeView';
import NewChatView from '@/views/NewChatView';
import DashboardView from '@/views/DashboardView';
import ChatBotView from '@/views/ChatBotView';
import CanvasDemoView from '@/views/CanvasDemoView';

// Import layouts
import LayoutDefault from '@/layouts/LayoutDefault';
import LayoutSidebar from '@/layouts/LayoutSidebar';
import LayoutModern from '@/layouts/LayoutModern';

// Route guard component
const RouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Layout wrapper component
const LayoutWrapper: React.FC<{
  layout: 'default' | 'sidebar' | 'modern';
  children: React.ReactNode;
}> = ({ layout, children }) => {
  let Layout;
  switch (layout) {
    case 'modern':
      Layout = LayoutModern;
      break;
    case 'sidebar':
      Layout = LayoutSidebar;
      break;
    default:
      Layout = LayoutDefault;
  }

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
        element: <HomeView />,
      },
      {
        path: "new-chat",
        element: (
          <LayoutWrapper layout="default">
            <NewChatView />
          </LayoutWrapper>
        ),
      },
      {
        path: "chat/:technicalId",
        element: <ChatBotView />,
      },
      {
        path: "canvas-demo",
        element: <CanvasDemoView />,
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

    // Don't redirect if user is navigating to a specific chat
    if (pathname.startsWith('/chat/')) {
      return null; // Allow navigation to continue to the chat page
    }

    // Only redirect to home for root path visits without specific destinations
    if (pathname === '/') {
      return { pathname: "/", search };
    }

    // For all other paths, allow navigation to continue
    return null;
  };

  return { handleFirstVisit };
};

export default router;
