import React, { useEffect, useMemo, useState } from 'react';
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
import { setTokenGetter, setAuth0Logout } from './helpers/HelperAuth';
import { useDetectTheme } from './helpers/HelperTheme';
import { useNavigationGuards } from './router';
import { initializeCleanState } from './utils/clearTestData';

const APP_ENTRY_ROUTE = '/';

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, getAccessTokenSilently, isAuthenticated, isLoading: auth0Loading, error: auth0Error, logout: auth0LogoutFn } = useAuth0();
  const [firstVisit, setFirstVisit] = useState(true);

  const authStore = useAuthStore();
  const assistantStore = useAssistantStore();
  const detectTheme = useDetectTheme();
  const helperStorage = useMemo(() => new HelperStorage(), []);
  const { handleFirstVisit } = useNavigationGuards();

  // Debug Auth0 state changes
  useEffect(() => {

  }, [isAuthenticated, auth0Loading, user, auth0Error]);

  // Set up token getter for API calls
  useEffect(() => {
    setTokenGetter(async (options?: { cacheMode?: 'off' | 'on' }) => {
      try {
        // If cacheMode is 'off', bypass the cache to force a fresh token from Auth0
        if (options?.cacheMode === 'off') {
          console.log('[TokenGetter] Requesting fresh token from Auth0 (cache bypass)');
          return await getAccessTokenSilently({ cacheMode: 'off' });
        }
        return await getAccessTokenSilently();
      } catch (error) {
        console.error('Error getting access token:', error);
        throw error;
      }
    });
  }, [getAccessTokenSilently]);

  // Register the Auth0 logout so the refreshToken interceptor can trigger
  // a real session logout when token refresh fails. Without this the
  // interceptor only clears local state and the Auth0 session cookie keeps
  // silently re-authenticating, producing an endless reload loop on 401s.
  useEffect(() => {
    setAuth0Logout(() => {
      auth0LogoutFn({
        logoutParams: { returnTo: window.location.origin }
      });
    });
  }, [auth0LogoutFn]);

  // Initialize clean state on app load
  useEffect(() => {
    initializeCleanState();
  }, []);

  // Apply stored theme preference (light by default on fresh browser)
  useEffect(() => {
    const root = document.documentElement;
    const stored = localStorage.getItem('app:theme');
    root.classList.remove('theme-dark', 'theme-light');
    if (stored === 'dark') {
      root.classList.add('theme-dark');
    } else if (stored === 'light') {
      root.classList.add('theme-light');
    }
    // No stored preference: no class applied, defaults to light via CSS root variables
  }, []);

  // Toggle marketing-page class on <html> for route-scoped layout/scroll/colour-scheme
  useEffect(() => {
    const isMarketing = location.pathname === '/';
    document.documentElement.classList.toggle('marketing-page', isMarketing);
    return () => {
      document.documentElement.classList.remove('marketing-page');
    };
  }, [location.pathname]);

  // Handle authentication state changes
  useEffect(() => {
    const currentAuthState = useAuthStore.getState();

    if (!isAuthenticated || (currentAuthState.token && currentAuthState.tokenType === 'private')) return;

    // Set flag immediately if we have an old token to prevent any getChats calls during transition
    const currentState = useAuthStore.getState();
    const isGuestToken = currentState.tokenType === 'public';
    if (currentState.token && !isGuestToken) {
      assistantStore.setIsTransferringChats(true);
    }

    const handleAuth = async () => {
      try {
        const oldToken = !isGuestToken ? currentState.token : null;
        const token = await getAccessTokenSilently();



        // Parse JWT token to extract caas_cyoda_employee
        let isCyodaEmployee = false;
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const parsed = JSON.parse(jsonPayload);
          isCyodaEmployee = parsed.caas_cyoda_employee === true;

        } catch (e) {
          console.error('❌ Error parsing JWT token:', e);
        }

        const authData = {
          token: token,
          tokenType: "private",
          refreshToken: null,
          userId: user?.sub || '',
          username: user?.name || '',
          picture: user?.picture || '',
          family_name: user?.family_name || '',
          given_name: user?.given_name || '',
          email: user?.email || '',
          isCyodaEmployee: isCyodaEmployee,
          superUserMode: false, // Reset super user mode on login
        };

        useAuthStore.getState().saveData(authData);

        assistantStore.setGuestChatsExist(false);

        const storedReturnTo = helperStorage.get<string>(LOGIN_REDIRECT_URL, APP_ENTRY_ROUTE);
        const returnTo = !storedReturnTo || storedReturnTo === '/' ? APP_ENTRY_ROUTE : storedReturnTo;
        helperStorage.removeItem(LOGIN_REDIRECT_URL);

        // Redirect as soon as auth is established so UI state on the pre-login page
        // isn't lost by a late remount after the user starts interacting with it.
        if (location.pathname !== returnTo) {
          navigate(returnTo, { replace: true });
        }

        if (oldToken) {
          try {
            await useAuthStore.getState().postTransferChats(oldToken, true);

            // Load chats after transfer with NEW user token
            await assistantStore.getChats();
          } catch (error) {
            console.error('Error transferring chats:', error);
          } finally {
            // Clear the flag
            assistantStore.setIsTransferringChats(false);
          }
        } else {

          // Clear the flag since there's no transfer
          assistantStore.setIsTransferringChats(false);

          // Load chats for new user login
          try {
            await assistantStore.getChats();
          } catch (error) {
            console.error('Error loading chats after login:', error);
          }
        }
      } catch (error) {
        console.error('Error during authentication:', error);
      }
    };

    handleAuth();
  }, [assistantStore, helperStorage, isAuthenticated, location.pathname, user, getAccessTokenSilently, navigate]);

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
