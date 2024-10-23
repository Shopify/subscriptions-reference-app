import {unauthenticated} from '~/shopify.server';
import {logger} from '~/utils/logger.server';

export class MerchantSendSubscriptionInventoryEmailService {
  async run(shopDomain: string): Promise<boolean> {
    const log = logger.child({shopDomain});
    log.info('Running MerchantSendSubscriptionInventoryEmailService');

    await unauthenticated.admin(shopDomain);
    return true;
  }
}
