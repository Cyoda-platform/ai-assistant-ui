import '@ant-design/v5-patch-for-react-19';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { Auth0Provider } from '@auth0/auth0-react';
import { ConfigProvider, App as AntdApp, theme } from 'antd';
import 'modern-normalize/modern-normalize.css';
import './styles/tailwind.css';
import 'antd/dist/reset.css';
import './assets/css/main.scss';

import App from './App';
import { router } from './router';
import i18n, { loadLocaleMessages } from './plugins/i18n';

// Load translations and then render the app
loadLocaleMessages('en').then(() => {
  const root = ReactDOM.createRoot(document.getElementById('app')!);

  root.render(
    <React.StrictMode>
      <Auth0Provider
        domain={import.meta.env.VITE_APP_AUTH0_DOMAIN}
        clientId={import.meta.env.VITE_APP_AUTH0_CLIENT_ID}
        authorizationParams={{
          redirect_uri: `${import.meta.env.VITE_APP_AUTH0_REDIRECT_URI}?auth0=true`,
          audience: import.meta.env.VITE_APP_AUTH0_AUDIENCE,
          organization: import.meta.env.VITE_APP_AUTH0_ORGANIZATION
        }}
        onRedirectCallback={(appState) => {
          console.log('Auth0 redirect callback triggered:', appState);
          // Navigate to the intended URL or default to root
          window.history.replaceState({}, document.title, appState?.returnTo || '/');
        }}
      >
        <I18nextProvider i18n={i18n}>
          <ConfigProvider
            theme={{
              algorithm: theme.darkAlgorithm,
              token: {
                colorPrimary: '#14b8a6', // teal-500
                colorBgBase: '#1e293b', // slate-800
                colorTextBase: '#e2e8f0', // slate-200
                colorBorder: '#475569', // slate-600
                borderRadius: 8,
              }
            }}
          >
            <AntdApp>
              <RouterProvider router={router} />
            </AntdApp>
          </ConfigProvider>
        </I18nextProvider>
      </Auth0Provider>
    </React.StrictMode>
  );
});
