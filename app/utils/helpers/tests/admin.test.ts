import {describe, expect, it} from 'vitest';
import {buildAdminURL} from '../admin';

describe('buildAdminURL', () => {
  it('should build correct URL for spin.dev domain', () => {
    const shopifyDomain =
      'https://1p-development-store-1.shopify.onboardingaction.julien-henrotte.asia.spin.dev';
    const adminPath = '/settings/general';
    const url = buildAdminURL(shopifyDomain, adminPath);
    expect(url).toBe(
      'https://admin.web.onboardingaction.julien-henrotte.asia.spin.dev/store/1p-development-store-1/settings/general',
    );
  });

  it('should build correct URL for shopify.com domain', () => {
    const shopifyDomain = 'https://hackdays-store.myshopify.com';
    const adminPath = '/settings/general';
    const url = buildAdminURL(shopifyDomain, adminPath);
    expect(url).toBe(
      'https://admin.shopify.com/store/hackdays-store/settings/general',
    );
  });
});
