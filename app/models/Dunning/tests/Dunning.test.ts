import {mockShopifyServer} from '#/test-utils';
import {afterEach, describe, expect, it, vi} from 'vitest';
import * as factories from '#/factories';
import {findSubscriptionBillingAttempt} from '~/models/SubscriptionBillingAttempt/SubscriptionBillingAttempt.server';
import {findSubscriptionContractWithBillingCycle} from '~/models/SubscriptionContract/SubscriptionContract.server';
import {TEST_SHOP} from '#/constants';
import {loadSettingsMetaobject} from '~/models/Settings/Settings.server';
import {buildDunningService} from '../Dunning.server';

mockShopifyServer();

vi.mock(
  '~/models/SubscriptionBillingAttempt/SubscriptionBillingAttempt.server',
  () => {
    const findSubscriptionBillingAttempt = vi.fn();
    return {findSubscriptionBillingAttempt};
  },
);
vi.mock('~/models/SubscriptionContract/SubscriptionContract.server', () => {
  const findSubscriptionContractWithBillingCycle = vi.fn();
  return {findSubscriptionContractWithBillingCycle};
});
vi.mock('~/models/Settings/Settings.server.ts', () => {
  return {loadSettingsMetaobject: vi.fn()};
});

describe('Dunning', () => {
  afterEach(async () => {
    vi.restoreAllMocks();
  });

  describe('buildDunningService', () => {
    it('returns a valid instance of DunningService', async () => {
      vi.mocked(findSubscriptionBillingAttempt).mockResolvedValue(
        factories.billingAttempt.build(),
      );

      const subscriptionContract = factories.contract.build();
      const subscriptionBillingCycle = factories.billingCycle.build();

      vi.mocked(findSubscriptionContractWithBillingCycle).mockResolvedValue({
        subscriptionContract,
        subscriptionBillingCycle,
      });

      const settings = factories.settings.build();
      vi.mocked(loadSettingsMetaobject).mockResolvedValue(settings);

      const dunning = await buildDunningService({
        shopDomain: TEST_SHOP,
        billingAttemptId: 'gid://shopify/SubscriptionBillingAttempt/1',
        failureReason: 'CARD_EXPIRED',
      });

      expect(dunning.constructor.name).toContain('DunningService');
      expect(dunning.contract).toEqual(subscriptionContract);
      expect(dunning.billingCycle).toEqual(subscriptionBillingCycle);
      expect(dunning.failureReason).toEqual('CARD_EXPIRED');
    });
  });
});
