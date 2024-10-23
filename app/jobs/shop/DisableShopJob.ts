import db from '~/db.server';
import ShopQuery from '~/graphql/ShopQuery';
import {Job} from '~/lib/jobs';
import {unauthenticated} from '~/shopify.server';
import type {Jobs} from '~/types';

export class DisableShopJob extends Job<Jobs.Parameters<{}>> {
  public queue: string = 'webhooks';

  async perform(): Promise<void> {
    const {shop} = this.parameters;

    if (await this.appInstalled(shop)) {
      this.logger.info('App is installed, skipping disableShop');
      return;
    }

    await this.disableShop(shop);
  }

  private async disableShop(shop) {
    await db.session.deleteMany({where: {shop}});
    await db.billingSchedule.updateMany({where: {shop}, data: {active: false}});
  }

  private async appInstalled(shop) {
    const {admin} = await unauthenticated.admin(shop);

    try {
      await admin.graphql(ShopQuery);
    } catch (error) {
      if ((error as any)?.response?.code == 401) {
        return false;
      }
      throw error;
    }

    return true;
  }
}
