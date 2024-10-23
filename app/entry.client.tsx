import {RemixBrowser} from '@remix-run/react';
import ShopifyFormat from '@shopify/i18next-shopify';
import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import {startTransition, StrictMode} from 'react';
import {hydrateRoot} from 'react-dom/client';
import {I18nextProvider, initReactI18next} from 'react-i18next';
import {getInitialNamespaces} from 'remix-i18next/client';
import i18nextOptions from './i18n/i18nextOptions';

function hydrate() {
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <I18nextProvider i18n={i18next}>
          <RemixBrowser />
        </I18nextProvider>
      </StrictMode>,
    );
  });
}

async function initI18n() {
  await i18next
    .use(initReactI18next)
    .use(ShopifyFormat.default || ShopifyFormat)
    .use(LanguageDetector)
    .use(Backend)
    .init({
      ...i18nextOptions,
      // @ts-ignore We set ENV in root.tsx
      debug: window.ENV.NODE_ENV === 'development',
      ns: getInitialNamespaces(),
      backend: {loadPath: '/locales/{{lng}}/{{ns}}.json'},
      detection: {
        order: ['htmlTag'],
        caches: [],
      },
    });
}

initI18n().then(hydrate);
