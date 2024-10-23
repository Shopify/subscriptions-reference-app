import ShopifyFormat from '@shopify/i18next-shopify';
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-fs-backend';
import {resolve} from 'node:path';
import {initReactI18next} from 'react-i18next';

const namespaces = [
  'common',
  'app.plans',
  'app.contracts',
  'app.plans.details',
];

i18n
  .use(initReactI18next)
  .use(ShopifyFormat)
  .use(LanguageDetector)
  .use(Backend)
  .init({
    lng: 'en',
    fallbackLng: 'en',

    ns: namespaces,
    defaultNS: 'common',

    debug: false,

    interpolation: {
      escapeValue: false,
    },
    backend: {loadPath: resolve('./public/locales/{{lng}}/{{ns}}.json')},
  });

export async function loadNamespaces() {
  await i18n.loadNamespaces(namespaces);
}

export default i18n;
