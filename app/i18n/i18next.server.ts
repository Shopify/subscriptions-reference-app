import ShopifyFormat from '@shopify/i18next-shopify';
import Backend from 'i18next-fs-backend';
import {resolve} from 'node:path';
import {RemixI18Next} from 'remix-i18next/server';

import i18nextOptions from './i18nextOptions';

const i18next = new RemixI18Next({
  detection: {
    supportedLanguages: i18nextOptions.supportedLngs,
    fallbackLanguage: i18nextOptions.fallbackLng,
    searchParamKey: 'locale',
    order: ['searchParams'],
  },
  i18next: {
    ...i18nextOptions,
    backend: {
      loadPath: resolve('./public/locales/{{lng}}/{{ns}}.json'),
    },
  },
  plugins: [Backend, ShopifyFormat.default ?? ShopifyFormat],
});

export default i18next;
