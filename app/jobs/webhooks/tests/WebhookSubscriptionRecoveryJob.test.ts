import * as factories from '#/factories';
import prisma from '~/db.server';

import WebhookSubscriptions from '~/graphql/WebhookSubscriptionsQuery';
import {registerWebhooks, unauthenticated} from '~/shopify.server';
import {WebhookSubscriptionRecoveryJob} from '../WebhookSubscriptionRecoveryJob';

import {TEST_SHOP} from '#/constants';
import {afterEach, beforeAll, describe, expect, it, vi} from 'vitest';
import type {Jobs} from '~/types';
import {webhookSubscriptionTopics} from '~/utils/webhookSubscriptionTopics';

vi.mock('~/shopify.server', async () => {
  return {
    unauthenticated: {
      admin: vi.fn(),
    },
    registerWebhooks: vi.fn(),
  };
});

describe('WebhookSubscriptionRecoveryJob', () => {
  beforeAll(async () => {
    await prisma.billingSchedule.deleteMany();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls registerWebhooks if there are missing webhook for a shop', async () => {
    await createShops();
    const graphqlMock = vi.fn();

    vi.spyOn(unauthenticated, 'admin').mockResolvedValue({
      admin: {
        graphql: graphqlMock.mockResolvedValue({
          json: () =>
            Promise.resolve({
              data: {
                webhookSubscriptions: {
                  edges: [
                    {
                      node: {
                        id: 'gid://shopify/WebhookSubscription/1',
                        topic: 'APP_UNINSTALLED',
                      },
                    },
                  ],
                },
              },
            }),
        }),
      },
    } as any);

    const params: Jobs.Parameters<{}> = {
      shop: TEST_SHOP,
      payload: {},
    };

    const job = new WebhookSubscriptionRecoveryJob(params);
    await job.perform();

    expect(graphqlMock).toHaveBeenCalledWith(WebhookSubscriptions, {});
    expect(registerWebhooks).toHaveBeenCalledTimes(1);
  });

  it('does not call registerWebhooks if there are no missing webhook subscriptions for a shop', async () => {
    const graphqlMock = vi.fn();

    vi.spyOn(unauthenticated, 'admin').mockResolvedValue({
      admin: {
        graphql: graphqlMock.mockResolvedValue({
          json: () =>
            Promise.resolve({
              data: {
                webhookSubscriptions: {
                  edges: webhookSubscriptionTopics.map((topic) => ({
                    node: {
                      id: 'gid://shopify/WebhookSubscription/1',
                      topic,
                    },
                  })),
                },
              },
            }),
        }),
      },
    } as any);

    const params: Jobs.Parameters<{}> = {
      shop: TEST_SHOP,
      payload: {},
    };

    const job = new WebhookSubscriptionRecoveryJob(params);
    await job.perform();

    expect(graphqlMock).toHaveBeenCalledWith(WebhookSubscriptions, {});
    expect(registerWebhooks).toHaveBeenCalledTimes(0);
  });

  const createShops = async () => {
    await factories.billingSchedule.create({
      shop: TEST_SHOP,
      hour: 10,
      timezone: 'America/Toronto',
      active: true,
    });
  };
});
