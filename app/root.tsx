import type {LoaderFunctionArgs} from '@remix-run/node';
import {json} from '@remix-run/node';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react';
import {useTranslation} from 'react-i18next';

import remixI18n from './i18n/i18next.server';

export let handle = {
  i18n: 'common',
};

export async function loader({request}: LoaderFunctionArgs) {
  const locale = await remixI18n.getLocale(request);
  const {NODE_ENV} = process.env;

  return json({
    locale,
    ENV: {
      NODE_ENV: NODE_ENV ?? 'development',
      HASH: process.env.GITHUB_SHA,
    },
  });
}

export default function App() {
  const {locale, ENV} = useLoaderData<typeof loader>();
  const {i18n} = useTranslation();
  return (
    <html lang={locale} dir={i18n.dir()}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <meta name="shopify-experimental-features" content="keepAlive" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(ENV)}`,
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}
