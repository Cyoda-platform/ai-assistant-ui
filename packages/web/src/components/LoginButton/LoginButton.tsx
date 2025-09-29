import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import HelperStorage from '@/helpers/HelperStorage';
import { LOGIN_REDIRECT_URL } from '@/helpers/HelperConstants';

const LoginButton: React.FC = () => {
  const helperStorage = new HelperStorage();
  const { loginWithRedirect } = useAuth0();

  const onClick = () => {
    helperStorage.set(LOGIN_REDIRECT_URL, '/');
    loginWithRedirect({
      authorizationParams: {
        prompt: 'login'
      }
    });
  };

  return (
    <button
      onClick={onClick}
      className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
    >
      Log in
    </button>
  );
};

export default LoginButton;
