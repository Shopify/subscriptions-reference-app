import {vi} from 'vitest';
import {createMockI18n} from './i18n';

interface StaticOptions {
  translations?: Record<string, any>;
  orderId?: string;
  storefrontUrl?: string;
}

export function setupShopifyGlobalMock(staticOptions: StaticOptions = {}) {
  const {
    translations = {},
    orderId = 'gid://shopify/Order/123',
    storefrontUrl = 'https://test-shop.myshopify.com',
  } = staticOptions;

  const mockI18n = createMockI18n(translations);
  const mockClose = vi.fn();
  const mockGraphql = vi.fn().mockResolvedValue({
    data: {},
    errors: [],
  });
  const mockLines = vi.fn(() => ({value: []}));
  const mockEditor = vi.fn(() => false);
  const mockSelected = vi.fn(() => []);

  const shopifyMock: any = {
    i18n: mockI18n,
    close: mockClose,
    orderId,
    shop: {storefrontUrl},
    extension: {
      get editor() {
        return mockEditor();
      },
    },
    admin: {
      graphql: mockGraphql,
    },
    data: {
      get selected() {
        return mockSelected();
      },
    },
    get lines() {
      return mockLines();
    },
  };

  (global as any).shopify = shopifyMock;

  return {
    mockI18n,
    mockClose,
    mockGraphql,
    mockLines,
    mockEditor,
    mockSelected,
    setGraphqlResponse: (data: any, errors: any[] = []) => {
      mockGraphql.mockResolvedValueOnce({data, errors});
    },
  };
}

export function cleanupShopifyGlobalMock() {
  delete (global as any).shopify;
  vi.clearAllMocks();
}
