import type {Jobs} from '~/types';

import {Job} from '~/lib/jobs';
import {AddOrderTagsService} from '~/services/AddOrderTagsService';

export class TagSubscriptionOrderJob extends Job<
  Jobs.Parameters<Jobs.TagSubscriptionsOrderPayload>
> {
  public queue: string = 'webhooks';

  async perform(): Promise<void> {
    const {shop, payload} = this.parameters;

    if (payload.orderId !== null) {
      await new AddOrderTagsService(shop, payload.orderId).run(payload.tags);
    } else {
      this.logger.info(
        `No order ID in the webhook payload terminating ${this.constructor.name}`,
      );
    }
  }
}
