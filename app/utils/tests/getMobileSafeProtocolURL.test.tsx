import {describe, expect, it} from 'vitest';
import {getMobileSafeProtocolURL} from '../getMobileSafeProtocolURL';

global.shopify = {
  ...global.shopify,
  environment: {
    mobile: true,
    embedded: false,
    pos: false,
  },
  config: {
    host: 'ZXhhbXBsZS5jb20=', // 'example.com'
    apiKey: '',
    shop: '',
    locale: '',
  },
};

describe('getMobileSafeProtocolURL', () => {
  it('should return the same path if on desktop', () => {
    global.shopify.environment.mobile = false;
    const originalPath = 'shopify:admin/customers/123';
    const result = getMobileSafeProtocolURL(originalPath);
    const transformedPath = result;
    expect(transformedPath).toBe(originalPath);
  });

  it('should transform the URL correctly if on mobile', () => {
    global.shopify.environment.mobile = true;
    const originalPath = 'shopify:admin/customers/123';
    const result = getMobileSafeProtocolURL(originalPath);
    const expectedPath = 'https://example.com/customers/123';
    expect(result).toBe(expectedPath);
  });
});
