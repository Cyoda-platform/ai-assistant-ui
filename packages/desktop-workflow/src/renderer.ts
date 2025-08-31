/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.ts` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import 'modern-normalize/modern-normalize.css';

import LayoutSidebar from "@/layouts/LayoutSidebar.vue";
import LayoutDefault from "@/layouts/LayoutDefault.vue";

import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from '@/App.vue';
import router from './router';

// Plugins
import elementUi from "@/plugins/element-ui.ts";
import auth0 from "@/plugins/auth0.ts";
import i18nPlugin, { loadLocaleMessages } from '@/plugins/i18n';

const app = createApp(App);

app.component("layout-sidebar", LayoutSidebar);
app.component("layout-default", LayoutDefault);
app.use(createPinia());
app.use(elementUi);
app.use(router);
app.use(auth0);
app.use(i18nPlugin);

import '@/assets/css/main.scss';
loadLocaleMessages('en').then(() => {
    app.mount('#app');
});
