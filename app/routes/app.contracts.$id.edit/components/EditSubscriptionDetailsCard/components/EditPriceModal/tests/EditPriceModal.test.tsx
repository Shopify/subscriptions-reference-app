import {mockShopifyServer, mountRemixStubWithAppContext} from '#/test-utils';
import {composeGid} from '@shopify/admin-graphql-api-utilities';
import {screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {
  CurrencyCode,
  SellingPlanPricingPolicyAdjustmentType,
} from 'types/admin.types';
import {describe, expect, it} from 'vitest';
import {
  createMockGraphQLResponse,
  createMockSubscriptionContractEditDetails,
  createMockSubscriptionLine,
} from '../../../tests/Fixtures';
import SubscriptionDetails, {loader} from '../../../../../route';

const {mockGraphQL} = mockShopifyServer();

const defaultContractResponse = createMockSubscriptionContractEditDetails();

const defaultGraphQLResponses = createMockGraphQLResponse({
  SubscriptionContractEditDetails: {
    data: {
      subscriptionContract: {
        ...defaultContractResponse,
      },
    },
  },
});

async function mountEditSubscriptionDetails(
  graphqlResponses: object = defaultGraphQLResponses,
) {
  mockGraphQL(graphqlResponses);

  mountRemixStubWithAppContext({
    routes: [
      {
        path: `/app/contracts/:id/edit`,
        Component: () => <SubscriptionDetails />,
        loader,
      },
    ],
    remixStubProps: {
      initialEntries: [`/app/contracts/1/edit`],
    },
  });

  await screen.findByText('Subscription details');
  return userEvent.click(screen.getByLabelText('Edit price'));
}

describe('EditPriceModal', () => {
  describe('ui', () => {
    it('renders the discount label if there is a cycle discount', async () => {
      const mockGraphQL = createMockGraphQLResponse({
        SubscriptionContractEditDetails: {
          data: {
            subscriptionContract: {
              ...defaultContractResponse,
              lines: {
                edges: [
                  {
                    node: createMockSubscriptionLine({
                      title: 'Line 1',
                      variantTitle: 'Variant title 1',
                      id: composeGid('SubscriptionLine', 1),
                      pricingPolicy: {
                        basePrice: {
                          currencyCode: 'CAD' as CurrencyCode,
                          amount: 100,
                        },
                        cycleDiscounts: [
                          {
                            afterCycle: 0,
                            computedPrice: {
                              currencyCode: 'CAD' as CurrencyCode,
                              amount: 75,
                            },
                            adjustmentType:
                              'PERCENTAGE' as SellingPlanPricingPolicyAdjustmentType,
                            adjustmentValue: {
                              percentage: 25,
                            },
                          },
                        ],
                      },
                    }),
                  },
                ],
              },
            },
          },
        },
      });

      await mountEditSubscriptionDetails(mockGraphQL);

      expect(
        screen.getByText(
          '25% off subscription discount applied to new price of Line 1',
        ),
      ).toBeInTheDocument();
    });

    it('shows an error and prevents updating if the entered amount is too large', async () => {
      await mountEditSubscriptionDetails();

      const priceInput = screen.getByRole('spinbutton', {
        name: /Subscription price/i,
      });
      expect(priceInput).toBeInTheDocument();

      const updateButton = screen.getByRole('button', {name: 'Update'});
      expect(updateButton).toBeInTheDocument();

      await userEvent.clear(priceInput);
      await userEvent.type(priceInput, '100000000000');

      expect(updateButton).toBeDisabled();

      expect(screen.getByText('Amount is too large')).toBeInTheDocument();
    });

    it('shows an error and prevents updating if the entered amount is negative', async () => {
      await mountEditSubscriptionDetails();

      const priceInput = screen.getByRole('spinbutton', {
        name: /Subscription price/i,
      });
      expect(priceInput).toBeInTheDocument();

      const updateButton = screen.getByRole('button', {name: 'Update'});
      expect(updateButton).toBeInTheDocument();

      await userEvent.clear(priceInput);
      await userEvent.type(priceInput, '-100');

      expect(updateButton).toBeDisabled();

      expect(
        screen.getByText('Amount must be greater than or equal to 0'),
      ).toBeInTheDocument();
    });
  });
});
