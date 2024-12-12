import './assets/css/main.scss';
import 'modern-normalize/modern-normalize.css';

import LayoutLogin from './layouts/LayoutLogin.vue';
import LayoutDefault from './layouts/LayoutDefault.vue';

import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';

// Plugins
import elementUi from "./plugins/element-ui";

const app = createApp(App);

app.component("layout-default", LayoutDefault);
app.component("layout-login", LayoutLogin);
app.use(createPinia());
app.use(elementUi);
app.use(router);

app.mount('#app');
