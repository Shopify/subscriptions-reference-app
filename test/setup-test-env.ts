import '@testing-library/jest-dom/vitest';
import '@testing-library/react';
import '@shopify/react-testing/matchers';

import {installGlobals} from '@remix-run/node';
import {beforeAll, vi} from 'vitest';
import {API_KEY, API_SECRET_KEY, APP_URL, SCOPE} from './constants';

process.env.SCOPES = SCOPE;
process.env.SHOPIFY_APP_URL = APP_URL;
process.env.SHOPIFY_API_KEY = API_KEY;
process.env.SHOPIFY_API_SECRET = API_SECRET_KEY;

installGlobals();

globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {isDisabled: true};

beforeAll(() => {
  global.IS_REACT_ACT_ENVIRONMENT = false;
});

// For extension tests:
// Since are running our tests outside of a remote-ui environment
// we are getting a few warnings that we don't care about.
// This code silences these warnings but keeps others.
const originalError = console.error;
console.error = vi.fn((message) => {
  if (
    typeof message !== 'string' ||
    (!message.includes(
      'Warning: The tag <%s> is unrecognized in this browser.',
    ) &&
      !message.includes('inside a test was not wrapped in act(...)') &&
      !message.includes(
        'Warning: Received `%s` for a non-boolean attribute `%s`',
      ) &&
      !message.includes(
        'Warning: React does not recognize the `%s` prop on a DOM element',
      ) &&
      !message.includes(
        'is using incorrect casing. Use PascalCase for React components, or lowercase for HTML elements',
      ))
  ) {
    originalError(message);
  }
});
