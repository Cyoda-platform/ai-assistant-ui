import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useTranslationsStore } from "../stores/translations";
import enJson from '@/i18n/en.json';

type TranslationValue = Record<string, unknown>;

const isPlainObject = (value: unknown): value is TranslationValue =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const deepMergeTranslations = (
  base: TranslationValue,
  overrides: TranslationValue
): TranslationValue => {
  const merged: TranslationValue = { ...base };

  Object.entries(overrides).forEach(([key, value]) => {
    const existingValue = merged[key];

    if (isPlainObject(existingValue) && isPlainObject(value)) {
      merged[key] = deepMergeTranslations(existingValue, value);
      return;
    }

    if (value !== undefined) {
      merged[key] = value;
    }
  });

  return merged;
};

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
    return deepMergeTranslations(enJson, isPlainObject(data) ? data : {});
  } catch (e) {
    console.error('Failed to load translations:', e);
    return enJson;
  }
}

export default i18n;
