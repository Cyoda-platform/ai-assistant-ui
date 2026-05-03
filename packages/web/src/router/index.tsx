import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, createHashRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useAssistantStore } from '@/stores/assistant';
import { isInIframe } from '@/helpers/HelperIframe';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';

// Landing page loads eagerly for fast initial paint
import FintechHomeView from '@/views/FintechHomeView';

// Heavy views loaded lazily to keep the landing page bundle lean
const HomeView = lazy(() => import('@/views/HomeView'));
const NewChatView = lazy(() => import('@/views/NewChatView'));
const DashboardView = lazy(() => import('@/views/DashboardView'));
const ChatBotView = lazy(() => import('@/views/ChatBotView'));
const CanvasDemoView = lazy(() => import('@/views/CanvasDemoView'));
const WorkflowTabsView = lazy(() => import('@/views/WorkflowTabsView'));
const EnvironmentsPage = lazy(() => import('@/pages/EnvironmentsPage'));
const TestContextMenu = lazy(() => import('@/components/ChatHistoryPanel/TestContextMenu'));
const LogsView = lazy(() => import('@/views/LogsView'));
const MonitoringView = lazy(() => import('@/views/MonitoringView'));

const Fallback = () => <LoadingSpinner />;

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
        element: <FintechHomeView />,
      },
      {
        path: "home",
        element: <Suspense fallback={<Fallback />}><HomeView /></Suspense>,
      },
      {
        path: "new-chat",
        element: (
          <Suspense fallback={<Fallback />}>
            <LayoutWrapper layout="default">
              <NewChatView />
            </LayoutWrapper>
          </Suspense>
        ),
      },
      {
        path: "chat/:technicalId",
        element: <Suspense fallback={<Fallback />}><ChatBotView /></Suspense>,
      },
      {
        path: "canvas-demo",
        element: <Suspense fallback={<Fallback />}><CanvasDemoView /></Suspense>,
      },
      {
        path: "workflows",
        element: <Suspense fallback={<Fallback />}><WorkflowTabsView /></Suspense>,
      },
      {
        path: "environments",
        element: <Suspense fallback={<Fallback />}><EnvironmentsPage /></Suspense>,
      },
      {
        path: "test-context-menu",
        element: <Suspense fallback={<Fallback />}><TestContextMenu /></Suspense>,
      },
      {
        path: "logs",
        element: <Suspense fallback={<Fallback />}><LogsView /></Suspense>,
      },
      {
        path: "monitoring",
        element: <Suspense fallback={<Fallback />}><MonitoringView /></Suspense>,
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
