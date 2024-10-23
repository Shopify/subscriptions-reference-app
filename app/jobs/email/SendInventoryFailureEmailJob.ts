import type {Jobs} from '~/types';
import {Job} from '~/lib/jobs';
import {MerchantSendSubscriptionInventoryEmailService} from '~/services/MerchantSendSubscriptionInventoryEmailService';

export class SendInventoryFailureEmailJob extends Job<Jobs.Parameters<{}>> {
  public queue: string = 'default';

  async perform(): Promise<void> {
    const {shop} = this.parameters;

    await new MerchantSendSubscriptionInventoryEmailService().run(shop);
  }
}
