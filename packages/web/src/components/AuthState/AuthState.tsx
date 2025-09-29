import React from 'react';
import LoginButton from '@/components/LoginButton/LoginButton';
import AuthStateAvatar from '@/components/AuthState/AuthStateAvatar';
import { useIsLoggedIn } from '@/stores/auth';

const AuthState: React.FC = () => {
  const isLoggedIn = useIsLoggedIn();

  return (
    <div>
      {isLoggedIn ? (
        <AuthStateAvatar />
      ) : (
        <LoginButton />
      )}
    </div>
  );
};

export default AuthState;
