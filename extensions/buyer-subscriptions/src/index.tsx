import {reactExtension} from '@shopify/ui-extensions-react/customer-account';

import {Router} from './App';
import {ErrorBoundary} from 'foundation/ErrorBoundary';
import {useExtensionApi, useGraphqlApi} from 'foundation/Api';
import {BugsnagProvider} from 'foundation/Bugsnag';
import ShopQuery from 'foundation/graphql/ShopQuery';
import type {ShopQuery as ShopQueryData} from 'generatedTypes/customer.generated';
import {useEffect} from 'react';

export default reactExtension('customer-account.page.render', () => <App />);

function App() {
  const [query, {data, loading, error}] = useGraphqlApi<ShopQueryData>();
  const {
    extension: {version},
  } = useExtensionApi();

  useEffect(() => {
    query(ShopQuery);
  }, [query]);

  let shop: ShopQueryData['shop'] | undefined;
  if (data && !loading && !error) {
    shop = data.shop;
  }

  return (
    <BugsnagProvider shop={shop} version={version}>
      <ErrorBoundary>
        <Router />
      </ErrorBoundary>
    </BugsnagProvider>
  );
}
