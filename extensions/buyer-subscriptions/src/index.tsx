import {reactExtension} from '@shopify/ui-extensions-react/customer-account';

import {Router} from './App';
import {ErrorBoundary} from 'foundation/ErrorBoundary';

export default reactExtension('customer-account.page.render', () => <App />);

function App() {
  return (
    <ErrorBoundary>
      <Router />
    </ErrorBoundary>
  );
}
