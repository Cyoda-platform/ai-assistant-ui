import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { Auth0Provider } from '@auth0/auth0-react';
import { ConfigProvider, App as AntdApp } from 'antd';
import 'modern-normalize/modern-normalize.css';
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
      >
        <I18nextProvider i18n={i18n}>
          <ConfigProvider theme={{ token: { colorPrimary: '#1890ff' } }}>
            <AntdApp>
              <RouterProvider router={router} />
            </AntdApp>
          </ConfigProvider>
        </I18nextProvider>
      </Auth0Provider>
    </React.StrictMode>
  );
});
