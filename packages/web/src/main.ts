import 'modern-normalize/modern-normalize.css';

import LayoutSidebar from "@/layouts/LayoutSidebar.vue";
import LayoutDefault from "@/layouts/LayoutDefault.vue";

import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';

// Plugins
import elementUi from "./plugins/element-ui.ts";
import auth0 from "./plugins/auth0.ts";
import i18nPlugin, { loadLocaleMessages } from './plugins/i18n';

const app = createApp(App);

app.component("layout-sidebar", LayoutSidebar);
app.component("layout-default", LayoutDefault);
app.use(createPinia());
app.use(elementUi);
app.use(router);
app.use(auth0);
app.use(i18nPlugin);

import './assets/css/main.scss';

loadLocaleMessages('en').then(() => {
  app.mount('#app');
});
