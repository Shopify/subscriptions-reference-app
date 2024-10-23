import {
  mockSellingPlanGroupGraphqlResponse,
  mockSellingPlanGroupProduct,
} from '#/fixtures/plans';
import {mockShopifyServer} from '#/test-utils';
import {composeGid} from '@shopify/admin-graphql-api-utilities';
import {afterEach, describe, expect, it, vi} from 'vitest';
import SellingPlanGroupQuery from '~/graphql/SellingPlanGroupQuery';
import {
  createSellingPlanTranslations,
  getSellingPlanGroup,
} from '../SellingPlan.server';
import translationsRegisterMutation from '~/graphql/TranslationsRegisterMutation';
import type {SellingPlanInterval} from '~/types';

describe('SellingPlan', () => {
  const {graphQL, mockGraphQL, sequentiallyMockGraphQL} = mockShopifyServer();

  const defaultGraphQLResponses = {
    SellingPlanGroup: {
      data: {
        sellingPlanGroup: mockSellingPlanGroupGraphqlResponse(),
      },
    },
  };

  afterEach(() => {
    vi.clearAllMocks();
  });
  describe('loading selling plan group details', () => {
    it('loads the selling plan group by calling graphql', async () => {
      mockGraphQL(defaultGraphQLResponses);

      await getSellingPlanGroup(graphQL, {
        id: composeGid('SellingPlanGroup', 1),
        firstProducts: 250,
      });

      expect(graphQL).toHaveBeenCalledTimes(1);

      expect(graphQL).toHaveBeenCalledWith(SellingPlanGroupQuery, {
        variables: {
          id: composeGid('SellingPlanGroup', 1),
          firstProducts: 250,
        },
      });
    });

    it('makes multiple graphql calls and combines the products received from each call when there are more products to load', async () => {
      const mockGraphQLResponses = [
        {
          SellingPlanGroup: {
            data: {
              sellingPlanGroup: mockSellingPlanGroupGraphqlResponse({
                id: composeGid('SellingPlanGroup', 1),
                products: {
                  edges: [
                    {
                      node: mockSellingPlanGroupProduct({
                        id: composeGid('Product', 1),
                      }),
                    },
                    {
                      node: mockSellingPlanGroupProduct({
                        id: composeGid('Product', 2),
                      }),
                    },
                  ],
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: false,
                    endCursor: 'endCursor',
                  },
                },
              }),
            },
          },
        },
        {
          SellingPlanGroup: {
            data: {
              sellingPlanGroup: mockSellingPlanGroupGraphqlResponse({
                id: composeGid('SellingPlanGroup', 1),
                products: {
                  edges: [
                    {
                      node: mockSellingPlanGroupProduct({
                        id: composeGid('Product', 3),
                      }),
                    },
                    {
                      node: mockSellingPlanGroupProduct({
                        id: composeGid('Product', 4),
                      }),
                    },
                  ],
                  pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: false,
                    endCursor: 'endCursor',
                  },
                },
              }),
            },
          },
        },
        {
          SellingPlanGroup: {
            data: {
              sellingPlanGroup: mockSellingPlanGroupGraphqlResponse({
                id: composeGid('SellingPlanGroup', 1),
                products: {
                  edges: [
                    {
                      node: mockSellingPlanGroupProduct({
                        id: composeGid('Product', 5),
                      }),
                    },
                    {
                      node: mockSellingPlanGroupProduct({
                        id: composeGid('Product', 6),
                      }),
                    },
                  ],
                  pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    endCursor: 'endCursor',
                  },
                },
              }),
            },
          },
        },
      ];

      sequentiallyMockGraphQL(mockGraphQLResponses);

      const result = await getSellingPlanGroup(graphQL, {
        id: composeGid('SellingPlanGroup', 1),
        firstProducts: 250,
      });

      expect(graphQL).toHaveBeenCalledTimes(mockGraphQLResponses.length);

      expect(graphQL).toHaveBeenCalledWith(SellingPlanGroupQuery, {
        variables: {
          id: composeGid('SellingPlanGroup', 1),
          firstProducts: 250,
        },
      });

      expect(result!.products.length).toBe(6);
      expect(result!.products).toEqual(
        expect.arrayContaining([
          expect.objectContaining({id: composeGid('Product', 1)}),
          expect.objectContaining({id: composeGid('Product', 2)}),
          expect.objectContaining({id: composeGid('Product', 3)}),
          expect.objectContaining({id: composeGid('Product', 4)}),
          expect.objectContaining({id: composeGid('Product', 5)}),
          expect.objectContaining({id: composeGid('Product', 6)}),
        ]),
      );
    });
  });

  describe('when the shop has a secondary locale', () => {
    it('creates a translation with fixed amount discount', async () => {
      const mockGraphQLResponses = [
        {
          getTranslatableResourcesById: {
            data: {
              translatableResourcesByIds: {
                edges: [
                  {
                    node: {
                      resourceId: 'gid://shopify/SellingPlan/1',
                      translatableContent: [
                        {
                          key: 'name',
                          value: 'Deliver every month, $5 off',
                          locale: 'en',
                        },
                        {
                          key: 'option1',
                          value: 'Deliver every month',
                          locale: 'en',
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
        {
          translationsRegister: {
            data: {
              translationsRegister: {
                userErrors: [],
                translations: [],
              },
            },
          },
        },
      ];
      sequentiallyMockGraphQL(mockGraphQLResponses);

      await createSellingPlanTranslations(
        graphQL,
        [
          {
            id: 'gid://shopify/SellingPlan/1',
            pricingPolicies: [
              {
                adjustmentType: 'FIXED_AMOUNT',
                adjustmentValue: {
                  amount: 5,
                  currencyCode: '',
                },
              },
            ],
            deliveryPolicy: {
              interval: 'MONTH' as SellingPlanInterval,
              intervalCount: 1,
            },
          },
        ],
        [{locale: 'de', primary: false}],
        'USD',
      );

      expect(graphQL).toHaveBeenCalledWith(translationsRegisterMutation, {
        variables: {
          resourceId: composeGid('SellingPlan', 1),
          translations: [
            {
              key: 'name',
              value: 'Jeden Monat liefern, 5,00 $ Rabatt',
              locale: 'de',
              translatableContentDigest: undefined,
            },
            {
              key: 'option1',
              value: 'Jeden Monat liefern',
              locale: 'de',
              translatableContentDigest: undefined,
            },
          ],
        },
      });
    });

    it('creates a translations with percent discount', async () => {
      const mockGraphQLResponses = [
        {
          getTranslatableResourcesById: {
            data: {
              translatableResourcesByIds: {
                edges: [
                  {
                    node: {
                      resourceId: 'gid://shopify/SellingPlan/1',
                      translatableContent: [
                        {
                          key: 'name',
                          value: 'Deliver every week, 5% off',
                          locale: 'en',
                        },
                        {
                          key: 'option1',
                          value: 'Deliver every week',
                          locale: 'en',
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
        {
          translationsRegister: {
            data: {
              translationsRegister: {
                userErrors: [],
                translations: [],
              },
            },
          },
        },
      ];
      sequentiallyMockGraphQL(mockGraphQLResponses);

      await createSellingPlanTranslations(
        graphQL,
        [
          {
            id: 'gid://shopify/SellingPlan/1',
            pricingPolicies: [
              {
                adjustmentType: 'PERCENTAGE',
                adjustmentValue: {
                  percentage: 5,
                },
              },
            ],
            deliveryPolicy: {
              interval: 'WEEK' as SellingPlanInterval,
              intervalCount: 2,
            },
          },
        ],
        [{locale: 'de', primary: false}],
        'USD',
      );

      expect(graphQL).toHaveBeenCalledWith(translationsRegisterMutation, {
        variables: {
          resourceId: composeGid('SellingPlan', 1),
          translations: [
            {
              key: 'name',
              value: 'Alle 2 Wochen liefern, 5 % Rabatt',
              locale: 'de',
              translatableContentDigest: undefined,
            },
            {
              key: 'option1',
              value: 'Alle 2 Wochen liefern',
              locale: 'de',
              translatableContentDigest: undefined,
            },
          ],
        },
      });
    });
  });

  describe('when the shop does not have a secondary locale', () => {
    it('does not perform any translation', async () => {
      const mockGraphQLResponses = [
        {
          getTranslatableResourcesById: {
            data: {
              translatableResourcesByIds: {
                edges: [
                  {
                    node: {
                      resourceId: 'gid://shopify/SellingPlan/1',
                      translatableContent: [
                        {
                          key: 'name',
                          value: 'Deliver every week, 5% off',
                          locale: 'en',
                        },
                        {
                          key: 'option1',
                          value: 'Deliver every week',
                          locale: 'en',
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
        {
          translationsRegister: {
            data: {
              translationsRegister: {
                userErrors: [],
                translations: [],
              },
            },
          },
        },
      ];
      sequentiallyMockGraphQL(mockGraphQLResponses);

      await createSellingPlanTranslations(
        graphQL,
        [
          {
            id: 'gid://shopify/SellingPlan/1',
            pricingPolicies: [
              {
                adjustmentType: 'PERCENTAGE',
                adjustmentValue: {
                  percentage: 5,
                },
              },
            ],
            deliveryPolicy: {
              interval: 'MONTH' as SellingPlanInterval,
              intervalCount: 1,
            },
          },
        ],
        [],
        'USD',
      );

      expect(graphQL).toHaveBeenCalledWith(translationsRegisterMutation, {
        variables: {
          resourceId: composeGid('SellingPlan', 1),
          translations: [],
        },
      });
    });
  });
});
