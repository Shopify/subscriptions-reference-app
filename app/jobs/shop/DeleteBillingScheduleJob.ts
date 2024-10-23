import type {Jobs, Webhooks} from '~/types';

import prisma from '~/db.server';
import {Job} from '~/lib/jobs';

export class DeleteBillingScheduleJob extends Job<
  Jobs.Parameters<Webhooks.ShopRedact>
> {
  public queue: string = 'webhooks';

  async perform(): Promise<void> {
    const {
      payload: {shop_domain: shop},
    } = this.parameters;

    await prisma.billingSchedule.deleteMany({
      where: {shop},
    });
  }
}
