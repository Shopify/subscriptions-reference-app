import {beforeEach, afterEach, describe, it, expect, vi} from 'vitest';
import {render} from 'preact';
import {OrderActionMenuItemExtension} from '../OrderActionMenuItem';
import {
  setupShopifyGlobalMock,
  cleanupShopifyGlobalMock,
} from '../../../shared/mocks/shopifyGlobal';
import translations from '../../locales/en.default.json';
describe('OrderActionMenuItemExtension', () => {
  let container: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();

    setupShopifyGlobalMock({
      orderId: 'gid://shopify/Order/123',
      translations,
    });

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null as any;
    cleanupShopifyGlobalMock();
  });

  it('renders a button to manage a subscription when there is a single non-cancelled contract', () => {
    const contracts = [
      {
        id: 'gid://shopify/SubscriptionContract/1',
        status: 'ACTIVE',
      },
    ];

    render(<OrderActionMenuItemExtension contracts={contracts} />, container);

    const button = container.querySelector('s-button');
    expect(button).not.toBeNull();
    expect(button?.textContent).toBe('Manage subscription');
    expect(button?.getAttribute('variant')).toBe('secondary');
    expect(button?.getAttribute('href')).toBe(
      'extension:buyer-subscriptions/subscriptions/1',
    );
  });

  it('renders a button to manage subscriptions when there are multiple non-cancelled contracts', () => {
    const contracts = [
      {
        id: 'gid://shopify/SubscriptionContract/1',
        status: 'ACTIVE',
      },
      {
        id: 'gid://shopify/SubscriptionContract/2',
        status: 'ACTIVE',
      },
    ];

    render(<OrderActionMenuItemExtension contracts={contracts} />, container);

    const button = container.querySelector('s-button');
    expect(button).not.toBeNull();
    expect(button?.textContent).toBe('Manage subscriptions');
    expect(button?.getAttribute('variant')).toBe('secondary');
    expect(button?.getAttribute('href')).toBe('extension:buyer-subscriptions/');
  });

  it('does not render anything when no subscription contracts are present', () => {
    const contracts = [];

    render(<OrderActionMenuItemExtension contracts={contracts} />, container);

    const button = container.querySelector('s-button');
    expect(button).toBeNull();
  });
});
