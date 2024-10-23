import type {
  GetShopLocalesQuery as GetShopLocalesQueryType,
  GetTranslatableResourcesByIdQuery as GetTranslatableResourcesByIdQueryType,
} from 'types/admin.generated';

export function createTranslatableResources(
  response?: Partial<GetTranslatableResourcesByIdQueryType>,
) {
  return {
    translatableResourcesByIds: {
      edges: [
        {
          node: {
            resourceId: 'gid://shopify/SellingPlan/1',
            translatableContent: [
              {
                key: 'name',
                value: 'Pay every month deliver every month',
                digest:
                  '5db5adcca2016a5b2344c166dea58b5d62d6c617bbe75f3e901628a0b4c50dbd',
                locale: 'en',
              },
              {
                key: 'option1',
                value: 'month',
                digest:
                  'a5c7d1719e284f2c9485405d44f62d152cde9e6ede83e1a79a2442b65f6a8735',
                locale: 'en',
              },
            ],
          },
        },
      ],
    },
    ...response,
  };
}

export function createMockShopLocales(
  response?: Partial<GetShopLocalesQueryType>,
) {
  return {
    shopLocales: [
      {locale: 'en', primary: true, published: true},
      {locale: 'ja', primary: false, published: true},
      {locale: 'es', primary: false, published: true},
    ],
    ...response,
  };
}
