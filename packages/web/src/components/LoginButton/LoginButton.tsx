import React from 'react';
import { Button } from 'antd';
import { useAuth0 } from '@auth0/auth0-react';
import HelperStorage from '@/helpers/HelperStorage';
import { LOGIN_REDIRECT_URL } from '@/helpers/HelperConstants';

const LoginButton: React.FC = () => {
  const helperStorage = new HelperStorage();
  const { loginWithRedirect } = useAuth0();

  const onClick = () => {
    helperStorage.set(LOGIN_REDIRECT_URL, '/home');
    loginWithRedirect({
      authorizationParams: {
        prompt: 'login'
      }
    });
  };

  return (
    <Button 
      onClick={onClick} 
      type="primary" 
      className="btn btn-primary-darken new-chat-view__btn-login"
    >
      Log in
    </Button>
  );
};

export default LoginButton;
