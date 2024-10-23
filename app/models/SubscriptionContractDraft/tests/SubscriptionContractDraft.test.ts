import type {
  CountryCode,
  SellingPlanPricingPolicyAdjustmentType,
  SubscriptionDeliveryPolicyInput,
} from 'types/admin.types';

import type {PricingPolicyInput} from '~/routes/app.contracts.$id.edit/validator';
import type {SellingPlanInterval} from '~/types';
import type {SubscriptionLineInput} from '~/types/contractEditing';

import {TEST_SHOP} from '#/constants';
import {mockShopifyServer} from '#/test-utils';
import {faker} from '@faker-js/faker';
import type {Address} from '@shopify/address';
import {composeGid} from '@shopify/admin-graphql-api-utilities';
import {afterEach, describe, expect, it, vi} from 'vitest';
import SubscriptionContractDraftAddLineMutation from '~/graphql/SubscriptionContractDraftAddLineMutation';
import SubscriptionContractDraftUpdateMutation from '~/graphql/SubscriptionContractDraftUpdateMutation';
import SubscriptionDraftUpdateLineMutation from '~/graphql/SubscriptionDraftUpdateLineMutation';
import {buildDraftFromContract} from '../SubscriptionContractDraft.server';

describe('buildDraftFromContract', () => {
  afterEach(() => {
    graphQL.mockRestore();
  });

  const {graphQL, mockGraphQL} = mockShopifyServer();

  const defaultGraphQLResponses = {
    SubscriptionContractUpdate: {
      data: {
        subscriptionContractUpdate: {
          draft: {
            id: composeGid('SubscriptionContractDraft', 1),
          },
          userErrors: [],
        },
      },
    },
  };
  it('creates a subscription draft object from a contract', async () => {
    mockGraphQL(defaultGraphQLResponses);

    const contractId = composeGid('SubscriptionContract', 1);
    const draft = await buildDraftFromContract(TEST_SHOP, contractId, graphQL);

    expect(draft.id).toBe(
      defaultGraphQLResponses.SubscriptionContractUpdate.data
        .subscriptionContractUpdate.draft.id,
    );
  });

  it('throws an error if creating a draft fails', async () => {
    mockGraphQL({
      ...defaultGraphQLResponses,
      SubscriptionContractUpdate: {
        data: {
          subscriptionContractUpdate: {
            draft: null,
          },
          userErrors: [
            {
              field: ['contractId'],
              message: 'Subscription contract is invalid',
            },
          ],
        },
      },
    });

    const contractId = composeGid('SubscriptionContract', 1);
    const expectedError = `Unable to create draft for contract id ${contractId}`;

    expect(
      async () => await buildDraftFromContract(TEST_SHOP, contractId, graphQL),
    ).rejects.toThrow(expectedError);
  });
});

describe('SubscriptionContractDraft', () => {
  afterEach(() => {
    graphQL.mockClear();
  });

  const {graphQL, mockGraphQL} = mockShopifyServer();

  const defaultGraphQLResponses = {
    SubscriptionContractUpdate: {
      data: {
        subscriptionContractUpdate: {
          draft: {
            id: composeGid('SubscriptionContractDraft', 1),
          },
          userErrors: [],
        },
      },
    },
    SubscriptionContractDraftAddLine: {
      data: {
        subscriptionDraftLineAdd: {
          lineAdded: {
            id: composeGid('SubscriptionLine', 1),
          },
          userErrors: [],
        },
      },
    },
    SubscriptionDraftLineRemove: {
      data: {
        subscriptionDraftLineRemove: {
          lineRemoved: {
            id: composeGid('SubscriptionLine', 1),
          },
          userErrors: [],
        },
      },
    },
    SubscriptionDraftCommit: {
      data: {
        subscriptionDraftCommit: {
          contract: {
            id: composeGid('SubscriptionContract', 1),
          },
          userErrors: [],
        },
      },
    },
    SubscriptionDraftLineUpdate: {
      data: {
        subscriptionDraftLineUpdate: {
          lineUpdated: {
            id: composeGid('SubscriptionLine', 1),
            variantId: composeGid('ProductVariant', 1),
            quantity: 2,
          },
          userErrors: [],
        },
      },
    },
    SubscriptionDraftUpdate: {
      data: {
        subscriptionDraftUpdate: {
          draft: {
            id: composeGid('SubscriptionContractDraft', 1),
          },
          userErrors: [],
        },
      },
    },
    SubscriptionContractDraftDiscounts: {
      data: {
        subscriptionDraft: {
          discounts: {
            edges: [],
          },
        },
      },
    },
    SubscriptionContractDraftRemoveDiscount: {
      data: {
        subscriptionDraftDiscountRemove: {
          draft: {
            id: composeGid('SubscriptionContractDraft', 1),
          },
          userErrors: [],
        },
      },
    },
  };

  describe('addLine', () => {
    it('adds a line to a draft', async () => {
      mockGraphQL(defaultGraphQLResponses);

      const mockContractId = composeGid('SubscriptionContract', 1);
      const mockDraft = await buildDraftFromContract(
        TEST_SHOP,
        mockContractId,
        graphQL,
      );

      const subscriptionPrice = Number(faker.commerce.price());
      const basePrice = Number(faker.commerce.price());

      const lineToAdd: SubscriptionLineInput = {
        currentPrice: subscriptionPrice,
        quantity: faker.number.int({min: 1, max: 10}),
        productVariantId: composeGid('ProductVariant', 1),
        pricingPolicy: {
          basePrice,
          cycleDiscounts: [
            {
              adjustmentType:
                'FIXED_AMOUNT' as SellingPlanPricingPolicyAdjustmentType,
              adjustmentValue: {
                fixedValue: subscriptionPrice,
              },
              afterCycle: 0,
              computedPrice: subscriptionPrice,
            },
          ],
        },
      };

      const addLineResult = await mockDraft.addLine(lineToAdd);

      expect(graphQL).toHaveBeenCalledWith(
        SubscriptionContractDraftAddLineMutation,
        {
          variables: {
            draftId: mockDraft.id,
            input: lineToAdd,
          },
        },
      );

      expect(addLineResult).toBe(true);
    });

    it('returns false if adding a line fails', async () => {
      mockGraphQL({
        ...defaultGraphQLResponses,
        SubscriptionContractDraftAddLine: {
          data: {
            subscriptionDraftLineAdd: {
              lineAdded: null,
              userErrors: [
                {
                  field: ['input', 'productVariantId'],
                  message: 'Product variant is invalid',
                },
              ],
            },
          },
        },
      });

      const mockContractId = composeGid('SubscriptionContract', 1);
      const mockDraft = await buildDraftFromContract(
        TEST_SHOP,
        mockContractId,
        graphQL,
      );

      const lineToAdd: SubscriptionLineInput = {
        currentPrice: Number(faker.commerce.price()),
        quantity: faker.number.int({min: 1, max: 10}),
        productVariantId: composeGid('ProductVariant', 1),
      };

      const addLineResult = await mockDraft.addLine(lineToAdd);

      expect(addLineResult).toBe(false);
    });
  });

  describe('removeLine', () => {
    it('removes a line from a draft', async () => {
      mockGraphQL(defaultGraphQLResponses);

      const mockContractId = composeGid('SubscriptionContract', 1);
      const mockDraft = await buildDraftFromContract(
        TEST_SHOP,
        mockContractId,
        graphQL,
      );

      const lineIdToRemove = composeGid('SubscriptionLine', 1);

      const removeLineResult = await mockDraft.removeLine(lineIdToRemove);

      expect(removeLineResult).toBe(true);
    });

    it('returns false if removing a line fails', async () => {
      mockGraphQL({
        ...defaultGraphQLResponses,
        SubscriptionDraftLineRemove: {
          data: {
            subscriptionDraftLineRemove: {
              lineRemoved: null,
              userErrors: [
                {
                  field: ['lineId'],
                  message: 'Line is invalid',
                },
              ],
            },
          },
        },
      });

      const mockContractId = composeGid('SubscriptionContract', 1);
      const mockDraft = await buildDraftFromContract(
        TEST_SHOP,
        mockContractId,
        graphQL,
      );

      const lineIdToRemove = composeGid('SubscriptionLine', 1);

      const removeLineResult = await mockDraft.removeLine(lineIdToRemove);

      expect(removeLineResult).toBe(false);
    });
  });

  describe('commit', () => {
    it('commits a draft', async () => {
      mockGraphQL(defaultGraphQLResponses);

      const mockContractId = composeGid('SubscriptionContract', 1);
      const mockDraft = await buildDraftFromContract(
        TEST_SHOP,
        mockContractId,
        graphQL,
      );

      const commitDraftResult = await mockDraft.commit();

      expect(commitDraftResult).toBe(true);
    });

    it('handles errors', async () => {
      mockGraphQL({
        ...defaultGraphQLResponses,
        SubscriptionDraftCommit: {
          data: {
            subscriptionDraftCommit: {
              contract: null,
              userErrors: [
                {
                  field: ['draftId'],
                  message: 'Contract draft is invalid',
                },
              ],
            },
          },
        },
      });

      const mockContractId = composeGid('SubscriptionContract', 1);
      const mockDraft = await buildDraftFromContract(
        TEST_SHOP,
        mockContractId,
        graphQL,
      );

      const commitDraftResult = await mockDraft.commit();

      expect(commitDraftResult).toBe(false);
    });

    describe('remove discount', () => {
      it('removes a discount from the draft if there are no entitled lines for that discount', async () => {
        mockGraphQL({
          ...defaultGraphQLResponses,
          SubscriptionContractDraftDiscounts: {
            data: {
              subscriptionDraft: {
                discounts: {
                  edges: [
                    {
                      node: {
                        id: composeGid('SubscriptionManualDiscount', 1),
                        entitledLines: {
                          lines: {
                            all: false,
                            edges: [],
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        });

        const mockContractId = composeGid('SubscriptionContract', 1);
        const mockDraft = await buildDraftFromContract(
          TEST_SHOP,
          mockContractId,
          graphQL,
        );

        const removeDiscountSpy = vi.spyOn<any, any>(
          mockDraft,
          'removeDiscount',
        );

        await mockDraft.commit();

        expect(removeDiscountSpy).toHaveBeenCalledWith(
          composeGid('SubscriptionManualDiscount', 1),
        );
      });

      it('does not remove a discount from the draft if there are entitled lines for that discount', async () => {
        mockGraphQL({
          ...defaultGraphQLResponses,
          SubscriptionContractDraftDiscounts: {
            data: {
              subscriptionDraft: {
                discounts: {
                  edges: [
                    {
                      node: {
                        id: composeGid('SubscriptionManualDiscount', 1),
                        entitledLines: {
                          all: false,
                          lines: {
                            edges: [
                              {
                                node: {
                                  id: composeGid('SubscriptionLine', 1),
                                },
                              },
                            ],
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        });

        const mockContractId = composeGid('SubscriptionContract', 1);
        const mockDraft = await buildDraftFromContract(
          TEST_SHOP,
          mockContractId,
          graphQL,
        );

        const removeDiscountSpy = vi.spyOn<any, any>(
          mockDraft,
          'removeDiscount',
        );

        await mockDraft.commit();

        expect(removeDiscountSpy).not.toHaveBeenCalled();
      });

      it('does not remove a discount from the draft if the discount is valid for all lines', async () => {
        mockGraphQL({
          ...defaultGraphQLResponses,
          SubscriptionContractDraftDiscounts: {
            data: {
              subscriptionDraft: {
                discounts: {
                  edges: [
                    {
                      node: {
                        id: composeGid('SubscriptionManualDiscount', 1),
                        entitledLines: {
                          all: true,
                          lines: {
                            edges: [],
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        });

        const mockContractId = composeGid('SubscriptionContract', 1);
        const mockDraft = await buildDraftFromContract(
          TEST_SHOP,
          mockContractId,
          graphQL,
        );

        const removeDiscountSpy = vi.spyOn<any, any>(
          mockDraft,
          'removeDiscount',
        );

        await mockDraft.commit();

        expect(removeDiscountSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('update line', () => {
    it('updates the quantity of a subscription line', async () => {
      mockGraphQL(defaultGraphQLResponses);

      const mockContractId = composeGid('SubscriptionContract', 1);
      const mockDraft = await buildDraftFromContract(
        TEST_SHOP,
        mockContractId,
        graphQL,
      );

      const lineId = composeGid('SubscriptionLine', 1);

      const updateQuantityResult = await mockDraft.updateLine(lineId, {
        quantity: 2,
      });

      expect(updateQuantityResult).toBe(true);
    });

    it('updates the price and pricing policy of a subscription line', async () => {
      mockGraphQL(defaultGraphQLResponses);

      const mockContractId = composeGid('SubscriptionContract', 1);
      const mockDraft = await buildDraftFromContract(
        TEST_SHOP,
        mockContractId,
        graphQL,
      );

      const lineId = composeGid('SubscriptionLine', 1);
      const newPrice = 2.5;

      const newPricingPolicy: PricingPolicyInput = {
        basePrice: Number(faker.commerce.price()),
        cycleDiscounts: [
          {
            adjustmentType:
              'FIXED_AMOUNT' as SellingPlanPricingPolicyAdjustmentType,
            adjustmentValue: {
              fixedValue: newPrice,
            },
            afterCycle: 0,
            computedPrice: newPrice,
          },
        ],
      };

      const updateQuantityResult = await mockDraft.updateLine(lineId, {
        currentPrice: newPrice,
        pricingPolicy: newPricingPolicy,
      });

      expect(graphQL).toHaveBeenCalledWith(
        SubscriptionDraftUpdateLineMutation,
        {
          variables: {
            draftId: mockDraft.id,
            lineId,
            input: {
              currentPrice: newPrice,
              pricingPolicy: newPricingPolicy,
            },
          },
        },
      );

      expect(updateQuantityResult).toBe(true);
    });

    it('throws an error if neither price nor quantity is provided', async () => {
      mockGraphQL(defaultGraphQLResponses);

      const mockContractId = composeGid('SubscriptionContract', 1);
      const mockDraft = await buildDraftFromContract(
        TEST_SHOP,
        mockContractId,
        graphQL,
      );

      const lineId = composeGid('SubscriptionLine', 1);

      expect(
        async () => await mockDraft.updateLine(lineId, {}),
      ).rejects.toThrow('one of quantity or price are required');
    });

    it('handles errors if updating a subscription line fails', async () => {
      mockGraphQL({
        ...defaultGraphQLResponses,
        SubscriptionDraftLineUpdate: {
          data: {
            subscriptionDraftLineUpdate: {
              lineUpdated: {
                id: composeGid('SubscriptionLine', 1),
                variantId: composeGid('ProductVariant', 1),
                quantity: 2,
              },
              userErrors: [
                {
                  field: ['quantity'],
                  message: 'Quantity is invalid',
                },
              ],
            },
          },
        },
      });

      const mockContractId = composeGid('SubscriptionContract', 1);
      const mockDraft = await buildDraftFromContract(
        TEST_SHOP,
        mockContractId,
        graphQL,
      );

      const lineId = composeGid('SubscriptionLine', 1);

      const updateQuantityResult = await mockDraft.updateLine(lineId, {
        quantity: 2,
      });

      expect(updateQuantityResult).toBe(false);
    });
  });

  describe('update draft', () => {
    it('updates the delivery and billing policies', async () => {
      mockGraphQL(defaultGraphQLResponses);

      const mockContractId = composeGid('SubscriptionContract', 1);
      const mockDraft = await buildDraftFromContract(
        TEST_SHOP,
        mockContractId,
        graphQL,
      );

      const newDeliveryPolicy: SubscriptionDeliveryPolicyInput = {
        interval: 'WEEK' as SellingPlanInterval,
        intervalCount: 2,
      };

      const updateDraftResult = await mockDraft.update({
        deliveryPolicy: newDeliveryPolicy,
        billingPolicy: newDeliveryPolicy,
      });

      expect(updateDraftResult).toBe(true);

      expect(graphQL).toHaveBeenCalledWith(
        SubscriptionContractDraftUpdateMutation,
        {
          variables: {
            draftId: mockDraft.id,
            input: {
              billingPolicy: newDeliveryPolicy,
              deliveryPolicy: newDeliveryPolicy,
            },
          },
        },
      );
    });

    it('handles errors if updating the draft fails', async () => {
      mockGraphQL({
        ...defaultGraphQLResponses,
        SubscriptionDraftUpdate: {
          data: {
            subscriptionDraftUpdate: {
              draft: null,
              userErrors: [
                {
                  field: ['input', 'deliveryPolicy', 'intervalCount'],
                  message:
                    'Delivery policy interval count must be greater than 0',
                },
              ],
            },
          },
        },
      });

      const mockContractId = composeGid('SubscriptionContract', 1);
      const mockDraft = await buildDraftFromContract(
        TEST_SHOP,
        mockContractId,
        graphQL,
      );

      const newDeliveryPolicy = {
        interval: 'WEEK' as SellingPlanInterval,
        intervalCount: -5,
      };

      const updateDraftResult = await mockDraft.update({
        deliveryPolicy: newDeliveryPolicy,
        billingPolicy: newDeliveryPolicy,
      });

      expect(updateDraftResult).toBe(false);
    });
  });

  describe('updateAddress', () => {
    it('updates the address on the contract', async () => {
      mockGraphQL(defaultGraphQLResponses);

      const mockContractId = composeGid('SubscriptionContract', 1);
      const mockDraft = await buildDraftFromContract(
        TEST_SHOP,
        mockContractId,
        graphQL,
      );

      const mockAddress: Address = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        address1: faker.location.streetAddress(false),
        address2: faker.location.secondaryAddress(),
        city: faker.location.city(),
        zip: faker.location.zipCode(),
        country: 'CA',
      };

      const updateDraftResult = await mockDraft.updateAddress(
        mockAddress,
        'SubscriptionDeliveryMethodShipping',
      );

      const {country, province, ...rest} = mockAddress;

      const expectedAddressInput = {
        countryCode: country,
        provinceCode: province,
        ...rest,
      };

      expect(updateDraftResult).toBe(true);

      expect(graphQL).toHaveBeenCalledWith(
        SubscriptionContractDraftUpdateMutation,
        {
          variables: {
            draftId: mockDraft.id,
            input: {
              deliveryMethod: {
                shipping: {
                  address: expectedAddressInput,
                },
              },
            },
          },
        },
      );
    });

    it('handles errors if updating the address fails', async () => {
      mockGraphQL({
        ...defaultGraphQLResponses,
        SubscriptionDraftUpdate: {
          data: {
            subscriptionDraftUpdate: {
              draft: null,
              userErrors: [
                {
                  field: ['address'],
                  message: 'Invalid Address',
                },
              ],
            },
          },
        },
      });

      const mockContractId = composeGid('SubscriptionContract', 1);
      const mockDraft = await buildDraftFromContract(
        TEST_SHOP,
        mockContractId,
        graphQL,
      );

      const mockAddress = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        address1: faker.location.streetAddress(false),
        address2: faker.location.secondaryAddress(),
        city: faker.location.city(),
        zip: faker.location.zipCode(),
        country: 'Canada',
        countryCode: 'CA' as CountryCode,
      };

      const updateDraftResult = await mockDraft.updateAddress(
        mockAddress,
        'SubscriptionDeliveryMethodShipping',
      );

      expect(updateDraftResult).toBe(false);
    });
  });
});
