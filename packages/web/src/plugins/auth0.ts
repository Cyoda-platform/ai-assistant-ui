import { Auth0Provider } from '@auth0/auth0-react';
import { ReactNode } from 'react';

interface Auth0ConfigProps {
  children: ReactNode;
}

export const Auth0Config = ({ children }: Auth0ConfigProps) => {
  return (
    <Auth0Provider
      domain={import.meta.env.VITE_APP_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_APP_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: `${import.meta.env.VITE_APP_AUTH0_REDIRECT_URI}?auth0=true`,
        audience: import.meta.env.VITE_APP_AUTH0_AUDIENCE,
        organization: import.meta.env.VITE_APP_AUTH0_ORGANIZATION
      }}
    >
      {children}
    </Auth0Provider>
  );
};

export default Auth0Config;
