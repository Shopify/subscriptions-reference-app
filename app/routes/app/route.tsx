import {json} from '@remix-run/node';
import {Link, Outlet, useLoaderData, useRouteError} from '@remix-run/react';
import {parseGid} from '@shopify/admin-graphql-api-utilities';
import {NavMenu} from '@shopify/app-bridge-react';
import polarisStyles from '@shopify/polaris/build/esm/styles.css?url';
import {boundary} from '@shopify/shopify-app-remix/server';
import {AppProvider} from '@shopify/shopify-app-remix/react';
import {useTranslation} from 'react-i18next';
import ShopContext from '~/context/ShopContext';
import {ErrorBoundaryCard} from '~/components/ErrorBoundaryCard';

import i18nextServer from '~/i18n/i18next.server';
import {getShopInfos} from '~/models/ShopInfo/ShopInfo.server';
import {authenticate} from '~/shopify.server';
import {missingApprovedScopes} from '~/utils/missingApprovedScopes';
export const links = () => [{rel: 'stylesheet', href: polarisStyles}];

export const handle = {
  i18n: 'common',
};

export async function loader({request}) {
  const {admin, redirect} = await authenticate.admin(request);

  if (
    process.env.NODE_ENV === 'development' &&
    missingApprovedScopes().length > 0
  ) {
    return redirect('/missing-scopes');
  }
  const lng = await i18nextServer.getLocale(request);

  // In order for vite to know what to inject into the rollup bundle
  // there are some rules for dynamic imports.
  // The import must start with `./` or `../`
  // See https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#limitations
  const polarisTranslations = await import(
    `../../../node_modules/@shopify/polaris/locales/${lng}.json`
  );

  const shopInfos = await getShopInfos(admin.graphql);
  const {shop} = shopInfos;
  const {primaryDomain, currencyCode, contactEmail, name, email, ianaTimezone} =
    shop;
  const shopId = Number(parseGid(shop.id));
  const shopifyDomain = primaryDomain.url as string;

  return json({
    polarisTranslations,
    apiKey: process.env.SHOPIFY_API_KEY || '',
    shopId,
    name,
    shopifyDomain,
    currencyCode,
    ianaTimezone,
    contactEmail,
    email,
  });
}

export default function App() {
  const {
    apiKey,
    polarisTranslations,
    shopId,
    name,
    shopifyDomain,
    ianaTimezone,
    currencyCode,
    contactEmail,
    email,
  } = useLoaderData<typeof loader>();
  const {t} = useTranslation('common');

  const shopInfo = {
    shopId,
    name,
    shopifyDomain,
    ianaTimezone,
    currencyCode,
    contactEmail,
    email,
  };

  return (
    <>
      <AppProvider
        apiKey={apiKey}
        i18n={polarisTranslations}
        features={{
          polarisSummerEditions2023: true,
        }}
      >
        <ShopContext.Provider value={shopInfo}>
          <NavMenu>
            <Link to="/app" rel="home">
              {t('navigation.home')}
            </Link>
            <Link to="/app/plans">{t('navigation.plans')}</Link>

            <Link to="/app/settings">{t('navigation.settings')}</Link>
          </NavMenu>
          <Outlet />
        </ShopContext.Provider>
      </AppProvider>
    </>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  try {
    const shopifyError = boundary.error(error);
    return shopifyError;
  } catch {
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }

    return (
      <AppProvider
        isEmbeddedApp
        apiKey={
          typeof window === 'undefined'
            ? process.env.SHOPIFY_API_KEY!
            : (
                document.querySelector(
                  'script[data-api-key]',
                ) as HTMLScriptElement
              ).dataset.apiKey!
        }
      >
        <ErrorBoundaryCard />
      </AppProvider>
    );
  }
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
