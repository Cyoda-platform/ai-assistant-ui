import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

// Import stores
import { useAuthStore } from './stores/auth';
import { useAssistantStore } from './stores/assistant';

// Import components
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
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
  const { user, getAccessTokenSilently, isAuthenticated, isLoading: auth0Loading, error: auth0Error } = useAuth0();
  const [firstVisit, setFirstVisit] = useState(true);

  const authStore = useAuthStore();
  const assistantStore = useAssistantStore();
  const detectTheme = useDetectTheme();
  const helperStorage = new HelperStorage();
  const { handleFirstVisit } = useNavigationGuards();

  // Debug Auth0 state changes
  useEffect(() => {
    console.log('Auth0 state changed:', {
      isAuthenticated,
      auth0Loading,
      auth0Error,
      user: user ? { sub: user.sub, email: user.email } : null,
      currentAuthState: useAuthStore.getState(),
      currentURL: window.location.href
    });
  }, [isAuthenticated, auth0Loading, user, auth0Error]);

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
    const currentAuthState = useAuthStore.getState();
    const isLoggedIn = currentAuthState.token && currentAuthState.tokenType === 'private';

    if (isInIframe && !isLoggedIn) {
      root.classList.add('theme-light');
      return;
    }

    root.classList.add(`theme-${detectTheme}`);
  }, [detectTheme, authStore]);

  // Handle authentication state changes
  useEffect(() => {
    const currentAuthState = useAuthStore.getState();
    console.log('Authentication useEffect triggered:', {
      isAuthenticated,
      currentAuthState,
      shouldSkip: !isAuthenticated || (currentAuthState.token && currentAuthState.tokenType === 'private')
    });

    if (!isAuthenticated || (currentAuthState.token && currentAuthState.tokenType === 'private')) return;

    const handleAuth = async () => {
      try {
        const currentState = useAuthStore.getState();
        const oldToken = currentState.token;
        const token = await getAccessTokenSilently();

        console.log('Auth0 login detected, updating token:', {
          oldToken: oldToken ? oldToken.substring(0, 20) + '...' : 'none',
          newToken: token.substring(0, 20) + '...',
          oldTokenType: currentState.tokenType
        });

        useAuthStore.getState().saveData({
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
          console.log('Transferring chats from guest token to Auth0 token');
          try {
            await useAuthStore.getState().postTransferChats(oldToken, true);
            console.log('Chat transfer completed successfully');
          } catch (error) {
            console.error('Error transferring chats:', error);
          }
        } else {
          console.log('No old token found, skipping chat transfer');
        }

        assistantStore.setGuestChatsExist(false);

        // Load chats after successful login (loading state managed by assistant store)
        try {
          await assistantStore.getChats();
          console.log('Chats loaded successfully after login');
        } catch (error) {
          console.error('Error loading chats after login:', error);
        }

        const returnTo = helperStorage.get(LOGIN_REDIRECT_URL, '/');
        helperStorage.removeItem(LOGIN_REDIRECT_URL);

        // Navigate to return URL
        navigate(returnTo, { replace: true });
      } catch (error) {
        console.error('Error during authentication:', error);
      }
    };

    handleAuth();
  }, [isAuthenticated, user, getAccessTokenSilently, navigate]);

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
    <ErrorBoundary>
      <div className="app">
        <Outlet />

        <LoginPopUp />
        <ChatBotRenameDialog />
        <ConfirmationDialog />
      </div>
    </ErrorBoundary>
  );
};

export default App;
