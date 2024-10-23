import {screen} from '@testing-library/react';
import {testLoaderWithAuth} from 'test/utils';
import {describe, expect, it, vi} from 'vitest';
import App, {loader} from '../route';
import {mountComponentWithRemixStub} from '#/test-utils';

vi.mock('@remix-run/react', async (originalImport) => {
  const original: any = await originalImport();
  return {
    ...original,
    useLoaderData: vi.fn().mockReturnValue({}),
  };
});

vi.mock('~/models/ShopInfo/ShopInfo.server', async () => {
  const original: any = await vi.importActual(
    '~/models/ShopInfo/ShopInfo.server',
  );
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

describe('/app route loader', () => {
  it('returns the expected apiKey', async () => {
    const expectedApiKey = '12345';
    vi.stubEnv('SHOPIFY_API_KEY', expectedApiKey);

    const data = await testLoaderWithAuth(loader);

    expect(data).toHaveProperty('apiKey', expectedApiKey);
  });

  it('returns the translations', async () => {
    const data = await testLoaderWithAuth(loader);
    expect(data.polarisTranslations).toBeDefined();
  });

  it('returns the shopId', async () => {
    const data = await testLoaderWithAuth(loader);
    expect(data.shopId).toBe(9);
  });

  it('returns the shopifyDomain', async () => {
    const data = await testLoaderWithAuth(loader);
    expect(data.shopifyDomain).toBe('https://example.myshopify.com');
  });
});

describe('component', () => {
  it('renders a link to the plans page', async () => {
    mountComponentWithRemixStub(<App />);

    const link = screen.getByRole('link', {name: 'Home'});
    expect(link).toHaveAttribute('href', '/app');
    expect(link).toHaveAttribute('rel', 'home');
  });

  it('renders a link to plans', async () => {
    mountComponentWithRemixStub(<App />);

    const link = screen.getByRole('link', {name: 'Plans'});
    expect(link).toHaveAttribute('href', '/app/plans');
  });

  
  it('renders a link to settings', async () => {
    mountComponentWithRemixStub(<App />);

    const link = screen.getByRole('link', {
      name: 'Settings',
    });
    expect(link).toHaveAttribute('href', '/app/settings');
  });
});
