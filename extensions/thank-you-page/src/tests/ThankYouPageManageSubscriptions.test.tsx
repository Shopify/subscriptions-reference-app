import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest';
import {render} from 'preact';
import {signal} from '@preact/signals';
import {
  setupShopifyGlobalMock,
  cleanupShopifyGlobalMock,
} from '../../../shared/mocks/shopifyGlobal';
import {ThankYouPageManageSubscriptions} from '../ThankYouPageManageSubscriptions';
import translations from '../../locales/en.default.json';

describe('ThankYouPageManageSubscriptions', () => {
  let container: HTMLElement;
  let mocks: ReturnType<typeof setupShopifyGlobalMock>;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);

    mocks = setupShopifyGlobalMock({
      translations,
      storefrontUrl: 'https://test-shop.myshopify.com',
    });
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null as any;
    cleanupShopifyGlobalMock();
  });

  it('renders the component when there is a subscription and does not show the notice banner', async () => {
    mocks.mockLines.mockReturnValue({
      value: [
        {
          merchandise: {
            sellingPlan: {
              recurringDeliveries: true,
            },
          },
        },
      ],
    });
    mocks.mockEditor.mockReturnValue(false);

    render(<ThankYouPageManageSubscriptions />, container);

    await vi.waitFor(() => {
      const button = container.querySelector('s-button');
      expect(button).not.toBeNull();
    });

    const button = container.querySelector('s-button');
    expect(button?.textContent).toBe('Manage your subscription');
    expect(button?.getAttribute('variant')).toBe('secondary');
    expect(button?.getAttribute('href')).toBe(
      'https://test-shop.myshopify.com/account',
    );

    const banner = container.querySelector('s-banner');
    expect(banner).toBeNull();
  });

  it('renders the component in the editor and shows the notice banner', async () => {
    mocks.mockEditor.mockReturnValue(true);
    mocks.mockLines.mockReturnValue({value: []});

    render(<ThankYouPageManageSubscriptions />, container);

    await vi.waitFor(() => {
      const banner = container.querySelector('s-banner');
      expect(banner).not.toBeNull();
    });

    const banner = container.querySelector('s-banner');
    expect(banner?.textContent).toBe(
      'This extension is only visible for orders with subscriptions.',
    );
    expect(banner?.getAttribute('tone')).toBe('info');

    const button = container.querySelector('s-button');
    expect(button).not.toBeNull();
    expect(button?.textContent).toBe('Manage your subscription');
    expect(button?.getAttribute('variant')).toBe('secondary');
    expect(button?.getAttribute('href')).toBe(
      'https://test-shop.myshopify.com/account',
    );
  });

  it('does not render the component when there is no subscription', async () => {
    mocks.mockLines.mockReturnValue({value: []});
    mocks.mockEditor.mockReturnValue(false);

    render(<ThankYouPageManageSubscriptions />, container);

    await vi.waitFor(() => {
      const button = container.querySelector('s-button');
      expect(button).toBeNull();

      const banner = container.querySelector('s-banner');
      expect(banner).toBeNull();
    });
  });

  it('re-renders when shopify.lines signal changes from no subscription to having a subscription', async () => {
    const linesSignal = signal([]);

    mocks.mockLines.mockImplementation(() => ({
      value: linesSignal.value,
    }));
    mocks.mockEditor.mockReturnValue(false);

    render(<ThankYouPageManageSubscriptions />, container);

    await vi.waitFor(() => {
      const button = container.querySelector('s-button');
      expect(button).toBeNull();
    });

    linesSignal.value = [
      {
        merchandise: {
          sellingPlan: {
            recurringDeliveries: true,
          },
        },
      },
    ];

    await vi.waitFor(() => {
      const button = container.querySelector('s-button');
      expect(button).not.toBeNull();
    });

    const button = container.querySelector('s-button');
    expect(button?.textContent).toBe('Manage your subscription');
    expect(button?.getAttribute('variant')).toBe('secondary');
    expect(button?.getAttribute('href')).toBe(
      'https://test-shop.myshopify.com/account',
    );

    linesSignal.value = [];

    await vi.waitFor(() => {
      const button = container.querySelector('s-button');
      expect(button).toBeNull();
    });
  });
});
