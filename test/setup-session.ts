import {beforeEach} from 'vitest';
import shopify from '../app/shopify.server';

// Prevents leaking of context between tests
beforeEach(() => {
  (shopify.sessionStorage as any).sessions = {};
});
