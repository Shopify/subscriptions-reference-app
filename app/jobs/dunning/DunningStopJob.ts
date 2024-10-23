import prisma from '~/db.server';
import SubscriptionContractResume from '~/graphql/SubscriptionContractResumeMutation';
import {Job} from '~/lib/jobs';
import {markCompleted} from '~/models/DunningTracker/DunningTracker.server';
import {findSubscriptionBillingAttempt} from '~/models/SubscriptionBillingAttempt/SubscriptionBillingAttempt.server';
import {findSubscriptionContractWithBillingCycle} from '~/models/SubscriptionContract/SubscriptionContract.server';
import {unauthenticated} from '~/shopify.server';
import type {Jobs, Webhooks} from '~/types';

export class DunningStopJob extends Job<
  Jobs.Parameters<Webhooks.SubscriptionBillingAttemptSuccess>
> {
  public queue: string = 'webhooks';

  async perform(): Promise<void> {
    const {shop, payload} = this.parameters;
    const {admin_graphql_api_id: billingAttemptId} = payload;
    const {admin_graphql_api_subscription_contract_id: contractId} = payload;

    const dunningTracker = await this.getDunningTracker(
      shop,
      billingAttemptId,
      contractId,
    );

    if (dunningTracker === null) {
      this.logger.info('No DunningTracker found, terminating');
      return;
    }

    await markCompleted(dunningTracker);
    this.logger.info('Completed DunningTracker');

    await this.reactivateFailedContract(shop, contractId);
  }

  async getDunningTracker(
    shop: string,
    billingAttemptId: string,
    contractId: string,
  ) {
    const billingAttempt = await findSubscriptionBillingAttempt(
      shop,
      billingAttemptId,
    );

    const {originTime: date} = billingAttempt;

    const {subscriptionContract, subscriptionBillingCycle} =
      await findSubscriptionContractWithBillingCycle({
        shop,
        contractId,
        date,
      });

    const {cycleIndex: billingCycleIndex} = subscriptionBillingCycle;

    const dunningTracker = await prisma.dunningTracker.findFirst({
      where: {
        shop,
        contractId: subscriptionContract.id,
        billingCycleIndex,
      },
    });

    return dunningTracker;
  }

  async reactivateFailedContract(shop: string, contractId: string) {
    const {admin} = await unauthenticated.admin(shop);
    const response = await admin.graphql(SubscriptionContractResume, {
      variables: {
        subscriptionContractId: contractId,
      },
    });

    const {data} = await response.json();

    if (
      !data?.subscriptionContractActivate ||
      data.subscriptionContractActivate?.userErrors.length > 0
    ) {
      const message = `Failed to reactivate failed subscription contract ${contractId}`;
      const userErrors = data?.subscriptionContractActivate?.userErrors;
      this.logger.warn({userErrors}, message);
      throw Error(message);
    }

    this.logger.info(
      `Successfully reactivated subscription contract ${contractId}`,
    );
  }
}
