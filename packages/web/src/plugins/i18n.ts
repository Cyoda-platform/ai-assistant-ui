import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useTranslationsStore } from "../stores/translations";
import enJson from '@/i18n/en.json';

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    resources: {
      en: {
        translation: {}
      }
    },
    interpolation: {
      escapeValue: false,
    },
  });

export async function loadLocaleMessages(locale: string) {
  try {
    const messages = await getMessages();
    if (messages) {
      i18n.addResourceBundle(locale, 'translation', messages, true, true);
    }
    i18n.changeLanguage(locale);
  } catch (error) {
    console.error('Failed to load locale messages:', error);
  }
}

async function getMessages() {
  try {
    const translationsStore = useTranslationsStore.getState();
    const { data } = await translationsStore.getLabelsConfig();
    return data;
  } catch (e) {
    console.error('Failed to load translations:', e);
    return enJson;
  }
}

export default i18n;
