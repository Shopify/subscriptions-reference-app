import {json} from '@remix-run/node';
import {Link, Outlet, useLoaderData, useRouteError} from '@remix-run/react';
import {parseGid} from '@shopify/admin-graphql-api-utilities';
import {NavMenu} from '@shopify/app-bridge-react';
import polarisStyles from '@shopify/polaris/build/esm/styles.css?url';
import {boundary} from '@shopify/shopify-app-remix/server';
import {AppProvider} from '@shopify/shopify-app-remix/react';
import {useTranslation} from 'react-i18next';
import ShopContext from '~/context/ShopContext';

import i18nextServer from '~/i18n/i18next.server';
import {getShopInfos} from '~/models/ShopInfo/ShopInfo.server';
import {authenticate} from '~/shopify.server';

export const links = () => [{rel: 'stylesheet', href: polarisStyles}];

export const handle = {
  i18n: 'common',
};

export async function loader({request}) {
  await authenticate.admin(request);
  const {admin} = await authenticate.admin(request);
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
  const {primaryDomain, currencyCode, contactEmail, name, email, ianaTimezone} = shop;
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

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
