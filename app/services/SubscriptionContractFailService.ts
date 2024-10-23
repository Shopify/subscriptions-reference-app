import type pino from 'pino';
import SubscriptionContractFailMutation from '~/graphql/SubscriptionContractFailMutation';
import {unauthenticated} from '~/shopify.server';
import {logger} from '~/utils/logger.server';

export class SubscriptionContractFailService {
  private log: pino.Logger;

  constructor(
    private shopDomain: string,
    private subscriptionContractId: string,
  ) {
    this.log = logger.child({shopDomain, subscriptionContractId});
  }

  async run(): Promise<void> {
    try {
      await this.failSubscriptionContract();
      this.log.info('SubscriptionContractFailService completed successfully');
    } catch (error) {
      this.log.error(
        {error},
        `Failed to process SubscriptionContractFailService`,
      );
      throw error;
    }
  }

  private async failSubscriptionContract() {
    const {admin} = await unauthenticated.admin(this.shopDomain);

    const response = await admin.graphql(SubscriptionContractFailMutation, {
      variables: {
        subscriptionContractId: this.subscriptionContractId,
      },
    });

    const json = await response.json();
    const subscriptionContractFail = json.data?.subscriptionContractFail;

    if (!subscriptionContractFail) {
      this.log.error(
        'Received invalid response from SubscriptionContractFail mutation. Expected property `subscriptionContractFail`, received ',
        json,
      );
      throw new Error(
        'Failed to fail subscription via SubscriptionContractFail',
      );
    }

    const {userErrors} = subscriptionContractFail;

    if (userErrors.length !== 0) {
      this.log.error(
        {userErrors},
        'Failed to process SubscriptionContractFail',
      );
      throw new Error(
        'Failed to fail subscription via SubscriptionContractFail',
      );
    }
  }
}
