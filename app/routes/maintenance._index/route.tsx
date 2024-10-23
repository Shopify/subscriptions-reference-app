import {AppProvider, Layout, Page, Text} from '@shopify/polaris';
import polarisTranslations from '@shopify/polaris/locales/en.json';

import polarisStyles from '@shopify/polaris/build/esm/styles.css?url';

export const links = () => [{rel: 'stylesheet', href: polarisStyles}];

export async function loader() {
  return new Response(null, {status: 503});
}

export async function action() {
  return new Response(null, {status: 503});
}

export default function Maintenance() {
  return (
    <AppProvider i18n={polarisTranslations}>
      <Page title="Scheduled maintenance">
        <Layout>
          <Layout.Section>
            <Text as="p">
              The subscriptions app is undergoing scheduled maintenance. Please
              check back in a few minutes.
            </Text>
          </Layout.Section>
        </Layout>
      </Page>
    </AppProvider>
  );
}
