import {
  mockShopifyServer,
  mountRemixStubWithAppContext,
  waitForGraphQL,
} from '#/test-utils';
import {screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, describe, expect, it, vi} from 'vitest';
import SellingPlanDetails, {action, loader} from '../route';
import {action as deleteAction} from '../../app.plans.$id.delete/route';

import {
  createMockGraphQLProduct,
  createMockGraphQLProductVariant,
} from '#/utils/mocks';
import {composeGid} from '@shopify/admin-graphql-api-utilities';
import CreateSellingPlanGroupMutation from '~/graphql/CreateSellingPlanGroupMutation';
import SellingPlanGroupQuery from '~/graphql/SellingPlanGroupQuery';
import SellingPlanGroupUpdateMutation from '~/graphql/SellingPlanGroupUpdateMutation';
import GetShopLocales from '~/graphql/ShopLocalesQuery';
import DeleteSellingPlanGroupMutation from '~/graphql/DeleteSellingPlanGroupMutation';
import {
  createMockShopLocales,
  createTranslatableResources,
} from '~/models/tests/fixtures';
import {mockShopify} from '#/setup-app-bridge';

const {graphQL, mockGraphQL} = mockShopifyServer();

const createdSellingPlanGroupId = 'gid://shopify/SellingPlanGroup/34';

const sellingPlanEdgePercentage = {
  node: {
    id: 'gid://shopify/SellingPlan/91',
    billingPolicy: {
      interval: 'WEEK',
      intervalCount: 2,
    },
    pricingPolicies: [
      {
        adjustmentType: 'PERCENTAGE',
        adjustmentValue: {
          percentage: 33,
        },
      },
    ],
  },
};

const sellingPlanTranslations = [
  {
    key: 'name',
    value: '1週ごとの配達, 25%オフ',
    translatableContentDigest:
      '5db5adcca2016a5b2344c166dea58b5d62d6c617bbe75f3e901628a0b4c50dbd',
    locale: 'ja',
  },
  {
    key: 'name',
    value: 'Entrega cada semana, 25% de descuento',
    translatableContentDigest:
      '5db5adcca2016a5b2344c166dea58b5d62d6c617bbe75f3e901628a0b4c50dbd',
    locale: 'es',
  },
  {
    key: 'option1',
    value: '1週ごとの配達',
    translatableContentDigest:
      'a5c7d1719e284f2c9485405d44f62d152cde9e6ede83e1a79a2442b65f6a8735',
    locale: 'ja',
  },
  {
    key: 'option1',
    value: 'Entrega cada semana',
    translatableContentDigest:
      'a5c7d1719e284f2c9485405d44f62d152cde9e6ede83e1a79a2442b65f6a8735',
    locale: 'es',
  },
];

const sellingPlanEdgeFixedAmount = {
  node: {
    id: 'gid://shopify/SellingPlan/92',
    billingPolicy: {
      interval: 'MONTH',
      intervalCount: 3,
    },
    pricingPolicies: [
      {
        adjustmentType: 'FIXED_AMOUNT',
        adjustmentValue: {
          amount: 5,
          currencyCode: 'USD',
        },
      },
    ],
  },
};

const sellingPlanEdgePrice = {
  node: {
    id: 'gid://shopify/SellingPlan/93',
    billingPolicy: {
      interval: 'WEEK',
      intervalCount: 2,
    },
    pricingPolicies: [
      {
        adjustmentType: 'PRICE',
        adjustmentValue: {
          amount: 10,
          currencyCode: 'USD',
        },
      },
    ],
  },
};

function generateSellingPlanEdge({
  id = '1',
  interval = 'WEEK',
  intervalCount = 1,
  adjustmentType = 'PERCENTAGE',
  adjustmentValue = 10,
} = {}) {
  return {
    node: {
      id: `gid://shopify/SellingPlan/${id}`,
      billingPolicy: {
        interval,
        intervalCount,
      },
      pricingPolicies: [
        adjustmentType === 'PERCENTAGE'
          ? {
              adjustmentType: 'PERCENTAGE',
              adjustmentValue: {
                percentage: 33,
              },
            }
          : {
              adjustmentType,
              adjustmentValue: {
                amount: adjustmentValue,
                currencyCode: 'USD',
              },
            },
      ],
    },
  };
}

const defaultGraphQLResponses = {
  CreateSellingPlanGroup: {
    data: {
      sellingPlanGroupCreate: {
        sellingPlanGroup: {
          id: createdSellingPlanGroupId,
          sellingPlans: {
            edges: [
              {
                node: {
                  id: composeGid('SellingPlan', 1),
                  name: 'Plan 1',
                  pricingPolicies: [
                    {
                      adjustmentType: 'PERCENTAGE',
                      adjustmentValue: {
                        percentage: 25,
                      },
                    },
                  ],
                  deliveryPolicy: {
                    interval: 'WEEK',
                    intervalCount: 1,
                  },
                },
              },
            ],
          },
        },
        userErrors: [],
      },
    },
  },
  SellingPlanGroupUpdate: {
    data: {
      sellingPlanGroupUpdate: {
        sellingPlanGroup: {
          id: createdSellingPlanGroupId,
          sellingPlans: {
            edges: [
              {
                node: {
                  id: composeGid('SellingPlan', 1),
                  name: 'Plan 1',
                  pricingPolicies: [
                    {
                      adjustmentType: 'PERCENTAGE',
                      adjustmentValue: {
                        percentage: 25,
                      },
                    },
                  ],
                  deliveryPolicy: {
                    interval: 'WEEK',
                    intervalCount: 1,
                  },
                },
              },
            ],
          },
        },
        userErrors: [],
      },
    },
  },
  SellingPlanGroup: {
    data: {
      sellingPlanGroup: {
        id: 'gid://shopify/SellingPlanGroup/34',
        name: 'Subscribe 2 save',
        merchantCode: 'subscribe-2-save',
        sellingPlans: {
          edges: [sellingPlanEdgePercentage],
        },
        products: {
          edges: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            endCursor: 'endCursor',
          },
        },
        productVariants: {
          edges: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            endCursor: 'endCursor',
          },
        },
      },
    },
  },
  getShopLocales: {
    data: createMockShopLocales({
      shopLocales: [
        {locale: 'en', primary: true, published: true},
        {locale: 'ja', primary: false, published: true},
        {locale: 'es', primary: false, published: true},
      ],
    }),
  },
  getTranslatableResourcesById: {
    data: createTranslatableResources(),
  },
  translationsRegister: {
    userErrors: [],
    translations: sellingPlanTranslations,
  },
};

const mockProduct = createMockGraphQLProduct({
  id: 'gid://shopify/Product/1',
  title: 'some product',
  totalVariants: 2,
});

const mockProductVariantParentProduct = createMockGraphQLProduct({
  id: 'gid://shopify/Product/4',
  totalVariants: 4,
});
const mockProductVariant = createMockGraphQLProductVariant({
  id: 'gid://shopify/ProductVariant/1',
  title: 'some variant',
  product: mockProductVariantParentProduct,
});

const mockProductToAdd = createMockGraphQLProduct({
  id: 'gid://shopify/Product/2',
  title: 'new product',
  totalVariants: 3,
});
const mockProductWithVariantToAdd = createMockGraphQLProduct({
  id: 'gid://shopify/Product/3',
  title: 'new variant',
  totalVariants: 5,
});

const graphQLResponsesWithSelectedProduct = {
  ...defaultGraphQLResponses,
  SellingPlanGroup: {
    data: {
      sellingPlanGroup: {
        id: 'gid://shopify/SellingPlanGroup/1',
        name: 'Subscribe 2 save',
        merchantCode: 'The best plan',
        sellingPlans: {
          edges: [],
        },
        products: {
          edges: [
            {
              node: mockProduct,
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            endCursor: 'endCursor',
          },
        },
        productVariants: {
          edges: [
            {
              node: mockProductVariant,
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            endCursor: 'endCursor',
          },
        },
      },
    },
  },
};

async function mountSellingPlanDetails({
  id = '1',
  graphQLResponses = defaultGraphQLResponses as object,
  shopCurrencyCode = 'USD',
} = {}) {
  mockGraphQL(graphQLResponses);

  mountRemixStubWithAppContext({
    routes: [
      {
        path: `/app/plans/:id`,
        Component: () => <SellingPlanDetails />,
        loader,
        action,
      },
      {
        path: `/app/plans/:id/delete`,
        action: deleteAction,
      },
      {
        path: `/app/plans`,
        Component: () => <div>Plan list</div>,
      },
    ],
    remixStubProps: {
      initialEntries: [`/app/plans/${id}`],
    },
    shopContext: {
      currencyCode: shopCurrencyCode,
    },
  });

  try {
    return await screen.findByLabelText('Plan title');
  } catch {
    return await screen.getAllByText('Unexpected Application Error!')[0];
  }
}

describe('SellingPlanDetails', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('create page', () => {
    it('renders the form with default field values', async () => {
      await mountSellingPlanDetails({id: 'create'});

      const merchantCodeInput = screen.getByLabelText('Plan title');
      const purchaseOptionTitleInput = screen.getByLabelText(
        'Purchase option title',
      );

      expect(merchantCodeInput).toHaveValue('');
      expect(purchaseOptionTitleInput).toHaveValue('Subscribe and save');
    });

    it('renders the form with the correct title and submit button text', async () => {
      await mountSellingPlanDetails({id: 'create'});

      expect(screen.getByText('Create subscription plan')).toBeInTheDocument();
      expect(screen.getByRole('button', {name: 'Save'})).toBeInTheDocument();
    });

    it('returns an error when merchant code is blank', async () => {
      await mountSellingPlanDetails({id: 'create'});

      await userEvent.click(screen.getByRole('button', {name: 'Save'}));

      expect(
        await screen.findByText('Plan title is required'),
      ).toBeInTheDocument();
    });

    it('returns an error when name is blank', async () => {
      await mountSellingPlanDetails({id: 'create'});

      userEvent.clear(
        screen.getByRole('textbox', {name: 'Purchase option title'}),
      );

      await userEvent.click(screen.getByRole('button', {name: 'Save'}));

      expect(
        await screen.findByText('Purchase option title is required'),
      ).toBeInTheDocument();
    });

    it('returns an error when delivery frequency is less than 1', async () => {
      await mountSellingPlanDetails({id: 'create'});

      userEvent.clear(
        screen.getByRole('textbox', {name: 'Purchase option title'}),
      );

      await userEvent.clear(screen.getByLabelText('Delivery frequency'));
      await userEvent.type(screen.getByLabelText('Delivery frequency'), '0');

      await userEvent.click(screen.getByRole('button', {name: 'Save'}));

      expect(
        await screen.findByText('Frequency must be greater than 0'),
      ).toBeInTheDocument();
    });

    it('returns an error when discount value not positive', async () => {
      await mountSellingPlanDetails({id: 'create'});

      userEvent.clear(
        screen.getByRole('textbox', {name: 'Purchase option title'}),
      );

      await userEvent.clear(screen.getAllByLabelText('Percentage off')[1]);
      await userEvent.type(screen.getAllByLabelText('Percentage off')[1], '0');

      await userEvent.click(screen.getByRole('button', {name: 'Save'}));

      expect(
        await screen.findByText('Discount value must be positive'),
      ).toBeInTheDocument();
    });

    it('returns an error when percent discount is over 100', async () => {
      await mountSellingPlanDetails({id: 'create'});

      userEvent.clear(
        screen.getByRole('textbox', {name: 'Purchase option title'}),
      );

      await userEvent.type(
        screen.getAllByLabelText('Percentage off')[1],
        '250',
      );

      await userEvent.click(screen.getByRole('button', {name: 'Save'}));

      expect(
        await screen.findByText('Discount value must not be over 100%'),
      ).toBeInTheDocument();
    });

    it('calls createSellingPlanGroupMutation and the success toast when inputs are valid and redirects to the edit plan page', async () => {
      await mountSellingPlanDetails({id: 'create'});

      await userEvent.type(
        screen.getByRole('textbox', {name: 'Plan title'}),
        'Plan Title',
      );

      await userEvent.clear(
        screen.getByRole('textbox', {name: 'Purchase option title'}),
      );

      await userEvent.type(
        screen.getByRole('textbox', {name: 'Purchase option title'}),
        'Purchase Option Title',
      );

      await userEvent.type(screen.getAllByLabelText('Percentage off')[1], '15');

      userEvent.click(screen.getByRole('button', {name: 'Save'}));

      await waitForGraphQL();

      expect(graphQL).toHavePerformedGraphQLOperation(GetShopLocales);

      expect(graphQL).toHavePerformedGraphQLOperation(
        CreateSellingPlanGroupMutation,
        {
          variables: {
            input: {
              merchantCode: 'Plan Title',
              name: 'Purchase Option Title',
              options: ['Delivery frequency'],
            },
          },
        },
      );

      // After saving, the page should redirect to the details page of the created selling plan group
      expect(graphQL).toHavePerformedGraphQLOperation(SellingPlanGroupQuery, {
        variables: {
          id: createdSellingPlanGroupId,
        },
      });

      expect(mockShopify.toast.show).toHaveBeenCalledWith(
        'Subscription plan created',
        {isError: false},
      );
    });

    it('creates a selling plan with percentage based selling plans', async () => {
      await mountSellingPlanDetails({id: 'create'});

      await userEvent.type(
        screen.getByRole('textbox', {name: 'Plan title'}),
        'Plan Title',
      );

      // Fill out first selling plan line
      await userEvent.clear(screen.getByLabelText('Delivery frequency'));
      await userEvent.type(screen.getByLabelText('Delivery frequency'), '2');
      await userEvent.selectOptions(
        screen.getByLabelText('Delivery interval'),
        'WEEK',
      );
      await userEvent.type(screen.getAllByLabelText('Percentage off')[1], '15');

      // Add a second selling plan line
      await userEvent.click(screen.getByRole('button', {name: 'Add option'}));

      await userEvent.clear(screen.getAllByLabelText('Delivery frequency')[1]);
      await userEvent.type(
        screen.getAllByLabelText('Delivery frequency')[1],
        '3',
      );
      await userEvent.selectOptions(
        screen.getAllByLabelText('Delivery interval')[1],
        'MONTH',
      );
      await userEvent.type(screen.getAllByLabelText('Percentage off')[2], '20');

      userEvent.click(screen.getByRole('button', {name: 'Save'}));

      await waitForGraphQL();

      expect(graphQL).toHavePerformedGraphQLOperation(
        CreateSellingPlanGroupMutation,
        {
          variables: {
            input: {
              sellingPlansToCreate: [
                {
                  name: 'Deliver every 2 weeks, 15% off',
                  billingPolicy: {
                    recurring: {
                      interval: 'WEEK',
                      intervalCount: 2,
                    },
                  },
                  pricingPolicies: [
                    {
                      fixed: {
                        adjustmentType: 'PERCENTAGE',
                        adjustmentValue: {
                          percentage: 15,
                        },
                      },
                    },
                  ],
                },
                {
                  name: 'Deliver every 3 months, 20% off',
                  billingPolicy: {
                    recurring: {
                      interval: 'MONTH',
                      intervalCount: 3,
                    },
                  },
                  pricingPolicies: [
                    {
                      fixed: {
                        adjustmentType: 'PERCENTAGE',
                        adjustmentValue: {
                          percentage: 20,
                        },
                      },
                    },
                  ],
                },
              ],
            },
          },
        },
      );
    });

    it('creates a selling plan with amount off based selling plans', async () => {
      await mountSellingPlanDetails({id: 'create'});

      await userEvent.type(
        screen.getByRole('textbox', {name: 'Plan title'}),
        'Plan Title',
      );

      // Select amount off discount type
      await userEvent.click(screen.getByRole('radio', {name: 'Amount off'}));

      // Fill out first selling plan line
      await userEvent.clear(screen.getByLabelText('Delivery frequency'));
      await userEvent.type(screen.getByLabelText('Delivery frequency'), '1');
      await userEvent.selectOptions(
        screen.getByLabelText('Delivery interval'),
        'WEEK',
      );
      await userEvent.type(screen.getAllByLabelText('Amount off')[1], '5');

      // Add a second selling plan line
      await userEvent.click(screen.getByRole('button', {name: 'Add option'}));

      await userEvent.clear(screen.getAllByLabelText('Delivery frequency')[1]);
      await userEvent.type(
        screen.getAllByLabelText('Delivery frequency')[1],
        '1',
      );
      await userEvent.selectOptions(
        screen.getAllByLabelText('Delivery interval')[1],
        'YEAR',
      );
      await userEvent.type(screen.getAllByLabelText('Amount off')[2], '2');

      userEvent.click(screen.getByRole('button', {name: 'Save'}));

      await waitForGraphQL();

      expect(graphQL).toHavePerformedGraphQLOperation(
        CreateSellingPlanGroupMutation,
        {
          variables: {
            input: {
              sellingPlansToCreate: [
                {
                  name: 'Deliver every week, $5.00 off',
                  billingPolicy: {
                    recurring: {
                      interval: 'WEEK',
                      intervalCount: 1,
                    },
                  },
                  pricingPolicies: [
                    {
                      fixed: {
                        adjustmentType: 'FIXED_AMOUNT',
                        adjustmentValue: {
                          fixedValue: 5,
                        },
                      },
                    },
                  ],
                },
                {
                  name: 'Deliver every year, $2.00 off',
                  billingPolicy: {
                    recurring: {
                      interval: 'YEAR',
                      intervalCount: 1,
                    },
                  },
                  pricingPolicies: [
                    {
                      fixed: {
                        adjustmentType: 'FIXED_AMOUNT',
                        adjustmentValue: {
                          fixedValue: 2,
                        },
                      },
                    },
                  ],
                },
              ],
            },
          },
        },
      );
    });

    it('creates a selling plan with fixed price based selling plans', async () => {
      await mountSellingPlanDetails({id: 'create'});

      await userEvent.type(
        screen.getByRole('textbox', {name: 'Plan title'}),
        'Plan Title',
      );

      // Select amount off discount type
      await userEvent.click(screen.getByRole('radio', {name: 'Fixed price'}));

      // Fill out first selling plan line
      await userEvent.clear(screen.getByLabelText('Delivery frequency'));
      await userEvent.type(screen.getByLabelText('Delivery frequency'), '3');
      await userEvent.selectOptions(
        screen.getByLabelText('Delivery interval'),
        'WEEK',
      );
      await userEvent.type(screen.getAllByLabelText('Fixed price')[1], '20');

      // Add a second selling plan line
      await userEvent.click(screen.getByRole('button', {name: 'Add option'}));

      await userEvent.clear(screen.getAllByLabelText('Delivery frequency')[1]);
      await userEvent.type(
        screen.getAllByLabelText('Delivery frequency')[1],
        '5',
      );
      await userEvent.selectOptions(
        screen.getAllByLabelText('Delivery interval')[1],
        'MONTH',
      );
      await userEvent.type(screen.getAllByLabelText('Fixed price')[2], '45');

      userEvent.click(screen.getByRole('button', {name: 'Save'}));

      await waitForGraphQL();

      expect(graphQL).toHavePerformedGraphQLOperation(
        CreateSellingPlanGroupMutation,
        {
          variables: {
            input: {
              sellingPlansToCreate: [
                {
                  name: 'Deliver every 3 weeks, $20.00',
                  billingPolicy: {
                    recurring: {
                      interval: 'WEEK',
                      intervalCount: 3,
                    },
                  },
                  pricingPolicies: [
                    {
                      fixed: {
                        adjustmentType: 'PRICE',
                        adjustmentValue: {
                          fixedValue: 20,
                        },
                      },
                    },
                  ],
                },
                {
                  name: 'Deliver every 5 months, $45.00',
                  billingPolicy: {
                    recurring: {
                      interval: 'MONTH',
                      intervalCount: 5,
                    },
                  },
                  pricingPolicies: [
                    {
                      fixed: {
                        adjustmentType: 'PRICE',
                        adjustmentValue: {
                          fixedValue: 45,
                        },
                      },
                    },
                  ],
                },
              ],
            },
          },
        },
      );
    });

    it('does not redirect when an error is returned from createSellingPlanGroup', async () => {
      const mockGraphQLResponses = {
        defaultGraphQLResponses,
        CreateSellingPlanGroup: {
          data: {
            sellingPlanGroupCreate: {
              userErrors: ['test'],
            },
          },
        },
      };

      await mountSellingPlanDetails({
        id: 'create',
        graphQLResponses: mockGraphQLResponses,
      });

      await userEvent.type(
        screen.getByRole('textbox', {name: 'Purchase option title'}),
        'Purchase Option Title',
      );

      userEvent.click(screen.getByRole('button', {name: 'Save'}));

      await waitForGraphQL();

      // Check that we did not redirect to the details page
      expect(graphQL).not.toHavePerformedGraphQLOperation(
        SellingPlanGroupQuery,
      );
    });

    it('creates selling plans with no discount amount', async () => {
      await mountSellingPlanDetails({id: 'create'});

      await userEvent.type(
        screen.getByRole('textbox', {name: 'Plan title'}),
        'Plan Title',
      );

      // Uncheck Offer discount checkbox
      await userEvent.click(
        screen.getByRole('checkbox', {name: 'Offer discount'}),
      );

      userEvent.click(screen.getByRole('button', {name: 'Save'}));

      await waitForGraphQL();

      expect(graphQL).toHavePerformedGraphQLOperation(
        CreateSellingPlanGroupMutation,
        {
          variables: {
            input: {
              sellingPlansToCreate: [
                {
                  name: 'Deliver every week',
                  // No pricing policies should be created
                  pricingPolicies: [],
                },
              ],
            },
          },
        },
      );
    });

    it('creates selling plan names with the shops currency code', async () => {
      await mountSellingPlanDetails({id: 'create', shopCurrencyCode: 'GBP'});

      await userEvent.type(
        screen.getByRole('textbox', {name: 'Plan title'}),
        'Plan Title',
      );
      await userEvent.click(screen.getByRole('radio', {name: 'Amount off'}));
      await userEvent.type(screen.getAllByLabelText('Amount off')[1], '25');

      userEvent.click(screen.getByRole('button', {name: 'Save'}));

      await waitForGraphQL();

      expect(graphQL).toHavePerformedGraphQLOperation(
        CreateSellingPlanGroupMutation,
        {
          variables: {
            input: {
              sellingPlansToCreate: [
                {
                  name: 'Deliver every week, £25.00 off',
                },
              ],
            },
          },
        },
      );
    });
  });

  describe('edit page', () => {
    it('displays selling plan group name details as returned from graphql', async () => {
      const mockGraphQLResponses = {
        defaultGraphQLResponses,
        SellingPlanGroup: {
          data: {
            sellingPlanGroup: {
              id: 'gid://shopify/SellingPlanGroup/1',
              name: 'Subscribe 2 save',
              merchantCode: 'subscribe-2-save',
              sellingPlans: {
                edges: [],
              },
              products: {
                edges: [],
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  endCursor: 'endCursor',
                },
              },
              productVariants: {
                edges: [],
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  endCursor: 'endCursor',
                },
              },
            },
          },
        },
      };

      await mountSellingPlanDetails({
        id: '1',
        graphQLResponses: mockGraphQLResponses,
      });

      expect(screen.getByLabelText('Plan title')).toHaveValue(
        'subscribe-2-save',
      );
      expect(screen.getByLabelText('Purchase option title')).toHaveValue(
        'Subscribe 2 save',
      );
    });
    it('displays merchantCode as page title', async () => {
      const mockGraphQLResponses = {
        defaultGraphQLResponses,
        SellingPlanGroup: {
          data: {
            sellingPlanGroup: {
              id: 'gid://shopify/SellingPlanGroup/1',
              name: 'Subscribe 2 save',
              merchantCode: 'The best plan',
              sellingPlans: {
                edges: [],
              },
              products: {
                edges: [],
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  endCursor: 'endCursor',
                },
              },
              productVariants: {
                edges: [],
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  endCursor: 'endCursor',
                },
              },
            },
          },
        },
      };

      await mountSellingPlanDetails({
        id: '1',
        graphQLResponses: mockGraphQLResponses,
      });

      expect(screen.getAllByText('The best plan')[0]).toBeInTheDocument();
    });

    it('Returns 404 when no selling plan group was found', async () => {
      const mockGraphQLResponses = {
        defaultGraphQLResponses,
        SellingPlanGroup: {
          data: {
            userErrors: ['Selling Plan Group does not exist'],
          },
        },
      };

      await mountSellingPlanDetails({
        id: '99',
        graphQLResponses: mockGraphQLResponses,
      });

      expect(
        screen.getAllByText('404 Subscription plan not found')[0],
      ).toBeInTheDocument();
    });

    it('displays percentage selling plan inputs when returned from graphql', async () => {
      const mockGraphQLResponses = {
        ...defaultGraphQLResponses,
        SellingPlanGroup: {
          data: {
            sellingPlanGroup: {
              id: 'gid://shopify/SellingPlanGroup/1',
              name: 'Subscribe 2 save',
              merchantCode: 'The best plan',
              sellingPlans: {
                edges: [sellingPlanEdgePercentage],
              },
              products: {
                edges: [],
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  endCursor: 'endCursor',
                },
              },
              productVariants: {
                edges: [],
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  endCursor: 'endCursor',
                },
              },
            },
          },
        },
      };

      await mountSellingPlanDetails({
        id: '1',
        graphQLResponses: mockGraphQLResponses,
      });

      expect(screen.getByLabelText('Delivery frequency')).toHaveValue(
        sellingPlanEdgePercentage.node.billingPolicy.intervalCount,
      );
      expect(screen.getByLabelText('Delivery interval')).toHaveValue(
        sellingPlanEdgePercentage.node.billingPolicy.interval,
      );
      expect(screen.getAllByLabelText('Percentage off')[1]).toHaveValue(
        sellingPlanEdgePercentage.node.pricingPolicies[0].adjustmentValue
          .percentage,
      );
    });

    it('displays fixed amount selling plan inputs when returned from graphql', async () => {
      const mockGraphQLResponses = {
        ...defaultGraphQLResponses,
        SellingPlanGroup: {
          data: {
            sellingPlanGroup: {
              id: 'gid://shopify/SellingPlanGroup/1',
              name: 'Subscribe 2 save',
              merchantCode: 'The best plan',
              sellingPlans: {
                edges: [sellingPlanEdgeFixedAmount],
              },
              products: {
                edges: [],
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  endCursor: 'endCursor',
                },
              },
              productVariants: {
                edges: [],
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  endCursor: 'endCursor',
                },
              },
            },
          },
        },
      };

      await mountSellingPlanDetails({
        id: '1',
        graphQLResponses: mockGraphQLResponses,
      });

      expect(screen.getByLabelText('Delivery frequency')).toHaveValue(
        sellingPlanEdgeFixedAmount.node.billingPolicy.intervalCount,
      );
      expect(screen.getByLabelText('Delivery interval')).toHaveValue(
        sellingPlanEdgeFixedAmount.node.billingPolicy.interval,
      );
      expect(screen.getAllByLabelText('Amount off')[1]).toHaveValue(
        sellingPlanEdgeFixedAmount.node.pricingPolicies[0].adjustmentValue
          .amount,
      );
    });

    it('displays price selling plan inputs when returned from graphql', async () => {
      const mockGraphQLResponses = {
        ...defaultGraphQLResponses,
        SellingPlanGroup: {
          data: {
            sellingPlanGroup: {
              id: 'gid://shopify/SellingPlanGroup/1',
              name: 'Subscribe 2 save',
              merchantCode: 'The best plan',
              sellingPlans: {
                edges: [sellingPlanEdgePrice],
              },
              products: {
                edges: [],
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  endCursor: 'endCursor',
                },
              },
              productVariants: {
                edges: [],
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  endCursor: 'endCursor',
                },
              },
            },
          },
        },
      };

      await mountSellingPlanDetails({
        id: '1',
        graphQLResponses: mockGraphQLResponses,
      });

      expect(screen.getByLabelText('Delivery frequency')).toHaveValue(
        sellingPlanEdgePrice.node.billingPolicy.intervalCount,
      );
      expect(screen.getByLabelText('Delivery interval')).toHaveValue(
        sellingPlanEdgePrice.node.billingPolicy.interval,
      );
      expect(screen.getAllByLabelText('Fixed price')[1]).toHaveValue(
        sellingPlanEdgePrice.node.pricingPolicies[0].adjustmentValue.amount,
      );
    });

    it('returns an error when merchant code is blank', async () => {
      await mountSellingPlanDetails({id: '1'});

      await userEvent.clear(screen.getByRole('textbox', {name: 'Plan title'}));
      await userEvent.click(screen.getByRole('button', {name: 'Save'}));

      expect(
        await screen.findByText('Plan title is required'),
      ).toBeInTheDocument();
    });
    it('returns an error when name is blank', async () => {
      await mountSellingPlanDetails({id: '1'});

      await userEvent.clear(
        screen.getByRole('textbox', {name: 'Purchase option title'}),
      );

      await userEvent.click(screen.getByRole('button', {name: 'Save'}));

      expect(
        await screen.findByText('Purchase option title is required'),
      ).toBeInTheDocument();
    });

    it('shows an error message when there are selling plans with the same delivery options', async () => {
      await mountSellingPlanDetails({id: '1'});

      // set first selling plan to delivery every 1 month
      await userEvent.clear(screen.getByLabelText('Delivery frequency'));
      await userEvent.type(screen.getByLabelText('Delivery frequency'), '1');
      await userEvent.selectOptions(
        screen.getByLabelText('Delivery interval'),
        'MONTH',
      );

      // add a second selling plan with the same delivery options
      await userEvent.click(screen.getByRole('button', {name: 'Add option'}));
      await userEvent.clear(screen.getAllByLabelText('Delivery frequency')[1]);
      await userEvent.type(
        screen.getAllByLabelText('Delivery frequency')[1],
        '1',
      );
      await userEvent.selectOptions(
        screen.getAllByLabelText('Delivery interval')[1],
        'MONTH',
      );
      await userEvent.type(screen.getAllByLabelText('Percentage off')[2], '15');

      userEvent.click(screen.getByRole('button', {name: 'Save'}));

      expect(
        await screen.findAllByText('Delivery options must be unique'),
      ).toHaveLength(2);
    });

    it('calls updateSellingPlanGroup and shows the success toast when inputs are valid', async () => {
      const mockGraphQLResponses = {
        ...defaultGraphQLResponses,
        SellingPlanGroup: {
          data: {
            sellingPlanGroup: {
              id: 'gid://shopify/SellingPlanGroup/1',
              name: 'Subscribe 2 save',
              merchantCode: 'The best plan',
              sellingPlans: {
                edges: [],
              },
              products: {
                edges: [],
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  endCursor: 'endCursor',
                },
              },
              productVariants: {
                edges: [],
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  endCursor: 'endCursor',
                },
              },
            },
          },
        },
      };

      await mountSellingPlanDetails({
        id: '1',
        graphQLResponses: mockGraphQLResponses,
      });

      await userEvent.clear(screen.getByRole('textbox', {name: 'Plan title'}));
      await userEvent.type(
        screen.getByRole('textbox', {name: 'Plan title'}),
        'New plan Title',
      );

      await userEvent.clear(
        screen.getByRole('textbox', {name: 'Purchase option title'}),
      );

      await userEvent.type(
        screen.getByRole('textbox', {name: 'Purchase option title'}),
        'New purchase option title',
      );

      await userEvent.click(screen.getByRole('button', {name: 'Save'}));

      await waitForGraphQL();

      expect(graphQL).toHavePerformedGraphQLOperation(GetShopLocales);

      expect(graphQL).toHavePerformedGraphQLOperation(
        SellingPlanGroupUpdateMutation,
        {
          variables: {
            input: {
              merchantCode: 'New plan Title',
              name: 'New purchase option title',
            },
          },
        },
      );

      expect(mockShopify.toast.show).toHaveBeenCalledWith(
        'Subscription plan updated',
        {isError: false},
      );
    });

    it.each([
      ['PERCENTAGE', 'Percentage off'],
      ['FIXED_AMOUNT', 'Amount off'],
      ['PRICE', 'Fixed price'],
    ])(
      'allows you to create, edit, and delete selling plans with %s discount type',
      async (adjustmentType, discountInputName) => {
        const mockGraphQLResponses = {
          ...defaultGraphQLResponses,
          SellingPlanGroup: {
            data: {
              sellingPlanGroup: {
                ...defaultGraphQLResponses.SellingPlanGroup.data
                  .sellingPlanGroup,
                sellingPlans: {
                  edges: [
                    generateSellingPlanEdge({
                      id: '1',
                      adjustmentType: adjustmentType,
                    }),
                    generateSellingPlanEdge({
                      id: '2',
                      adjustmentType: adjustmentType,
                      intervalCount: 2,
                    }),
                  ],
                },
              },
            },
          },
        };

        await mountSellingPlanDetails({
          id: '1',
          graphQLResponses: mockGraphQLResponses,
        });

        // Add a new option and fill it out
        await userEvent.click(screen.getByRole('button', {name: 'Add option'}));
        await userEvent.clear(
          screen.getAllByLabelText('Delivery frequency')[2],
        );
        await userEvent.type(
          screen.getAllByLabelText('Delivery frequency')[2],
          '3',
        );
        await userEvent.selectOptions(
          screen.getAllByLabelText('Delivery interval')[2],
          'MONTH',
        );
        await userEvent.clear(screen.getAllByLabelText(discountInputName)[3]);
        await userEvent.type(
          screen.getAllByLabelText(discountInputName)[3],
          '20',
        );

        // Click the first Remove option button
        await userEvent.click(
          screen.getAllByRole('button', {name: 'Remove option'})[0],
        );

        // Update the remaining option
        await userEvent.clear(
          screen.getAllByLabelText('Delivery frequency')[0],
        );
        await userEvent.type(
          screen.getAllByLabelText('Delivery frequency')[0],
          '2',
        );
        await userEvent.selectOptions(
          screen.getAllByLabelText('Delivery interval')[0],
          'YEAR',
        );
        await userEvent.clear(screen.getAllByLabelText(discountInputName)[1]);
        await userEvent.type(
          screen.getAllByLabelText(discountInputName)[1],
          '15',
        );

        userEvent.click(screen.getByRole('button', {name: 'Save'}));

        await waitForGraphQL();

        const expectedCreatedAmount =
          adjustmentType === 'PERCENTAGE' ? '20%' : '$20.00';

        const expectedUpdatedAmount =
          adjustmentType === 'PERCENTAGE' ? '15%' : '$15.00';

        expect(graphQL).toHavePerformedGraphQLOperation(
          SellingPlanGroupUpdateMutation,
          {
            variables: {
              input: {
                sellingPlansToCreate: [
                  {
                    name:
                      adjustmentType === 'PRICE'
                        ? 'Deliver every 3 months, $20.00'
                        : `Deliver every 3 months, ${expectedCreatedAmount} off`,
                    billingPolicy: {
                      recurring: {
                        interval: 'MONTH',
                        intervalCount: 3,
                      },
                    },
                    pricingPolicies: [
                      {
                        fixed: {
                          adjustmentType,
                          adjustmentValue:
                            adjustmentType === 'PERCENTAGE'
                              ? {
                                  percentage: 20,
                                }
                              : {
                                  fixedValue: 20,
                                },
                        },
                      },
                    ],
                  },
                ],
                sellingPlansToUpdate: [
                  {
                    id: 'gid://shopify/SellingPlan/2',
                    name:
                      adjustmentType === 'PRICE'
                        ? 'Deliver every 2 years, $15.00'
                        : `Deliver every 2 years, ${expectedUpdatedAmount} off`,
                    billingPolicy: {
                      recurring: {
                        interval: 'YEAR',
                        intervalCount: 2,
                      },
                    },
                    pricingPolicies: [
                      {
                        fixed: {
                          adjustmentType,
                          adjustmentValue:
                            adjustmentType === 'PERCENTAGE'
                              ? {
                                  percentage: 15,
                                }
                              : {
                                  fixedValue: 15,
                                },
                        },
                      },
                    ],
                  },
                ],
                sellingPlansToDelete: ['gid://shopify/SellingPlan/1'],
              },
            },
          },
        );
      },
    );

    describe('selected products', () => {
      afterEach(() => {
        mockShopify.resourcePicker.mockClear();
      });

      // test this here since ProductPicker gets the selected products as props
      // so we can't test that it actually gets and displays the correct information
      // from the selling plan group that gets received from the graphql query
      it('displays the products and variants that have been applied to a selling plan', async () => {
        await mountSellingPlanDetails({
          id: '1',
          graphQLResponses: graphQLResponsesWithSelectedProduct,
        });

        expect(screen.getByText(mockProduct.title)).toBeInTheDocument();
        expect(
          screen.getByText(mockProductVariant.product.title),
        ).toBeInTheDocument();

        const productImages = screen.getAllByRole('img');
        const productImage = productImages.find(
          (img) =>
            img.getAttribute('src') ===
            mockProduct.featuredImage!.transformedSrc!,
        );
        const variantImage = productImages.find(
          (img) =>
            img.getAttribute('src') ===
            mockProductVariant.product.featuredImage!.transformedSrc!,
        );

        expect(productImage).toBeInTheDocument();
        expect(variantImage).toBeInTheDocument();

        await waitFor(() => {
          expect(
            screen.getByText(
              `(${mockProduct.totalVariants} of ${mockProduct.totalVariants} variants selected)`,
            ),
          ).toBeInTheDocument();
        });
        await waitFor(() => {
          expect(
            screen.getByText(
              `(1 of ${mockProductVariant.product.totalVariants} variants selected)`,
            ),
          ).toBeInTheDocument();
        });
      });

      it('adds products and variants that have been selected in the product picker', async () => {
        await mountSellingPlanDetails({
          id: '1',
          graphQLResponses: graphQLResponsesWithSelectedProduct,
        });

        const mockProductVariantIdToAdd = 'gid://shopify/ProductVariant/123';

        const mockResourcePickerSelection = [
          mockProduct,
          mockProductToAdd,
          {
            ...mockProductWithVariantToAdd,
            variants: [
              {
                id: mockProductVariantIdToAdd,
              },
            ],
          },
        ];
        mockShopify.resourcePicker.mockResolvedValueOnce(
          mockResourcePickerSelection,
        );

        // open the resource picker
        await userEvent.click(screen.getByRole('button', {name: 'Browse'}));

        // check that the product was added to the product picker card
        expect(
          await screen.findByText(mockProductToAdd.title),
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            `(${mockProductToAdd.totalVariants} of ${mockProductToAdd.totalVariants} variants selected)`,
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            `(1 of ${mockProductWithVariantToAdd.totalVariants} variants selected)`,
          ),
        ).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', {name: 'Save'}));
        await waitForGraphQL();

        expect(graphQL).toHavePerformedGraphQLOperation(
          SellingPlanGroupUpdateMutation,
          {
            variables: {
              productIdsToAdd: [mockProductToAdd.id],
              productVariantIdsToAdd: [mockProductVariantIdToAdd],
            },
          },
        );
      });

      it('removes products and variants that have been removed via the product picker card', async () => {
        await mountSellingPlanDetails({
          id: '1',
          graphQLResponses: graphQLResponsesWithSelectedProduct,
        });

        // exclude mockProduct and mockProductVariant from the selection return value since we're removing it
        const mockResourcePickerSelection = [];

        mockShopify.resourcePicker.mockResolvedValueOnce(
          mockResourcePickerSelection,
        );

        await userEvent.click(screen.getByRole('button', {name: 'Browse'}));

        await userEvent.click(screen.getByRole('button', {name: 'Save'}));
        await waitForGraphQL();

        expect(graphQL).toHavePerformedGraphQLOperation(
          SellingPlanGroupUpdateMutation,
          {
            variables: {
              productIdsToRemove: [mockProduct.id],
              productVariantIdsToRemove: [mockProductVariant.id],
            },
          },
        );
      });
    });
  });

  describe('Summary card', () => {
    describe('when there is one delivery option', () => {
      it('displays percentage discount info', async () => {
        const mockGraphQLResponses = {
          ...defaultGraphQLResponses,
          SellingPlanGroup: {
            data: {
              sellingPlanGroup: {
                id: 'gid://shopify/SellingPlanGroup/1',
                name: 'Subscribe 2 save',
                merchantCode: 'The best plan',
                sellingPlans: {
                  edges: [sellingPlanEdgePercentage],
                },
                products: {
                  edges: [],
                  pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    endCursor: 'endCursor',
                  },
                },
                productVariants: {
                  edges: [],
                  pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    endCursor: 'endCursor',
                  },
                },
              },
            },
          },
        };

        await mountSellingPlanDetails({
          id: '1',
          graphQLResponses: mockGraphQLResponses,
        });

        expect(screen.getByText('Deliver every 2 weeks, 33% off'));
      });

      it('displays amount off discount info', async () => {
        const mockGraphQLResponses = {
          ...defaultGraphQLResponses,
          SellingPlanGroup: {
            data: {
              sellingPlanGroup: {
                id: 'gid://shopify/SellingPlanGroup/1',
                name: 'Subscribe 2 save',
                merchantCode: 'The best plan',
                sellingPlans: {
                  edges: [sellingPlanEdgeFixedAmount],
                },
                products: {
                  edges: [],
                  pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    endCursor: 'endCursor',
                  },
                },
                productVariants: {
                  edges: [],
                  pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    endCursor: 'endCursor',
                  },
                },
              },
            },
          },
        };

        await mountSellingPlanDetails({
          id: '1',
          graphQLResponses: mockGraphQLResponses,
        });

        expect(screen.getByText('Deliver every 3 months, $5.00 off'));
      });

      it('displays fixed price discount info', async () => {
        const mockGraphQLResponses = {
          ...defaultGraphQLResponses,
          SellingPlanGroup: {
            data: {
              sellingPlanGroup: {
                id: 'gid://shopify/SellingPlanGroup/1',
                name: 'Subscribe 2 save',
                merchantCode: 'The best plan',
                sellingPlans: {
                  edges: [sellingPlanEdgePrice],
                },
                products: {
                  edges: [],
                  pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    endCursor: 'endCursor',
                  },
                },
                productVariants: {
                  edges: [],
                  pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    endCursor: 'endCursor',
                  },
                },
              },
            },
          },
        };

        await mountSellingPlanDetails({
          id: '1',
          graphQLResponses: mockGraphQLResponses,
        });

        expect(screen.getByText('Deliver every 2 weeks, $10.00'));
      });
    });

    describe('when there are multiple delivery options', () => {
      it('displays delivery option count', async () => {
        const mockGraphQLResponses = {
          ...defaultGraphQLResponses,
          SellingPlanGroup: {
            data: {
              sellingPlanGroup: {
                id: 'gid://shopify/SellingPlanGroup/1',
                name: 'Subscribe 2 save',
                merchantCode: 'The best plan',
                sellingPlans: {
                  edges: [
                    sellingPlanEdgePercentage,
                    sellingPlanEdgePercentage,
                    sellingPlanEdgePercentage,
                  ],
                },
                products: {
                  edges: [],
                  pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    endCursor: 'endCursor',
                  },
                },
                productVariants: {
                  edges: [],
                  pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    endCursor: 'endCursor',
                  },
                },
              },
            },
          },
        };

        await mountSellingPlanDetails({
          id: '1',
          graphQLResponses: mockGraphQLResponses,
        });

        expect(screen.getByText('3 delivery frequencies'));
      });
    });

    it('displays product and variant info', async () => {
      await mountSellingPlanDetails({
        id: '1',
        graphQLResponses: graphQLResponsesWithSelectedProduct,
      });

      expect(
        screen.getByText('1 product, 1 product variant'),
      ).toBeInTheDocument();
    });

    it('displays product name when only one product is selected', async () => {
      const mockGraphQLResponses = {
        ...defaultGraphQLResponses,
        SellingPlanGroup: {
          data: {
            sellingPlanGroup: {
              ...defaultGraphQLResponses.SellingPlanGroup.data.sellingPlanGroup,
              productVariants: {
                edges: [
                  {
                    node: {
                      id: 'gid://shopify/ProductVariant/1',
                      product: {
                        id: 'gid://shopify/Product/1',
                        title: 'Best orange shoes',
                        totalVariants: 4,
                      },
                    },
                  },
                ],
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  endCursor: 'endCursor',
                },
              },
            },
          },
        },
      };

      await mountSellingPlanDetails({
        id: '1',
        graphQLResponses: mockGraphQLResponses,
      });

      expect(
        screen.getByText('Best orange shoes (1 product variant)'),
      ).toBeInTheDocument();
    });
  });

  describe('delete selling plan group modal', () => {
    it('does not render the delete button on create page', async () => {
      await mountSellingPlanDetails({id: 'create'});

      expect(
        screen.queryByRole('button', {name: 'Delete'}),
      ).not.toBeInTheDocument();
    });

    it('renders the delete button', async () => {
      await mountSellingPlanDetails({id: '1'});

      expect(screen.getByRole('button', {name: 'Delete'})).toBeInTheDocument();
    });

    it('Renders expected modal and content', async () => {
      await mountSellingPlanDetails({id: '1'});

      userEvent.click(screen.getByRole('button', {name: 'Delete'}));
      expect(
        await screen.findByText('Delete subscription plan?'),
      ).toBeInTheDocument();
      expect(
        await screen.findByText(
          "This can't be undone. Any associated contracts won't be affected.",
        ),
      ).toBeInTheDocument();
    });

    it('calls the delete plan mutation with plan id when delete button is clicked and redirects to plan list', async () => {
      const graphQLResponses = {
        ...defaultGraphQLResponses,
        DeleteSellingPlanGroup: {
          data: {
            sellingPlanGroupDelete: {
              deletedSellingPlanGroupId: 'gid://shopify/SellingPlanGroup/1',
              userErrors: [],
            },
          },
        },
      };

      await mountSellingPlanDetails({id: '34', graphQLResponses});

      userEvent.click(screen.getByRole('button', {name: 'Delete'}));

      userEvent.click(await screen.findByRole('button', {name: 'Delete plan'}));

      await waitFor(() => {
        expect(graphQL).toHavePerformedGraphQLOperation(
          DeleteSellingPlanGroupMutation,
          {
            variables: {
              id: 'gid://shopify/SellingPlanGroup/34',
            },
          },
        );
      });
      await waitFor(() => {
        expect(screen.getByText('Plan list')).toBeInTheDocument();
      });
    });

    it('shows error toast when delete plan mutation fails and does not redirect', async () => {
      const graphQLResponses = {
        ...defaultGraphQLResponses,
        DeleteSellingPlanGroup: {
          data: {
            sellingPlanGroupDelete: {
              deletedSellingPlanGroupId: null,
              userErrors: [
                {
                  field: ['id'],
                  message: 'Cannot delete plan',
                },
              ],
            },
          },
        },
      };

      await mountSellingPlanDetails({id: '34', graphQLResponses});

      userEvent.click(screen.getByRole('button', {name: 'Delete'}));

      userEvent.click(await screen.findByRole('button', {name: 'Delete plan'}));

      await waitFor(() => {
        expect(mockShopify.toast.show).toHaveBeenCalledWith(
          'Error deleting subscription plan',
          {isError: true},
        );
      });

      expect(screen.queryByText('Plan list')).not.toBeInTheDocument();
    });
  });

  describe('shows a save bar', () => {
    afterEach(() => {
      mockShopify.resourcePicker.mockClear();
    });

    it('when a text field is changed', async () => {
      await mountSellingPlanDetails({id: '1'});

      expect(mockShopify.saveBar.show).not.toHaveBeenCalled();

      const planTitle = screen.getByLabelText('Plan title');
      await userEvent.type(planTitle, 'My test plan');

      expect(mockShopify.saveBar.show).toHaveBeenCalledOnce();
    });

    it('when a product is selected', async () => {
      await mountSellingPlanDetails({id: '1'});

      mockShopify.resourcePicker.mockResolvedValueOnce([mockProduct]);

      expect(mockShopify.saveBar.show).not.toHaveBeenCalled();

      // The resource picker modal is mocked, so no need for any other user interaction
      const searchBox = screen.getByPlaceholderText('Search products');
      await userEvent.type(searchBox, 'a');

      expect(mockShopify.saveBar.show).toHaveBeenCalled();
    });

    it('when a delivery option is added', async () => {
      await mountSellingPlanDetails({id: '1'});

      expect(mockShopify.saveBar.show).not.toHaveBeenCalled();

      await userEvent.click(screen.getByRole('button', {name: 'Add option'}));

      expect(mockShopify.saveBar.show).toHaveBeenCalledOnce();
    });
  });
});
