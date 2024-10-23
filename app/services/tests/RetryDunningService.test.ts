import {mockShopifyServer} from '#/test-utils';
import * as factories from '#/factories';
import {DateTime} from 'luxon';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {jobs} from '~/jobs';
import {RebillSubscriptionJob} from '~/jobs/billing/RebillSubscriptionJob';
import {CustomerSendEmailService} from '../CustomerSendEmailService';
import {RetryDunningService} from '../RetryDunningService';
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

vi.mock('~/services/CustomerSendEmailService', async (importOriginal) => {
  const original: any = await importOriginal();
  const CustomerSendEmailService = vi.fn();
  CustomerSendEmailService.prototype.run = vi.fn().mockResolvedValue(undefined);

  return {...original, CustomerSendEmailService};
});

vi.mock('~/services/SubscriptionContractFailService', async () => {
  const SubscriptionContractFailService = vi.fn();
  SubscriptionContractFailService.prototype.run = vi
    .fn()
    .mockResolvedValue(undefined);

  return {SubscriptionContractFailService};
});

const shopDomain = 'shop-example.myshopify.com';
const billingAttempt = factories.billingAttempt.build();
const subscriptionContract = factories.contract.build();
const daysBetweenRetryAttempts = 2;
const billingCycleIndex = 1;

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

describe('RetryDunningService#run', () => {
  afterEach(() => {
    graphQL.mockRestore();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('schedules RebillSubscriptionJob with the correct parameters', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 23, 14, 0, 23));
    const retryDunningService = new RetryDunningService({
      shopDomain,
      subscriptionContract,
      billingAttempt,
      daysBetweenRetryAttempts,
      billingCycleIndex,
      sendCustomerEmail: true,
    });

    const expectedScheduledTime = DateTime.now()
      .plus({days: daysBetweenRetryAttempts})
      .toSeconds();
    const enqueueSpy = vi.spyOn(jobs, 'enqueue');

    mockGraphQL(defaultGraphQLResponses());
    await retryDunningService.run();

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

  it('sends payment failure email', async () => {
    const retryDunningService = new RetryDunningService({
      shopDomain,
      subscriptionContract,
      billingAttempt,
      daysBetweenRetryAttempts,
      billingCycleIndex,
      sendCustomerEmail: true,
    });

    mockGraphQL(defaultGraphQLResponses());
    await retryDunningService.run();

    expect(CustomerSendEmailService.prototype.run).toHaveBeenCalledWith(
      shopDomain,
      subscriptionContract.customer.id,
      {
        subscriptionContractId: subscriptionContract.id,
        subscriptionTemplateName: 'SUBSCRIPTION_PAYMENT_FAILURE_RETRY',
        billingCycleIndex,
      },
    );
  });

  it('fails subscription contract', async () => {
    const retryDunningService = new RetryDunningService({
      shopDomain,
      subscriptionContract,
      billingAttempt,
      daysBetweenRetryAttempts,
      billingCycleIndex,
      sendCustomerEmail: true,
    });

    mockGraphQL(defaultGraphQLResponses());
    const service = new SubscriptionContractFailService(
      shopDomain,
      subscriptionContract.id,
    );

    await retryDunningService.run();

    expect(service.run).toHaveBeenCalledOnce();
  });
});
