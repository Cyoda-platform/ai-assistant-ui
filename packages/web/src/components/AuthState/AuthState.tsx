import React from 'react';
import LoginButton from '@/components/LoginButton/LoginButton';
import AuthStateAvatar from '@/components/AuthState/AuthStateAvatar';
import { useAuthStore } from '@/stores/auth';

const AuthState: React.FC = () => {
  const authStore = useAuthStore();

  return (
    <div>
      {authStore.isLoggedIn ? (
        <AuthStateAvatar />
      ) : (
        <LoginButton />
      )}
    </div>
  );
};

export default AuthState;
