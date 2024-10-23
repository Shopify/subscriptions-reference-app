import {json} from '@remix-run/node';
import {
  Button,
  Card,
  FormLayout,
  Page,
  AppProvider as PolarisAppProvider,
  Text,
  TextField,
} from '@shopify/polaris';
import {useState} from 'react';

import {Form, useActionData, useLoaderData} from '@remix-run/react';
import polarisStyles from '@shopify/polaris/build/esm/styles.css?url';

import i18nextServer from '~/i18n/i18next.server';
import {login} from '../../shopify.server';
import {loginErrorMessage} from './error.server';

export const links = () => [{rel: 'stylesheet', href: polarisStyles}];

export async function loader({request}) {
  const errors = loginErrorMessage(await login(request));

  const lng = await i18nextServer.getLocale(request);

  // In order for vite to know what to inject into the rollup bundle
  // there are some rules for dynamic imports.
  // The import must start with `./` or `../`
  // See https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#limitations
  const polarisTranslations = await import(
    `../../../node_modules/@shopify/polaris/locales/${lng}.json`
  );

  return json({
    errors,
    polarisTranslations,
  });
}

export async function action({request}) {
  const errors = loginErrorMessage(await login(request));

  return json({
    errors,
  });
}

export default function Auth() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [shop, setShop] = useState('');
  const {errors} = actionData || loaderData;
  const polarisTranslations = loaderData.polarisTranslations;

  return (
    <PolarisAppProvider i18n={polarisTranslations}>
      <Page>
        <Card>
          <Form method="post">
            <FormLayout>
              <Text variant="headingMd" as="h2">
                Log in
              </Text>
              <TextField
                type="text"
                name="shop"
                label="Shop domain"
                helpText="example.myshopify.com"
                value={shop}
                onChange={setShop}
                autoComplete="on"
                error={'shop' in errors ? errors.shop : undefined}
              />
              <Button submit>Log in</Button>
            </FormLayout>
          </Form>
        </Card>
      </Page>
    </PolarisAppProvider>
  );
}
