import {mockShopifyServer} from '#/test-utils';
import {afterEach, describe, expect, it} from 'vitest';
import {
  createTranslationFunctions,
  getShopLocales,
  getTranslatableResources,
} from '../Translations.server';
import {
  createMockShopLocales,
  createTranslatableResources,
} from '../../tests/fixtures';

const {graphQL, mockGraphQL} = mockShopifyServer();

describe('Translations', () => {
  afterEach(() => {
    graphQL.mockRestore();
  });
  describe('getTranslatableResources', () => {
    it('returns translatable resources', async () => {
      mockGraphQL({
        getTranslatableResourcesById: {
          data: createTranslatableResources(),
        },
      });

      const result = await getTranslatableResources(graphQL, [
        'gid://shopify/SellingPlan/1',
      ]);

      expect(result).toMatchObject([
        {
          resourceId: 'gid://shopify/SellingPlan/1',
          translatableContent: expect.arrayContaining([
            expect.objectContaining({key: 'name', locale: 'en'}),
            expect.objectContaining({key: 'option1', locale: 'en'}),
          ]),
        },
      ]);
    });
  });

  describe('createTranslationFunctions', () => {
    it('returns translation functions', async () => {
      const shopLocales = [
        {locale: 'en', primary: true, published: true},
        {locale: 'fr', primary: false, published: true},
      ];

      const result = await createTranslationFunctions(
        shopLocales,
        'selling-plan',
      );

      expect(result).toMatchObject([
        {locale: 'en', t: expect.any(Function)},
        {locale: 'fr', t: expect.any(Function)},
      ]);
    });
  });

  describe('getShopLocales', () => {
    it('returns the shop locales as an array of objects and the primary locale as a string', async () => {
      mockGraphQL({
        getShopLocales: {
          data: createMockShopLocales({
            shopLocales: [
              {locale: 'en', primary: true, published: true},
              {locale: 'ja', primary: false, published: true},
              {locale: 'es', primary: false, published: true},
            ],
          }),
        },
      });

      const result = await getShopLocales(graphQL);

      expect(result).toMatchObject({
        shopLocalesWithoutPrimary: expect.arrayContaining([
          {locale: 'ja', primary: false, published: true},
          {locale: 'es', primary: false, published: true},
        ]),
        primaryLocale: 'en',
      });
    });
  });
});
