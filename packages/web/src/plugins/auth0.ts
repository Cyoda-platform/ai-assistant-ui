import {createAuth0} from '@auth0/auth0-vue';

export default {
  install: (app) => {
    const auth0 = createAuth0({
      domain: import.meta.env.VITE_APP_AUTH0_DOMAIN,
      clientId: import.meta.env.VITE_APP_AUTH0_CLIENT_ID,
      authorizationParams: {
        redirect_uri: import.meta.env.VITE_APP_AUTH0_REDIRECT_URI,
        audience: import.meta.env.VITE_APP_AUTH0_AUDIENCE,
        organization: import.meta.env.VITE_APP_AUTH0_ORGANIZATION,
      }
    });
    app.use(auth0);
    window.$auth0 = auth0;
  }
}
