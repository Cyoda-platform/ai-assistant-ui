import 'modern-normalize/modern-normalize.css';

import LayoutLogin from './layouts/LayoutLogin.vue';
import LayoutSidebar from "@/layouts/LayoutSidebar.vue";

import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';

// Plugins
import elementUi from "./plugins/element-ui";

const app = createApp(App);

app.component("layout-sidebar", LayoutSidebar);
app.component("layout-login", LayoutLogin);
app.use(createPinia());
app.use(elementUi);
app.use(router);

import './assets/css/main.scss';

app.mount('#app');
