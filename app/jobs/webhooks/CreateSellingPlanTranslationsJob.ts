import type {Jobs, RecurringPolicy, Webhooks} from '~/types';
import {Job} from '~/lib/jobs';
import {createSellingPlanTranslations} from '~/models/SellingPlan/SellingPlan.server';
import {unauthenticated} from '~/shopify.server';
import {getShopLocales} from '~/models/Translations/Translations.server';
import {getShopInfos} from '~/models/ShopInfo/ShopInfo.server';
import type {SellingPlanPricingPolicy} from '~/types/plans';
import SellingPlanTranslations from '~/graphql/SellingPlanTranslationsQuery';
import {nodesFromEdges} from '@shopify/admin-graphql-api-utilities';
import {env} from '../../../config';

export class CreateSellingPlanTranslationsJob extends Job<
  Jobs.Parameters<Webhooks.SellingPlanGroups>
> {
  public queue: string = 'webhooks';

  async perform(): Promise<void> {
    const {shop, payload} = this.parameters;
    const {
      admin_graphql_api_id: sellingPlanGroupId,
      admin_graphql_api_app: appGid,
    } = payload;

    if (appGid !== env.appGID) {
      this.logger.info(
        {
          subscriptionAppID: env.appGID,
          sourceAppID: appGid,
        },
        'Not creating translation since event is not from subscriptions app',
      );
      return;
    }

    const {admin} = await unauthenticated.admin(shop);
    const {shopLocalesWithoutPrimary} = await getShopLocales(admin.graphql);

    const {shop: shopInfo} = await getShopInfos(admin.graphql);

    const response = await admin.graphql(SellingPlanTranslations, {
      variables: {
        id: sellingPlanGroupId,
      },
    });

    const json = await response.json();
    const {data} = json;

    if (!data || !data.sellingPlanGroup) {
      this.logger.warn({sellingPlanGroupId}, 'No selling plan group found');
      return;
    }
    const sellingPlanNodes = nodesFromEdges(
      data?.sellingPlanGroup?.sellingPlans.edges || [],
    );

    const sellingPlans = sellingPlanNodes.map((plan) => ({
      id: plan.id,
      pricingPolicies: plan.pricingPolicies as SellingPlanPricingPolicy[],
      deliveryPolicy: plan.deliveryPolicy as RecurringPolicy,
    }));

    await createSellingPlanTranslations(
      admin.graphql,
      sellingPlans,
      shopLocalesWithoutPrimary,
      shopInfo.currencyCode,
    );
  }
}
