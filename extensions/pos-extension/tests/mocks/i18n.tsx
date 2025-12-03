import React from 'react';
import {I18nextProvider} from 'react-i18next';
import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import ShopifyFormat from '@shopify/i18next-shopify';
import enTranslations from '../../locales/en.default.json';

// Initialize a test instance of i18n
const i18nForTests = i18n.createInstance();

i18nForTests
  .use(initReactI18next)
  .use(ShopifyFormat.default || ShopifyFormat)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    ns: ['translation'],
    defaultNS: 'translation',
    resources: {
      en: {
        translation: enTranslations,
      },
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export const I18nTestProvider = ({children}: {children: React.ReactNode}) => {
  return <I18nextProvider i18n={i18nForTests}>{children}</I18nextProvider>;
};

export default i18nForTests;
