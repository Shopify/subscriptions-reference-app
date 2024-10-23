import type {Jobs, Webhooks} from '~/types';
import type {SubscriptionBillingAttemptErrorCodeType} from '~/types/webhooks';

import {Job} from '~/lib/jobs';
import {buildDunningService} from '~/models/Dunning/Dunning.server';
import {InventoryService} from '~/services/InventoryService';
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

    let result = "";
    const errorCode = failureReason as SubscriptionBillingAttemptErrorCodeType;
    switch(errorCode) {
      // Inventory Error
      case SubscriptionBillingAttemptErrorCode.InsufficientInventory:
      case SubscriptionBillingAttemptErrorCode.InventoryAllocationsNotFound:
        const inventoryService = new InventoryService({failureReason});
        result = await inventoryService.run();
        logger.info({result}, 'Completed Unavailable Inventory error');
        break;

      // Billing Error
      default:
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
