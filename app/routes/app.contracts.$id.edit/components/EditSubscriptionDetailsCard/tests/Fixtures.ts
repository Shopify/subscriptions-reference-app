import {faker} from '@faker-js/faker';
import {composeGid} from '@shopify/admin-graphql-api-utilities';
import {
  type CurrencyCode,
  type SellingPlanPricingPolicyAdjustmentType,
  type SubscriptionContractSubscriptionStatus,
} from 'types/admin.types';
import type {SubscriptionContractEditDetailsQuery} from 'types/admin.generated';
import {SellingPlanInterval} from '~/types';

type ContractEditGraphQLContract = NonNullable<
  SubscriptionContractEditDetailsQuery['subscriptionContract']
>;
type ContractEditGraphQLLine =
  ContractEditGraphQLContract['lines']['edges'][0]['node'];

export function createMockSubscriptionContractEditDetails(
  subscriptionContract?: Partial<ContractEditGraphQLContract>,
): ContractEditGraphQLContract {
  return {
    id: composeGid('SubscriptionContract', 1),
    status: 'ACTIVE' as SubscriptionContractSubscriptionStatus,
    currencyCode: 'CAD' as CurrencyCode,
    deliveryPolicy: {
      interval: SellingPlanInterval.Month,
      intervalCount: faker.number.int({min: 1, max: 12}),
    },
    deliveryPrice: {
      amount: Number(faker.finance.amount({min: 1, max: 100})),
      currencyCode: 'CAD' as CurrencyCode,
    },
    discounts: {
      edges: [],
    },
    lines: {
      edges: [
        {
          node: createMockSubscriptionLine(),
        },
      ],
    },
    ...subscriptionContract,
  };
}

export function createMockSubscriptionLine(
  line?: Partial<ContractEditGraphQLLine>,
): ContractEditGraphQLLine {
  const price = {
    amount: Number(faker.finance.amount({min: 1, max: 1000})),
    currencyCode: 'CAD' as CurrencyCode,
  };

  return {
    id: composeGid('SubscriptionLine', faker.number.int({min: 1})),
    title: faker.commerce.productName(),
    variantTitle: faker.commerce.productName(),
    quantity: faker.number.int({min: 1, max: 100}),
    currentPrice: price,
    lineDiscountedPrice: {
      amount: Number(faker.finance.amount({min: 1, max: 1000})),
      currencyCode: 'CAD' as CurrencyCode,
    },
    variantId: composeGid('ProductVariant', faker.number.int({min: 1})),
    productId: composeGid('Product', faker.number.int({min: 1})),
    variantImage: {
      altText: faker.lorem.words(3),
      url: faker.image.url(),
    },
    pricingPolicy: {
      basePrice: price,
      cycleDiscounts: [
        {
          adjustmentType:
            'PERCENTAGE' as SellingPlanPricingPolicyAdjustmentType,
          adjustmentValue: {
            percentage: faker.number.float({min: 5, max: 95}),
          },
          afterCycle: 0,
          computedPrice: price,
        },
      ],
    },
    ...line,
  };
}

export function createMockGraphQLResponse(response?: object) {
  return {
    SubscriptionContractEditDetails: {
      data: {
        subscriptionContract: createMockSubscriptionContractEditDetails(),
      },
    },
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
    Shop: {
      data: {
        shop: {
          id: composeGid('Shop', 1),
          name: faker.company.name(),
          ianaTimezone: 'America/Montreal',
          primaryDomain: {
            url: faker.internet.url(),
          },
          currencyCode: 'CAD',
          contactEmail: faker.internet.email(),
        },
      },
    },
    ProductVariantPrice: {
      data: {
        productVariant: {
          id: composeGid('ProductVariant', 1),
          price: Number(faker.finance.amount({min: 1, max: 100})),
        },
      },
    },
    ...response,
  };
}
