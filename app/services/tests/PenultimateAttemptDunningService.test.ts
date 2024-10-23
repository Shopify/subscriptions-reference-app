import {mockShopifyServer} from '#/test-utils';
import * as factories from '#/factories';
import {DateTime} from 'luxon';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {jobs} from '~/jobs';
import {RebillSubscriptionJob} from '~/jobs/billing/RebillSubscriptionJob';
import {CustomerSendEmailService} from '../CustomerSendEmailService';
import {PenultimateAttemptDunningService} from '../PenultimateAttemptDunningService';
import {SubscriptionContractFailService} from '../SubscriptionContractFailService';

vi.mock('~/jobs', () => {
  const originalModule = vi.importActual('~/jobs');
  return {
    ...originalModule,
    jobs: {
      enqueue: vi.fn(),
    },
  };
});

vi.mock('~/services/SubscriptionContractFailService', async () => {
  const SubscriptionContractFailService = vi.fn();
  SubscriptionContractFailService.prototype.run = vi
    .fn()
    .mockResolvedValue(undefined);

  return {SubscriptionContractFailService};
});

vi.mock('~/services/CustomerSendEmailService', async (importOriginal) => {
  const original: any = await importOriginal();
  const CustomerSendEmailService = vi.fn();
  CustomerSendEmailService.prototype.run = vi.fn().mockResolvedValue(undefined);

  return {...original, CustomerSendEmailService};
});

const shopDomain = 'shop-example.myshopify.com';
const billingAttempt = factories.billingAttempt.build();
const subscriptionContract = factories.contract.build();
const daysBetweenRetryAttempts = 2;
const dunningStatus = 'pause';
const billingCycleIndex = 1;
const finalChargeDate = '2023-12-04';

function defaultGraphQLResponses() {
  return {
    SubscriptionContractCustomerQuery: {
      data: {
        subscriptionContract: {
          customer: {id: subscriptionContract.customer.id},
        },
      },
    },
  };
}

const {graphQL, mockGraphQL} = mockShopifyServer();

describe('PenultimateAttemptDunningService#run', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2023, 11, 2, 14, 0, 23));
  });
  afterEach(() => {
    graphQL.mockRestore();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('schedules RebillSubscriptionJob with the correct parameters', async () => {
    const penultimateAttemptDunningService =
      new PenultimateAttemptDunningService({
        shopDomain,
        subscriptionContract,
        billingAttempt,
        daysBetweenRetryAttempts,
        dunningStatus,
        billingCycleIndex,
      });

    const expectedScheduledTime = DateTime.now()
      .plus({days: daysBetweenRetryAttempts})
      .toSeconds();
    const enqueueSpy = vi.spyOn(jobs, 'enqueue');

    mockGraphQL(defaultGraphQLResponses());

    await penultimateAttemptDunningService.run();

    expect(enqueueSpy).toHaveBeenCalledWith(
      new RebillSubscriptionJob({
        shop: shopDomain,
        payload: {
          subscriptionContractId: subscriptionContract.id,
          originTime: billingAttempt.originTime,
        },
      }),
      {
        scheduleTime: {
          seconds: expectedScheduledTime,
        },
      },
    );
  });

  it('sends final payment failure email', async () => {
    const penultimateAttemptDunningService =
      new PenultimateAttemptDunningService({
        shopDomain,
        subscriptionContract,
        billingAttempt,
        daysBetweenRetryAttempts,
        dunningStatus,
        billingCycleIndex,
      });

    mockGraphQL(defaultGraphQLResponses());

    await penultimateAttemptDunningService.run();

    expect(CustomerSendEmailService.prototype.run).toHaveBeenCalledWith(
      shopDomain,
      subscriptionContract.customer.id,
      {
        subscriptionContractId: subscriptionContract.id,
        subscriptionTemplateName: 'SUBSCRIPTION_PAYMENT_FAILURE_LAST_ATTEMPT',
        dunningStatus: 'PAUSED',
        billingCycleIndex: 1,
        finalChargeDate: finalChargeDate,
      },
    );
  });

  it('fails subscription contract', async () => {
    const penultimateAttemptDunningService =
      new PenultimateAttemptDunningService({
        shopDomain,
        subscriptionContract,
        billingAttempt,
        daysBetweenRetryAttempts,
        dunningStatus,
        billingCycleIndex,
      });

    mockGraphQL(defaultGraphQLResponses());

    const service = new SubscriptionContractFailService(
      shopDomain,
      subscriptionContract.id,
    );

    await penultimateAttemptDunningService.run();

    expect(service.run).toHaveBeenCalledOnce();
  });
});
