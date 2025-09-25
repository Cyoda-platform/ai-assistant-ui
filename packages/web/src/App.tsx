import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { Spin } from 'antd';

// Import stores
import { useAuthStore } from './stores/auth';
import { useAssistantStore } from './stores/assistant';

// Import components
import LoginPopUp from './components/LoginPopUp/LoginPopUp';
import ChatBotRenameDialog from './components/ChatBot/ChatBotRenameDialog';
import ConfirmationDialog from './components/ConfirmationDialog/ConfirmationDialog';

// Import helpers
import HelperStorage from './helpers/HelperStorage';
import { LOGIN_REDIRECT_URL } from './helpers/HelperConstants';
import { isInIframe } from './helpers/HelperIframe';
import { setTokenGetter } from './helpers/HelperAuth';
import { useDetectTheme } from './helpers/HelperTheme';
import { useNavigationGuards } from './router';

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [isLoading, setIsLoading] = useState(false);
  const [firstVisit, setFirstVisit] = useState(true);

  const authStore = useAuthStore();
  const assistantStore = useAssistantStore();
  const detectTheme = useDetectTheme();
  const helperStorage = new HelperStorage();
  const { handleFirstVisit } = useNavigationGuards();

  // Set up token getter for API calls
  useEffect(() => {
    setTokenGetter(async () => {
      try {
        return await getAccessTokenSilently();
      } catch (error) {
        console.error('Error getting access token:', error);
        throw error;
      }
    });
  }, [getAccessTokenSilently]);

  // Handle theme changes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-light');

    if (isInIframe && !authStore.isLoggedIn) {
      root.classList.add('theme-light');
      return;
    }

    root.classList.add(`theme-${detectTheme}`);
  }, [detectTheme, authStore.isLoggedIn]);

  // Handle authentication state changes
  useEffect(() => {
    if (!isAuthenticated || authStore.isLoggedIn) return;

    const handleAuth = async () => {
      setIsLoading(true);
      try {
        const oldToken = authStore.token;
        const token = await getAccessTokenSilently();

        authStore.saveData({
          token: token,
          tokenType: "private",
          refreshToken: null,
          userId: user?.sub || '',
          username: user?.name || '',
          picture: user?.picture || '',
          family_name: user?.family_name || '',
          given_name: user?.given_name || '',
          email: user?.email || '',
        });

        if (oldToken) {
          try {
            await authStore.postTransferChats(oldToken, true);
          } catch (error) {
            console.error('Error transferring chats:', error);
          }
        }

        assistantStore.setGuestChatsExist(false);
        const returnTo = helperStorage.get(LOGIN_REDIRECT_URL, '/home');
        helperStorage.removeItem(LOGIN_REDIRECT_URL);

        // Navigate to return URL
        navigate(returnTo, { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    handleAuth();
  }, [isAuthenticated, authStore, assistantStore, user, getAccessTokenSilently, helperStorage]);

  // Handle navigation guards on route changes
  useEffect(() => {
    if (firstVisit) {
      const redirectTo = handleFirstVisit(location.pathname, location.search);
      if (redirectTo) {
        navigate(redirectTo.pathname + redirectTo.search, { replace: true });
      }
      setFirstVisit(false);
    }
  }, [location, firstVisit, handleFirstVisit, navigate]);

  return (
    <Spin spinning={isLoading} size="large">
      <div className="app">
        <Outlet />

        <LoginPopUp />
        <ChatBotRenameDialog />
        <ConfirmationDialog />
      </div>
    </Spin>
  );
};

export default App;
