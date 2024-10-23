import {mountRemixStubWithAppContext, wait} from '#/test-utils';
import {screen} from '@testing-library/react';
import {describe, expect, it, beforeEach, vi} from 'vitest';
import App, {ErrorBoundary, loader} from '../route';
import {createMockShopContext} from '~/routes/app.contracts.$id._index/tests/Fixtures';
import {APP_URL, BASE64_HOST, TEST_SHOP} from 'test/constants';

vi.mock('~/models/ShopInfo/ShopInfo.server', async (importActual) => {
  const original: any = await importActual();
  return {
    ...original,
    getShopInfos: vi.fn().mockResolvedValue({
      shop: {
        id: 'gid://shopify/Shop/9',
        primaryDomain: {
          url: 'https://example.myshopify.com',
        },
      },
    }),
  };
});

vi.mock('AppProvider', () => {
  return vi.fn(() => null);
});

async function mountApp(error = false) {
  mountRemixStubWithAppContext({
    routes: [
      {
        path: `/app`,
        Component: () => <App />,
        loader: error
          ? () => {
              throw new Error('Test Error');
            }
          : loader,
        ErrorBoundary,
      },
    ],
    remixStubProps: {
      initialEntries: [`/app/`],
    },
    shopContext: createMockShopContext(),
  });
  return wait(500);
}

async function testLoader() {
  const response = (await loader({
    request: new Request(
      `${APP_URL}?embedded=1&shop=${TEST_SHOP}&host=${BASE64_HOST}&id_token=12345`,
    ),
  })) as any;

  return await response.json();
}

describe('App route', () => {
  it('renders a link to the subscriptions home page', async () => {
    await mountApp();
    const link = screen.getByRole('link', {name: 'Home'});
    expect(link).toHaveAttribute('href', '/app');
    expect(link).toHaveAttribute('rel', 'home');
  });

  it('renders a link to plans', async () => {
    await mountApp();
    const link = screen.getByRole('link', {name: 'Plans'});
    expect(link).toHaveAttribute('href', '/app/plans');
  });

  it('renders a link to settings', async () => {
    await mountApp();
    const link = screen.getByRole('link', {name: 'Settings'});
    expect(link).toHaveAttribute('href', '/app/settings');
  });
});

describe('/app route loader', () => {
  it('returns the translations', async () => {
    const data = await testLoader();
    expect(data.polarisTranslations).toBeDefined();
  });

  it('returns the expected apiKey', async () => {
    const expectedApiKey = '12345';
    vi.stubEnv('SHOPIFY_API_KEY', expectedApiKey);
    const data = await testLoader();
    expect(data).toHaveProperty('apiKey', expectedApiKey);
  });

  it('returns the shopId', async () => {
    const data = await testLoader();
    expect(data.shopId).toBe(9);
  });

  it('returns the shopifyDomain', async () => {
    const data = await testLoader();
    expect(data.shopifyDomain).toBe('https://example.myshopify.com');
  });
});

describe('Error Boundary', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    const scriptElement = document.createElement('script');
    scriptElement.setAttribute('data-api-key', 'your-api-key');
    document.body.appendChild(scriptElement);
  });

  it('renders if an error occurs', async () => {
    vi.stubEnv('SHOPIFY_API_KEY', '123');

    await mountApp(true);

    expect(screen.getByText('Unable to load page')).toBeInTheDocument();
  });
});
