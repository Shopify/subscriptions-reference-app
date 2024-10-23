import {json, redirect} from '@remix-run/node';
import type {MetaFunction} from '@remix-run/react';
import {Form, useLoaderData} from '@remix-run/react';
import {
  AppProvider,
  BlockStack,
  Button,
  Card,
  FormLayout,
  InlineStack,
  Page,
  Text,
  TextField,
} from '@shopify/polaris';
import polarisStyles from '@shopify/polaris/build/esm/styles.css?url';
import {useCallback, useState} from 'react';

import i18nextServer from '~/i18n/i18next.server';
import {login} from '../../shopify.server';

export const links = () => [
  {
    rel: 'stylesheet',
    href: polarisStyles,
  },
];

export async function loader({request}) {
  const url = new URL(request.url);
  const lng = await i18nextServer.getLocale(request);

  // In order for vite to know what to inject into the rollup bundle
  // there are some rules for dynamic imports.
  // The import must start with `./` or `../`
  // See https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#limitations
  const polarisTranslations = await import(
    `../../../node_modules/@shopify/polaris/locales/${lng}.json`
  );

  if (url.searchParams.get('shop')) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return json({
    showForm: Boolean(login),
    polarisTranslations,
  });
}

export const meta: MetaFunction = () => {
  return [{title: 'Subscriptions by Shopify'}];
};

export default function App() {
  const {showForm, polarisTranslations} = useLoaderData<typeof loader>();

  const [textFieldValue, setTextFieldValue] = useState('');

  const handleTextFieldChange = useCallback(
    (value: string) => setTextFieldValue(value),
    [],
  );

  return (
    <AppProvider
      i18n={polarisTranslations}
      features={{
        polarisSummerEditions2023: true,
      }}
    >
      <section
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          paddingLeft: '32px',
          paddingRight: '32px',
          backgroundColor: 'var(--p-color-bg)',
        }}
      >
        <Page narrowWidth>
          <InlineStack>
            <Card>
              <BlockStack gap="200">
                <Text as="h1" variant="headingLg">
                  Subscriptions
                </Text>
                {showForm && (
                  <Form method="post" action="/auth/login">
                    <FormLayout>
                      <TextField
                        label="Enter your shop domain to log in or install this app."
                        type="text"
                        value={textFieldValue}
                        onChange={handleTextFieldChange}
                        autoComplete="off"
                        name="shop"
                        placeholder="example.myshopify.com"
                      />
                      <Button submit variant="primary">
                        Install app
                      </Button>
                    </FormLayout>
                  </Form>
                )}
              </BlockStack>
            </Card>
          </InlineStack>
        </Page>
      </section>
    </AppProvider>
  );
}
