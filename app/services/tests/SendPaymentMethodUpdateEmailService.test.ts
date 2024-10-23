import {mockShopifyServer} from '#/test-utils';
import {faker} from '@faker-js/faker';
import {composeGid} from '@shopify/admin-graphql-api-utilities';
import {describe, expect, afterEach, it} from 'vitest';
import {sendPaymentMethodUpdateEmail} from '../SendPaymentMethodUpdateEmailService';

const customerPaymentMethodId = composeGid(
  'CustomerPaymentMethod',
  faker.string.uuid(),
);
const customerId = composeGid(
  'Customer',
  faker.number.int({min: 1, max: 9999999}),
);
const mockEmailInput = {
  from: faker.internet.email(),
  to: faker.internet.email(),
  subject: faker.lorem.sentence(),
};

function defaultGraphQLResponses() {
  return {
    CustomerPaymentMethodSendUpdateEmail: {
      data: {
        customerPaymentMethodSendUpdateEmail: {
          customer: {
            id: customerId,
          },
          userErrors: [],
        },
      },
    },
  };
}

const {graphQL, mockGraphQL} = mockShopifyServer();

describe('sendPaymentMethodUpdateEmail', () => {
  afterEach(() => {
    graphQL.mockRestore();
  });
  it('returns the customer id after sending an email', async () => {
    mockGraphQL(defaultGraphQLResponses());

    const result = await sendPaymentMethodUpdateEmail(
      graphQL,
      customerPaymentMethodId,
      mockEmailInput,
    );

    const mockResponse = defaultGraphQLResponses();

    expect(result).toEqual(
      mockResponse.CustomerPaymentMethodSendUpdateEmail.data
        .customerPaymentMethodSendUpdateEmail,
    );
  });
});
