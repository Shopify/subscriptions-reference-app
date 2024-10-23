import {beforeAll} from 'vitest';
import {loadNamespaces} from './utils/i18nextTest';

beforeAll(async () => {
  await loadNamespaces();
});
