import {
  mockShopifyServer,
  mountRemixStubWithAppContext,
  waitForGraphQL,
} from '#/test-utils';
import {faker} from '@faker-js/faker';
import {parseGid} from '@shopify/admin-graphql-api-utilities';
import {screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {mockShopify} from '#/setup-app-bridge';
import type {
  CurrencyCode,
  DiscountTargetType,  SellingPlanInterval,
  SellingPlanPricingPolicyAdjustmentType,
  SubscriptionContractSubscriptionStatus,
} from 'types/admin.types';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {formatPrice} from '~/utils/helpers/money';import {SubscriptionContractStatus} from '~/types';
import {action as pauseAction} from '../../app.contracts.$id.pause/route';
import {action as resumeAction} from '../../app.contracts.$id.resume/route';
import ContractsDetailsPage, {loader} from '../route';
import {
  createGraphQLLocalDeliveryDeliveryMethod,
  createGraphQLPickupDeliveryMethod,
  createMockBillingCycles,
  createMockSubscriptionContract,
  generateSubscriptionContractLineNode,
  type SubscriptionContractDetailsGraphQLType,
} from './Fixtures';

vi.stubGlobal('shopify', mockShopify);

const defaultContract = createMockSubscriptionContract({
  subscriptionContract: {id: 'gid://1'},
});
const pausedContract = createMockSubscriptionContract({
  subscriptionContract: {
    id: 'gid://1',
    status:
      SubscriptionContractStatus.Paused as SubscriptionContractSubscriptionStatus,
  },
});
const mockBillingCycles = createMockBillingCycles();

const defaultGraphQLResponses = {
  SubscriptionContractDetails: {
    data: {
      subscriptionContract: defaultContract,
    },
  },
  SubscriptionBillingCycles: {
    data: {
      subscriptionBillingCycles: mockBillingCycles,
    },
  },
  SubscriptionContractPause: {
    data: {
      subscriptionContractPause: {
        contract: {id: defaultContract.id},
        userErrors: [],
      },
    },
  },
  SubscriptionContractResume: {
    data: {
      subscriptionContractActivate: {
        contract: {id: defaultContract.id},
        userErrors: [],
      },
    },
  },
};

function getDefaultGraphQLResponses(
  subscriptionContract?: Partial<SubscriptionContractDetailsGraphQLType>,
) {
  return {
    ...defaultGraphQLResponses,
    SubscriptionContractDetails: {
      data: {
        subscriptionContract: {
          ...defaultContract,
          ...subscriptionContract,
        },
      },
    },
  };
}

const errorGraphQLResponses = {
  ...defaultGraphQLResponses,
  SubscriptionContractPause: {
    data: {
      subscriptionContractPause: {
        contract: null,
        userErrors: [
          {field: 'contractId', message: 'Unable to pause contract'},
        ],
      },
    },
  },
  SubscriptionContractResume: {
    data: {
      subscriptionContractActivate: {
        contract: null,
        userErrors: [
          {field: 'contractId', message: 'Unable to resume contract'},
        ],
      },
    },
  },
};

const pausedGraphQLResponses = {
  ...defaultGraphQLResponses,
  SubscriptionContractDetails: {
    data: {
      subscriptionContract: pausedContract,
    },
  },
  SubscriptionContractResume: {
    data: {
      subscriptionContractActivate: {
        contract: {id: pausedContract.id},
        userErrors: [],
      },
    },
  },
};

const pausedErrorGraphQLResponses = {
  ...defaultGraphQLResponses,
  SubscriptionContractDetails: {
    data: {
      subscriptionContract: pausedContract,
    },
  },
  SubscriptionContractResume: {
    data: {
      subscriptionContractActivate: {
        contract: null,
        userErrors: [
          {field: 'contractId', message: 'Unable to resume contract'},
        ],
      },
    },
  },
};

const {mockGraphQL} = mockShopifyServer();

const deliveryPolicy = {
  interval: 'YEAR' as SellingPlanInterval,
  intervalCount: 2,
};

async function mountContractDetails({
  graphQLResponses = defaultGraphQLResponses as object,
} = {}) {
  mockGraphQL(graphQLResponses);

  mountRemixStubWithAppContext({
    routes: [
      {
        path: `/app/contracts/:id`,
        Component: () => <ContractsDetailsPage />,
        loader,
      },
      {
        path: `/app/contracts/:id/pause`,
        action: pauseAction,
      },
      {
        path: `/app/contracts/:id/resume`,
        action: resumeAction,
      },
    ],
    remixStubProps: {
      initialEntries: [`/app/contracts/${parseGid(defaultContract.id)}`],
    },
  });

  return await screen.findByText('Subscription details');
}

describe('Contract details', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('displays the contract id', async () => {
    await mountContractDetails();

    expect(screen.getByText(parseGid(defaultContract.id))).toBeInTheDocument();
  });

  describe('contract details card', () => {
    it('displays the edit button', async () => {
      await mountContractDetails();
      expect(screen.getByRole('link', {name: /Edit/i})).toBeInTheDocument();
    });

    it('displays the contract status', async () => {
      await mountContractDetails();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('displays the product name, quantity, order number and price', async () => {
      await mountContractDetails();

      expect(
        screen.getByText(defaultContract.lines.edges[0].node.title),
      ).toBeInTheDocument();
      expect(
        screen.getByText(defaultContract.lines.edges[0].node.variantTitle!),
      ).toBeInTheDocument();
      expect(
        screen.getByText(defaultContract.lines.edges[0].node.quantity),
      ).toBeInTheDocument();
      expect(
        screen.getByText(`Order ${defaultContract.originOrder!.name}`, {
          exact: false,
        }),
      ).toBeInTheDocument();
    });

    describe('delivery frequency', () => {
      it('is displayed for weekly contracts', async () => {
        const graphQLResponses = getDefaultGraphQLResponses({
          deliveryPolicy: {
            interval: 'WEEK' as SellingPlanInterval,
            intervalCount: 5,
          },
        });

        await mountContractDetails({graphQLResponses});

        expect(screen.getByText('Every 5 weeks')).toBeInTheDocument();
      });

      it('is displayed for monthly contracts', async () => {
        const graphQLResponses = getDefaultGraphQLResponses({
          deliveryPolicy: {
            interval: 'MONTH' as SellingPlanInterval,
            intervalCount: 3,
          },
        });

        await mountContractDetails({graphQLResponses});

        expect(screen.getByText('Every 3 months')).toBeInTheDocument();
      });

      it('is displayed for yearly contracts', async () => {
        const graphQLResponses = getDefaultGraphQLResponses({
          deliveryPolicy: {
            interval: 'YEAR' as SellingPlanInterval,
            intervalCount: 2,
          },
        });

        await mountContractDetails({graphQLResponses});

        expect(screen.getByText('Every 2 years')).toBeInTheDocument();
      });
    });

    describe('Delivery - local pickup text', () => {
      it('is not displayed for shipping option delivery method', async () => {
        const graphQLResponses = getDefaultGraphQLResponses({
          deliveryPolicy: deliveryPolicy,
        });

        await mountContractDetails({graphQLResponses});

        expect(
          screen.queryByText('Every 2 years, local pickup'),
        ).not.toBeInTheDocument();
      });

      it('is not displayed for local delivery delivery method', async () => {
        const graphQLResponses = getDefaultGraphQLResponses({
          deliveryMethod: createGraphQLLocalDeliveryDeliveryMethod(),
          deliveryPolicy: deliveryPolicy,
        });

        await mountContractDetails({graphQLResponses});

        expect(
          screen.queryByText('Every 2 years, local pickup'),
        ).not.toBeInTheDocument();
      });

      it('is displayed for local pickup delivery method', async () => {
        const graphQLResponses = getDefaultGraphQLResponses({
          deliveryMethod: createGraphQLPickupDeliveryMethod(),
          deliveryPolicy: deliveryPolicy,
        });

        await mountContractDetails({graphQLResponses});

        expect(
          screen.getByText('Every 2 years, local pickup'),
        ).toBeInTheDocument();
      });
    });

    describe('discount', () => {
      const basePricingPolicy = {
        basePrice: {
          amount: faker.finance.amount({min: 1, max: 100}),
          currencyCode: 'CAD' as CurrencyCode,
        },
      };

      it('displays percentage discounts', async () => {
        const graphQLResponses = getDefaultGraphQLResponses(
          createMockSubscriptionContract({
            subscriptionContractLineNode: {
              pricingPolicy: {
                ...basePricingPolicy,
                cycleDiscounts: [
                  {
                    adjustmentType:
                      'PERCENTAGE' as SellingPlanPricingPolicyAdjustmentType,
                    adjustmentValue: {
                      percentage: 10,
                    },
                  },
                ],
              },
            },
          }),
        );

        await mountContractDetails({graphQLResponses});

        expect(screen.getByText('10% off')).toBeInTheDocument();
      });

      it('displays fixed amount discounts', async () => {
        const graphQLResponses = getDefaultGraphQLResponses(
          createMockSubscriptionContract({
            subscriptionContractLineNode: {
              pricingPolicy: {
                ...basePricingPolicy,
                cycleDiscounts: [
                  {
                    adjustmentType:
                      'FIXED_AMOUNT' as SellingPlanPricingPolicyAdjustmentType,
                    adjustmentValue: {
                      amount: 34,
                      currencyCode: 'CAD' as CurrencyCode,
                    },
                  },
                ],
              },
            },
          }),
        );

        await mountContractDetails({graphQLResponses});

        expect(screen.getByText('CA$34.00 off')).toBeInTheDocument();
      });

      it('displays flat rate discounts', async () => {
        const graphQLResponses = getDefaultGraphQLResponses(
          createMockSubscriptionContract({
            subscriptionContractLineNode: {
              pricingPolicy: {
                ...basePricingPolicy,
                cycleDiscounts: [
                  {
                    adjustmentType:
                      'PRICE' as SellingPlanPricingPolicyAdjustmentType,
                    adjustmentValue: {
                      amount: 91,
                      currencyCode: 'CAD' as CurrencyCode,
                    },
                  },
                ],
              },
            },
          }),
        );

        await mountContractDetails({graphQLResponses});

        expect(screen.getByText('CA$91.00 flat rate')).toBeInTheDocument();
      });

      it('displays multiple discounts text when there is more than one line item', async () => {
        const graphQLResponses = getDefaultGraphQLResponses(
          createMockSubscriptionContract({
            subscriptionContract: {
              lines: {
                edges: [
                  {node: generateSubscriptionContractLineNode()},
                  {node: generateSubscriptionContractLineNode()},
                ],
              },
            },
          }),
        );

        await mountContractDetails({graphQLResponses});

        expect(screen.getByText('Multiple discounts')).toBeInTheDocument();
      });
    });

    describe('when contract is paused successfully', () => {
      it('shows a success toast', async () => {
        await mountContractDetails();

        // in more recent versions of polaris both the page action button (big screen)
        // and the action menu button accessed by the 3 dots on mobile layout will be
        // present in the DOM resulting in 2 buttons with the same content
        await userEvent.click(
          screen.getAllByRole('button', {name: 'Pause contract'})[0],
        );
        // await userEvent.click(screen.getByText('Pause'));
        await waitForGraphQL();

        expect(mockShopify.toast.show).toHaveBeenCalledWith(
          'Contract paused successfully',
          {isError: false},
        );
      });
    });

    describe('when contract is paused unsuccessfully', () => {
      it('shows a failure toast', async () => {
        await mountContractDetails({graphQLResponses: errorGraphQLResponses});

        await userEvent.click(
          screen.getAllByRole('button', {name: 'Pause contract'})[0],
        );
        await waitForGraphQL();

        expect(mockShopify.toast.show).toHaveBeenCalledWith(
          'Unable to pause contract',
          {isError: true},
        );
      });
    });

    describe('when a contract is resumed successfully', () => {
      it('shows a success toast', async () => {
        await mountContractDetails({graphQLResponses: pausedGraphQLResponses});

        await userEvent.click(
          screen.getAllByRole('button', {name: 'Resume contract'})[0],
        );
        await waitForGraphQL();

        expect(mockShopify.toast.show).toHaveBeenCalledWith(
          'Contract resumed successfully',
          {isError: false},
        );
      });
    });

    describe('when a contract is resumed unsuccessfully', () => {
      it('shows a failure toast', async () => {
        await mountContractDetails({
          graphQLResponses: pausedErrorGraphQLResponses,
        });

        await userEvent.click(
          screen.getAllByRole('button', {name: 'Resume contract'})[0],
        );
        await waitForGraphQL();

        expect(mockShopify.toast.show).toHaveBeenCalledWith(
          'Unable to resume contract',
          {isError: true},
        );
      });
    });
  });

  describe('price summary card', async () => {
    it('displays substotal price', async () => {
      const graphQLResponses = getDefaultGraphQLResponses({
        lines: {
          edges: [
            {
              node: generateSubscriptionContractLineNode({
                lineDiscountedPrice: {
                  amount: 13.45,
                  currencyCode: 'CAD' as CurrencyCode,
                },
              }),
            },
            {
              node: generateSubscriptionContractLineNode({
                lineDiscountedPrice: {
                  amount: 27.5,
                  currencyCode: 'CAD' as CurrencyCode,
                },
              }),
            },
          ],
        },
      });

      await mountContractDetails({graphQLResponses});

      const expectedCurrencyText = formatPrice({amount: 40.95, currency: 'CAD', locale: 'en'});

      expect(screen.getByText('Subtotal')).toBeInTheDocument();
      expect(screen.getByText(expectedCurrencyText)).toBeInTheDocument();
    });

    it('dislays shipping price', async () => {
      const graphQLResponses = getDefaultGraphQLResponses({
        deliveryPrice: {
          amount: 7.5,
          currencyCode: 'CAD' as CurrencyCode,
        },
      });

      await mountContractDetails({graphQLResponses});

      const expectedCurrencyText = formatPrice({amount: 7.5, currency: 'CAD', locale: 'en'});

      expect(screen.getByText('Shipping')).toBeInTheDocument();
      expect(screen.getByText(expectedCurrencyText)).toBeInTheDocument();
    });

    it('displays discounted shipping price', async () => {
      const graphQLResponses = getDefaultGraphQLResponses({
        deliveryPrice: {
          amount: 7.5,
          currencyCode: 'CAD' as CurrencyCode,
        },
        discounts: {
          edges: [
            {
              node: {
                id: '1',
                title: 'Shipping Discount',
                targetType: 'SHIPPING_LINE' as DiscountTargetType,
              },
            },
          ],
        },
      });

      await mountContractDetails({graphQLResponses});

      const expectedCurrencyText = formatPrice({amount: 0, currency: 'CAD', locale: 'en'});

      expect(screen.getByText('Shipping')).toBeInTheDocument();
      expect(screen.getByText(expectedCurrencyText)).toBeInTheDocument();
    });
  });
  describe('with the contract created via API', () => {
    const contractFromApi = createMockSubscriptionContract({
      subscriptionContract: {
        status: 'CANCELLED' as SubscriptionContractSubscriptionStatus,
        originOrder: null,
      },
    });
    const newGraphQLResponse = {
      SubscriptionContractDetails: {
        data: {
          subscriptionContract: contractFromApi,
        },
      },
      SubscriptionBillingCycles: {
        data: {
          subscriptionBillingCycles: mockBillingCycles,
        },
      },
    };

    it('displays the contract id', async () => {
      await mountContractDetails({graphQLResponses: newGraphQLResponse});
      expect(
        screen.getByText(parseGid(contractFromApi.id)),
      ).toBeInTheDocument();
    });

    it('displays the contract status', async () => {
      await mountContractDetails({graphQLResponses: newGraphQLResponse});
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });

    it('does not display the order number, and purchase date', async () => {
      await mountContractDetails({graphQLResponses: newGraphQLResponse});
      expect(screen.queryByText(`Order #`)).not.toBeInTheDocument();
    });
  });
});
