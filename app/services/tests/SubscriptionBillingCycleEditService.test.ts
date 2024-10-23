import {mockShopifyServer} from '#/test-utils';
import {faker} from '@faker-js/faker';
import {composeGid} from '@shopify/admin-graphql-api-utilities';
import {describe, expect, afterEach, it} from 'vitest';
import {skipOrResumeBillingCycle} from '../SubscriptionBillingCycleEditService';

function MOCK_SKIPPED_SUCCESS_RESPONSE() {
  return {
    SubscriptionBillingCycleScheduleEdit: {
      data: {
        subscriptionBillingCycleScheduleEdit: {
          billingCycle: {
            skipped: true,
          },
          userErrors: [],
        },
      },
    },
  };
}

function MOCK_RESUMED_SUCCESS_RESPONSE() {
  return {
    SubscriptionBillingCycleScheduleEdit: {
      data: {
        subscriptionBillingCycleScheduleEdit: {
          billingCycle: {
            skipped: false,
          },
          userErrors: [],
        },
      },
    },
  };
}

function MOCK_SKIP_FAILED_RESPONSE() {
  return {
    SubscriptionBillingCycleScheduleEdit: {
      data: {
        subscriptionBillingCycleScheduleEdit: {
          billingCycle: {
            skipped: false,
          },
          userErrors: [
            {
              field: 'skip',
              message: 'Cannot skip billing cycle',
            },
          ],
        },
      },
    },
  };
}

const subscriptionContractId = composeGid(
  'SubscriptionContract',
  faker.string.uuid(),
);
const billingCycleIndex = faker.number.int({min: 1, max: 9999999});
const {graphQL, mockGraphQL} = mockShopifyServer();

describe('skipOrResumeBillingCycle', () => {
  afterEach(() => {
    graphQL.mockRestore();
  });
  it('returns the status of the billing cycle if skip is successful', async () => {
    const skip = 'skip';

    mockGraphQL(MOCK_SKIPPED_SUCCESS_RESPONSE());

    const result = await skipOrResumeBillingCycle(
      graphQL,
      subscriptionContractId,
      billingCycleIndex,
      skip,
    );

    const mockResponse = MOCK_SKIPPED_SUCCESS_RESPONSE();

    expect(result).toEqual(
      mockResponse.SubscriptionBillingCycleScheduleEdit.data
        .subscriptionBillingCycleScheduleEdit,
    );
  });

  it('returns the status of the billing cycle if resume is successful', async () => {
    const skip = 'resume';

    mockGraphQL(MOCK_RESUMED_SUCCESS_RESPONSE());

    const result = await skipOrResumeBillingCycle(
      graphQL,
      subscriptionContractId,
      billingCycleIndex,
      skip,
    );

    const mockResponse = MOCK_RESUMED_SUCCESS_RESPONSE();

    expect(result).toEqual(
      mockResponse.SubscriptionBillingCycleScheduleEdit.data
        .subscriptionBillingCycleScheduleEdit,
    );
  });

  it('throws an error if skip is unsuccessful', async () => {
    const skip = 'skip';

    mockGraphQL(MOCK_SKIP_FAILED_RESPONSE());

    const result = await skipOrResumeBillingCycle(
      graphQL,
      subscriptionContractId,
      billingCycleIndex,
      skip,
    );

    const mockResponse = MOCK_SKIP_FAILED_RESPONSE();

    expect(result).toEqual(
      mockResponse.SubscriptionBillingCycleScheduleEdit.data
        .subscriptionBillingCycleScheduleEdit,
    );
  });

  it('throws an error if the response is missing data', async () => {
    const skip = 'skip';

    mockGraphQL({
      SubscriptionBillingCycleScheduleEdit: null,
    });

    await expect(
      skipOrResumeBillingCycle(
        graphQL,
        subscriptionContractId,
        billingCycleIndex,
        skip,
      ),
    ).rejects.toThrowError();
  });
});
