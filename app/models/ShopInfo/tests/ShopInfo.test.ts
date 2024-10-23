import {mockShopifyServer} from '#/test-utils';
import {describe, expect, it} from 'vitest';
import {getShopInfos} from '~/models/ShopInfo/ShopInfo.server';
import {TEST_SHOP} from '#/constants';

const shop = {
  id: 'gid://shopify/Shop/9',
  name: 'My Shop',
  getIanaTimeZone: 'America/Sao_Paulo',
  primaryDomain: {
    url: TEST_SHOP,
  },
  myshopifyDomain: TEST_SHOP,
  currencyCode: 'BRL',
  contactEmail: 'noreply@shopify.com',
  email: 'test@shopfiy.com',
};

function defaultGraphQLResponse() {
  return {
    Shop: {
      data: {
        shop,
      },
    },
  };
}

const {graphQL, mockGraphQL} = mockShopifyServer();
describe('ShopInfo', () => {
  it('returns shop', async () => {
    mockGraphQL(defaultGraphQLResponse());
    const data = await getShopInfos(graphQL);

    expect(data.shop).toEqual({
      ...shop,
    });
  });
});
