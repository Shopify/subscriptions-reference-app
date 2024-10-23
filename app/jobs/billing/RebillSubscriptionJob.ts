import type {Jobs} from '~/types';

import SubscriptionBillingCycleChargeMutation from '~/graphql/SubscriptionBillingCycleChargeMutation';
import {Job} from '~/lib/jobs';
import {getContractDetailsForRebilling} from '~/models/SubscriptionContract/SubscriptionContract.server';
import {unauthenticated} from '~/shopify.server';

export class RebillSubscriptionJob extends Job<
  Jobs.Parameters<Jobs.RebillSubscriptionJobPayload>
> {
  public queue: string = 'rebilling';

  async perform(): Promise<void> {
    const {shop, payload} = this.parameters;
    const {subscriptionContractId, originTime} = payload;
    const {admin} = await unauthenticated.admin(shop);

    const subscriptionContract = await getContractDetailsForRebilling(
      admin.graphql,
      subscriptionContractId,
    );

    if (subscriptionContract.lastPaymentStatus === 'SUCCEEDED') {
      this.logger.info(
        `Terminating ${this.constructor.name}, subscription contract already billed successfully`,
      );
      return;
    }

    const response = await admin.graphql(
      SubscriptionBillingCycleChargeMutation,
      {
        variables: {
          subscriptionContractId: subscriptionContractId,
          originTime: originTime,
        },
      },
    );

    const json = await response.json();
    const subscriptionBillingCycleCharge =
      json.data?.subscriptionBillingCycleCharge;

    if (!subscriptionBillingCycleCharge) {
      this.logger.error(
        json,
        'Received invalid response from mutation. Expected property `subscriptionBillingCycleCharge`, received:',
      );

      throw new Error('Failed to process RebillSubscriptionJob');
    } else {
      this.logger.info('Rebill Job successfully enqueued for shop');
    }

    const {userErrors} = subscriptionBillingCycleCharge;
    if (userErrors.length === 0) {
      this.logger.info(
        'Successfully called subscriptionBillingCycleCharge mutation',
      );
    } else if (
      userErrors.some(
        (error) =>
          error.code === 'CONTRACT_PAUSED' ||
          error.code === 'CONTRACT_TERMINATED',
      )
    ) {
      this.logger.warn(
        {subscriptionContractId, userErrors},
        'SubscriptionContract status not active or failed, terminating RebillSubscriptionJob',
      );
    } else {
      this.logger.error(
        {shop, originTime, subscriptionContractId, userErrors},
        'Failed to call subscriptionBillingCycleCharge mutation',
      );

      throw new Error('Failed to process RebillSubscriptionJob');
    }
  }
}
