import {faker} from '@faker-js/faker';
import {composeGid} from '@shopify/admin-graphql-api-utilities';
import {DateTime} from 'luxon';
import type {
  CountryCode,
  CurrencyCode,
  SellingPlanInterval,
  SellingPlanPricingPolicyAdjustmentType,
  SubscriptionBillingAttempt,
  SubscriptionBillingCycleBillingCycleStatus,
  SubscriptionContractLastPaymentStatus,
  SubscriptionContractSubscriptionStatus,
  SubscriptionDeliveryMethodLocalDelivery,
  SubscriptionDeliveryMethodPickup,
  SubscriptionMailingAddress,
} from 'types/admin.types';
import type {ShopContextValue} from '~/context/ShopContext';
import type {UpcomingBillingCycle} from '~/types';
import type {
  Customer,
  LocalDelivery,
  LocalPickup,
  ShippingDelivery,
} from '~/types/contracts';
import {advanceDateTime} from '~/utils/helpers/date';

import type {
  SubscriptionContractDetailsQuery as SubscriptionContractDetailsQueryData,
  SubscriptionPastBillingCyclesQuery as SubscriptionPastBillingCyclesQueryType,
} from 'types/admin.generated';

export type SubscriptionContractDetailsGraphQLType = NonNullable<
  SubscriptionContractDetailsQueryData['subscriptionContract']
>;

type CustomerPaymentMethod = NonNullable<
  SubscriptionContractDetailsGraphQLType['customerPaymentMethod']
>;

type PaymentMethodInstrument = NonNullable<CustomerPaymentMethod['instrument']>;

type CustomerCreditCard = Extract<
  PaymentMethodInstrument,
  {__typename: 'CustomerCreditCard'}
>;

type CustomerPaypalBillingAgreement = Extract<
  PaymentMethodInstrument,
  {__typename: 'CustomerPaypalBillingAgreement'}
>;

type CustomerShopPayAgreement = Extract<
  PaymentMethodInstrument,
  {__typename: 'CustomerShopPayAgreement'}
>;

type SubscriptionContractCustomer = NonNullable<
  SubscriptionContractDetailsGraphQLType['customer']
>;

function generateGidNumber() {
  return faker.number.int({min: 1, max: 9999999});
}

export function createMockCustomer(customer?: Partial<Customer>): Customer {
  const {addresses, ...graphqlCustomer} = createMockGraphqlCustomer();
  return {
    ...graphqlCustomer,
    addresses: [],
    ...customer,
  };
}

export function createMockGraphqlCustomer(
  customer?: Partial<SubscriptionContractCustomer>,
): SubscriptionContractCustomer {
  return {
    id: composeGid('Customer', generateGidNumber()),
    displayName: faker.person.fullName(),
    email: faker.internet.email(),
    addresses: [],
    ...customer,
  };
}

export function createMockAddress(
  address?: Partial<SubscriptionMailingAddress>,
): SubscriptionMailingAddress {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    address1: faker.location.streetAddress(false),
    address2: faker.location.secondaryAddress(),
    city: faker.location.city(),
    zip: faker.location.zipCode(),
    countryCode: 'CA' as CountryCode,
    provinceCode: 'QC',
    ...address,
  };
}

export function createMockCreditCardInstrument(
  creditCard?: Partial<CustomerCreditCard>,
): CustomerCreditCard {
  return {
    __typename: 'CustomerCreditCard',
    brand: 'visa',
    lastDigits: '1234',
    maskedNumber: '•••• •••• •••• 1234',
    expiryYear: 2024,
    expiryMonth: 12,
    expiresSoon: false,
    ...creditCard,
  };
}

export function createMockShopPayAgreement(
  shopPay?: Partial<CustomerShopPayAgreement>,
): CustomerShopPayAgreement {
  return {
    __typename: 'CustomerShopPayAgreement',
    lastDigits: '1234',
    maskedNumber: '•••• •••• •••• 1234',
    expiryYear: faker.date.future().getFullYear(),
    expiryMonth: faker.date.future().getMonth(),
    expiresSoon: false,
    ...shopPay,
  };
}

export function createMockPaypalInstrument(
  paypal?: Partial<CustomerPaypalBillingAgreement>,
): CustomerPaypalBillingAgreement {
  return {
    __typename: 'CustomerPaypalBillingAgreement',
    paypalAccountEmail: faker.internet.email(),
    ...paypal,
  };
}

export function createMockCustomerPaymentMethod(
  paymentMethod?: Partial<CustomerPaymentMethod>,
): CustomerPaymentMethod {
  return {
    id: composeGid('CustomerPaymentMethod', faker.string.uuid()),
    instrument: createMockCreditCardInstrument(),
    ...paymentMethod,
  };
}

export function generateSubscriptionContractLineNode(
  node?: Partial<
    SubscriptionContractDetailsGraphQLType['lines']['edges'][0]['node']
  >,
) {
  return {
    id: composeGid('SubscriptionLine', generateGidNumber()),
    title: faker.commerce.productName(),
    variantTitle: faker.commerce.productName(),
    quantity: faker.number.int({min: 1}),
    productId: composeGid('Product', generateGidNumber()),
    currentPrice: {
      amount: faker.finance.amount({min: 1, max: 100}),
      currencyCode: 'CAD' as CurrencyCode,
    },
    lineDiscountedPrice: {
      amount: faker.finance.amount({min: 1, max: 100}),
      currencyCode: 'CAD' as CurrencyCode,
    },
    variantImage: {
      altText: faker.commerce.productName(),
      url: faker.image.url(),
    },
    pricingPolicy: {
      basePrice: {
        amount: faker.finance.amount({min: 1, max: 100}),
        currencyCode: 'CAD' as CurrencyCode,
      },
      cycleDiscounts: [
        {
          adjustmentType:
            'PERCENTAGE' as SellingPlanPricingPolicyAdjustmentType,
          adjustmentValue: {
            percentage: faker.number.float({min: 1, max: 100}),
          },
        },
      ],
    },
    ...node,
  };
}

export function createMockSubscriptionContract({
  subscriptionContract,
  subscriptionContractLineNode,
}: {
  subscriptionContract?: Partial<SubscriptionContractDetailsGraphQLType>;
  subscriptionContractLineNode?: Partial<
    SubscriptionContractDetailsGraphQLType['lines']['edges'][0]['node']
  >;
} = {}): SubscriptionContractDetailsGraphQLType {
  const orderNumber = faker.number.int({min: 1});

  return {
    id: composeGid('SubscriptionContract', generateGidNumber()),
    status: 'ACTIVE' as SubscriptionContractSubscriptionStatus,
    customer: createMockGraphqlCustomer(),
    currencyCode: 'CAD' as CurrencyCode,
    customerPaymentMethod: createMockCustomerPaymentMethod(),
    lastPaymentStatus: 'SUCCEEDED' as SubscriptionContractLastPaymentStatus,
    nextBillingDate: faker.date.future(),
    billingPolicy: {
      interval: 'MONTH' as SellingPlanInterval,
      intervalCount: 2,
    },
    deliveryMethod: {
      __typename: 'SubscriptionDeliveryMethodShipping' as const,
      address: createMockAddress(),
      shippingOption: {
        title: 'Standard',
      },
    },
    deliveryPolicy: {
      interval: 'MONTH' as SellingPlanInterval,
      intervalCount: faker.number.int({min: 1, max: 12}),
    },
    originOrder: {
      id: composeGid('Order', orderNumber),
      createdAt: faker.date.past(),
      name: `#${orderNumber}`,
    },
    deliveryPrice: {
      amount: faker.finance.amount({min: 1, max: 100}),
      currencyCode: 'CAD' as CurrencyCode,
    },
    discounts: {
      edges: [],
    }, // extract this into a helper function to make a line
    lines: {
      edges: [
        {
          node: {
            ...generateSubscriptionContractLineNode(),
            ...subscriptionContractLineNode,
          },
        },
      ],
    },
    billingAttempts: {
      edges: [
        {
          node: {
            id: composeGid('SubscriptionBillingAttempt', generateGidNumber()),
          },
        },
      ],
    },
    ...subscriptionContract,
  };
}

interface CreateMockBillingCycleInput {
  first: number;
  startDate: string;
  interval: SellingPlanInterval;
  intervalCount: number;
  allSkipped: boolean;
  hasMore: boolean;
  billingAttempts: Array<Partial<SubscriptionBillingAttempt>>;
}

export function createMockBillingCycles(
  input: Partial<CreateMockBillingCycleInput> = {},
) {
  const {
    first,
    startDate,
    interval,
    intervalCount,
    allSkipped,
    hasMore,
    billingAttempts,
  } = {
    first: 6,
    startDate: DateTime.now().toISO() ?? '2021-01-01',
    interval: 'MONTH' as SellingPlanInterval,
    intervalCount: 2,
    allSkipped: false,
    billingAttempts: new Array<Partial<SubscriptionBillingAttempt>>({
      id: composeGid('SubscriptionBillingAttempt', generateGidNumber()),
      errorCode: null,
    }),
    ...input,
  };
  let billingCycles: UpcomingBillingCycle[] = [];
  for (let i = 1; i <= first; i++) {
    const startDateLuxon = DateTime.fromISO(startDate);
    const nextCycleDateStr = advanceDateTime(
      startDateLuxon,
      interval,
      intervalCount,
      i,
    ).toISO();
    if (nextCycleDateStr) {
      billingCycles.push({
        skipped: allSkipped ?? false,
        billingAttemptExpectedDate: nextCycleDateStr,
        cycleIndex: i,
      });
    }
  }

  return {
    edges: billingCycles.map((billingCycle) => ({
      node: {
        ...billingCycle,
        billingAttempts: {
          edges: billingAttempts?.map((attempt) => ({
            node: {
              ...attempt,
            },
          })),
        },
      },
    })),
    pageInfo: {
      hasNextPage: hasMore,
    },
  };
}

export function createMockGraphQLResponse(response?: object) {
  return {
    SubscriptionContractDetails: {
      data: {
        subscriptionContract: createMockSubscriptionContract(),
      },
    },
    CustomerPaymentMethodSendUpdateEmail: {
      data: {
        customerPaymentMethodSendUpdateEmail: {
          customer: {
            id: composeGid('Customer', generateGidNumber()),
          },
          userErrors: [],
        },
      },
    },
    SubscriptionBillingCycles: {
      data: {
        subscriptionBillingCycles: createMockBillingCycles(),
      },
    },
    ...response,
  };
}

export function createMockShopContext(
  shopContext?: Partial<ShopContextValue>,
): ShopContextValue {
  return {
    currencyCode: 'CAD',
    name: faker.company.name(),
    contactEmail: faker.internet.email(),
    shopId: faker.number.int({min: 1}),
    shopifyDomain: faker.internet.domainName(),
    email: faker.internet.email(),
    ianaTimezone: 'America/Toronto',
    ...shopContext,
  };
}

export function createMockPastBillingCyclesResponse(
  response?: Partial<SubscriptionPastBillingCyclesQueryType>,
  length: number = 5,
): SubscriptionPastBillingCyclesQueryType {
  return {
    subscriptionBillingCycles: {
      edges: Array.from({length}).map((_, index) => ({
        node: {
          billingAttemptExpectedDate: faker.date.past().toISOString(),
          cycleIndex: index + 1,
          skipped: false,
          status: 'BILLED' as SubscriptionBillingCycleBillingCycleStatus,
          billingAttempts: {
            edges: [
              {
                node: {
                  id: composeGid('SubscriptionBillingAttempt', index + 1),
                  order: {
                    id: composeGid('Order', index + 1),
                    createdAt: faker.date.past().toISOString(),
                  },
                  ready: true,
                  errorCode: null,
                },
              },
            ],
          },
        },
      })),
    },
    ...response,
  };
}

export function createPickupDeliveryMethod(
  deliveryMethod?: Partial<LocalPickup>,
): LocalPickup {
  return {
    name: 'SubscriptionDeliveryMethodPickup',
    isLocalPickup: true,
    pickupOption: {
      title: String(createMockAddress().address1),
    },
    ...deliveryMethod,
  };
}

export function createLocalDeliveryDeliveryMethod(
  deliveryMethod?: Partial<LocalDelivery>,
): LocalDelivery {
  return {
    name: 'SubscriptionDeliveryMethodLocalDelivery',
    isLocalPickup: false,
    address: createMockAddress(),
    localDeliveryOption: {
      title: 'Local Delivery',
      phone: '+112345671234',
    },
    ...deliveryMethod,
  };
}

export function createShippingDeliveryMethod(
  deliveryMethod?: Partial<ShippingDelivery>,
): ShippingDelivery {
  return {
    name: 'SubscriptionDeliveryMethodShipping',
    isLocalPickup: false,
    address: createMockAddress(),
    shippingOption: {
      title: 'Standard',
    },
    ...deliveryMethod,
  };
}

export function createGraphQLPickupDeliveryMethod(
  deliveryMethod?: Partial<SubscriptionDeliveryMethodPickup>,
) {
  return {
    __typename: 'SubscriptionDeliveryMethodPickup' as const,
    pickupOption: {
      title: String(createMockAddress().address1),
      location: '' as unknown as Location,
    },
    ...deliveryMethod,
  };
}

export function createGraphQLLocalDeliveryDeliveryMethod(
  deliveryMethod?: Partial<SubscriptionDeliveryMethodLocalDelivery>,
) {
  return {
    __typename: 'SubscriptionDeliveryMethodLocalDelivery' as const,
    address: createMockAddress(),
    localDeliveryOption: {
      title: 'Local Delivery',
      phone: '+112345671234',
    },
    ...deliveryMethod,
  };
}
