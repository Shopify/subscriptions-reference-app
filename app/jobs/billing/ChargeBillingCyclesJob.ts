import type {Jobs} from '~/types';

import type {
  SubscriptionBillingCycleBillingAttemptStatus,
  SubscriptionBillingCycleBillingCycleStatus,
  SubscriptionContractSubscriptionStatus,
} from 'types/admin.types';
import ChargeBillingCyclesMutation from '~/graphql/ChargeBillingCyclesMutation';
import {Job} from '~/lib/jobs';
import {unauthenticated} from '~/shopify.server';

export class ChargeBillingCyclesJob extends Job<
  Jobs.Parameters<Jobs.ChargeBillingCyclesPayload>
> {
  public queue: string = 'billing';

  async perform(): Promise<void> {
    const {shop, payload} = this.parameters;
    const {startDate, endDate} = payload;

    const {admin} = await unauthenticated.admin(shop);

    const response = await admin.graphql(ChargeBillingCyclesMutation, {
      variables: {
        startDate,
        endDate,
        contractStatus: ['ACTIVE' as SubscriptionContractSubscriptionStatus],
        billingCycleStatus: [
          'UNBILLED' as SubscriptionBillingCycleBillingCycleStatus,
        ],
        billingAttemptStatus:
          'NO_ATTEMPT' as SubscriptionBillingCycleBillingAttemptStatus,
      },
    });

    const json = await response.json();
    const subscriptionBillingCycleBulkCharge =
      json.data?.subscriptionBillingCycleBulkCharge;

    if (!subscriptionBillingCycleBulkCharge) {
      this.logger.error(
        json,
        'Received invalid response from mutation. Expected property `subscriptionBillingCycleBulkCharge`, received...',
      );

      throw new Error('Failed to process ChargeBillingCyclesJob');
    }

    const {job, userErrors} = subscriptionBillingCycleBulkCharge;

    if (userErrors.length === 0 && job?.id !== undefined) {
      this.logger.info(
        `Created subscriptionBillingCycleBulkCharge job: ${job.id}`,
      );
    } else {
      this.logger.error(
        `Failed to create subscriptionBillingCycleBulkCharge job`,
      );

      throw new Error('Failed to process ChargeBillingCyclesJob');
    }
  }
}
