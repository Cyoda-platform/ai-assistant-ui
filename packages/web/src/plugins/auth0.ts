import {createAuth0} from '@auth0/auth0-vue';

export default {
  install: (app) => {
    // Определяем правильный redirect_uri для Electron
    const isElectron = import.meta.env.VITE_IS_ELECTRON;
    let redirectUri = import.meta.env.VITE_APP_AUTH0_REDIRECT_URI;
    
    if (isElectron) {
      // Для Electron используем file:// протокол или специальный схема
      redirectUri = 'http://localhost:3009';
    } else {
      // Для веба добавляем параметр
      redirectUri = `${redirectUri}?auth0=true`;
    }

    const auth0 = createAuth0({
      domain: import.meta.env.VITE_APP_AUTH0_DOMAIN,
      clientId: import.meta.env.VITE_APP_AUTH0_CLIENT_ID,
      authorizationParams: {
        redirect_uri: redirectUri,
        audience: import.meta.env.VITE_APP_AUTH0_AUDIENCE,
        organization: import.meta.env.VITE_APP_AUTH0_ORGANIZATION,
        scope: 'openid profile email offline_access'
      },
      useRefreshTokens: true,
      cacheLocation: 'localstorage'
    });
    app.use(auth0);
    window.$auth0 = auth0;
  }
}
