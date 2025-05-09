import {createI18n} from 'vue-i18n';
import type {App} from 'vue';
import privateClient from '@/clients/private';
import useTranslationsStore from "../stores/translations";

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {},
});

export default {
  install(app: App) {
    app.use(i18n);
  },
};

export async function loadLocaleMessages(locale: string) {
  if (!i18n.global.availableLocales.includes(locale)) {
    const messages = await getMessages();
    if (messages) {
      i18n.global.setLocaleMessage(locale, messages);
    }
  }

  i18n.global.locale.value = locale;
}

async function getMessages() {
  try {
    const translationsStore = useTranslationsStore();
    const {data} = await translationsStore.getLabelsConfig();
    return data;
  } catch (e) {
    console.error('Failed to load translations:', e);
    return {};
  }
}

export {i18n};
