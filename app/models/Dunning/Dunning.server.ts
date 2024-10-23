import {loadSettingsMetaobject} from '~/models/Settings/Settings.server';
import {findSubscriptionBillingAttempt} from '~/models/SubscriptionBillingAttempt/SubscriptionBillingAttempt.server';
import {findSubscriptionContractWithBillingCycle} from '~/models/SubscriptionContract/SubscriptionContract.server';
import {DunningService} from '~/services/DunningService';
import {InventoryService} from '~/services/InventoryService';
import {unauthenticated} from '~/shopify.server';
import {logger} from '~/utils/logger.server';

interface DunningArgs {
  shopDomain: string;
  billingAttemptId: string;
  failureReason: string;
}

export async function buildDunningService({
  shopDomain,
  billingAttemptId,
  failureReason,
}: DunningArgs): Promise<DunningService> {
  const log = logger.child({class: 'Dunning'});
  const {admin} = await unauthenticated.admin(shopDomain);
  const settings = await loadSettingsMetaobject(admin.graphql);

  if (settings === null) {
    log.error(
      {shopDomain: shopDomain},
      'Failed to load settings from metaobject for shop',
    );

    throw new Error('Failed to load settings from metaobject');
  }

  const billingAttempt = await findSubscriptionBillingAttempt(
    shopDomain,
    billingAttemptId,
  );

  const {
    subscriptionContract: {id: contractId},
    originTime: date,
  } = billingAttempt;

  const {subscriptionContract, subscriptionBillingCycle} =
    await findSubscriptionContractWithBillingCycle({
      shop: shopDomain,
      contractId,
      date,
    });

  return new DunningService({
    shopDomain: shopDomain,
    contract: subscriptionContract,
    billingCycle: subscriptionBillingCycle,
    settings,
    failureReason: failureReason,
  });
}

export async function buildInventoryService({
  shopDomain,
  billingAttemptId,
  failureReason,
}: DunningArgs): Promise<InventoryService> {
  const log = logger.child({class: 'InventoryDunning'});
  const {admin} = await unauthenticated.admin(shopDomain);
  const settings = await loadSettingsMetaobject(admin.graphql);

  if (settings === null) {
    log.error(
      {shopDomain: shopDomain},
      'Failed to load settings from metaobject for shop',
    );

    throw new Error('Failed to load settings from metaobject');
  }

  const billingAttempt = await findSubscriptionBillingAttempt(
    shopDomain,
    billingAttemptId,
  );

  const {
    subscriptionContract: {id: contractId},
    originTime: date,
  } = billingAttempt;

  const {subscriptionContract, subscriptionBillingCycle} =
    await findSubscriptionContractWithBillingCycle({
      shop: shopDomain,
      contractId,
      date,
    });

  return new InventoryService({
    shopDomain: shopDomain,
    contract: subscriptionContract,
    billingCycle: subscriptionBillingCycle,
    settings,
    failureReason: failureReason,
  });
}
