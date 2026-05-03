import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import HelperStorage from '@/helpers/HelperStorage';
import { LOGIN_REDIRECT_URL } from '@/helpers/HelperConstants';

const APP_ENTRY_ROUTE = '/home';

const LoginButton: React.FC = () => {
  const helperStorage = new HelperStorage();
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();

  const onClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    console.log('[CyodaCloud CTA] clicked', {
      source: 'shared login button',
      isAuthenticated,
      isLoading,
      pathname: window.location.pathname,
    });

    if (isLoading) {
      console.log('[CyodaCloud CTA] auth still loading; ignoring click');
      return;
    }

    if (isAuthenticated) {
      console.log('[CyodaCloud CTA] authenticated; navigating to /home');
      navigate(APP_ENTRY_ROUTE);
      return;
    }

    try {
      helperStorage.set(LOGIN_REDIRECT_URL, APP_ENTRY_ROUTE);
      localStorage.setItem('LOGIN_REDIRECT_URL', APP_ENTRY_ROUTE);
    } catch (error) {
      console.error('[CyodaCloud CTA] failed to store return target', error);
    }

    try {
      console.log('[CyodaCloud CTA] unauthenticated; starting Auth0 login');
      await loginWithRedirect({
        appState: { returnTo: APP_ENTRY_ROUTE },
        authorizationParams: {
          prompt: 'login'
        }
      });
    } catch (error) {
      console.error('[CyodaCloud CTA] loginWithRedirect failed', error);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
    >
      Log in
    </button>
  );
};

export default LoginButton;
