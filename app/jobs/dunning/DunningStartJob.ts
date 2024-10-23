import type {Jobs, Webhooks} from '~/types';
import type {SubscriptionBillingAttemptErrorCodeType} from '~/types/webhooks';

import {Job} from '~/lib/jobs';
import {
  buildDunningService,
  buildInventoryService,
} from '~/models/Dunning/Dunning.server';
import {SubscriptionBillingAttemptErrorCode} from '~/types/webhooks';
import {logger} from '~/utils/logger.server';

export class DunningStartJob extends Job<
  Jobs.Parameters<Webhooks.SubscriptionBillingAttemptFailure>
> {
  public queue: string = 'webhooks';

  async perform(): Promise<void> {
    const {shop, payload} = this.parameters;

    const {admin_graphql_api_id: billingAttemptId, error_code: failureReason} =
      payload;

    let result = '';
    const errorCode = failureReason as SubscriptionBillingAttemptErrorCodeType;

    if (
      errorCode === SubscriptionBillingAttemptErrorCode.InsufficientInventory ||
      errorCode ===
        SubscriptionBillingAttemptErrorCode.InventoryAllocationsNotFound
    ) {
      const inventoryService = await buildInventoryService({
        shopDomain: shop,
        billingAttemptId,
        failureReason,
      });

      result = await inventoryService.run();
      logger.info({result}, 'Completed Unavailable Inventory error');
    } else {
      const dunningService = await buildDunningService({
        shopDomain: shop,
        billingAttemptId,
        failureReason,
      });

      result = await dunningService.run();
      logger.info({result}, 'Completed DunningService');
    }
  }
}
