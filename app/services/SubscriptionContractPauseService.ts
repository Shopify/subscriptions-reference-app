import type pino from 'pino';
import SubscriptionContractPause from '~/graphql/SubscriptionContractPauseMutation';
import type {GraphQLClient} from '~/types';
import {logger} from '~/utils/logger.server';

export class SubscriptionContractPauseService {
  private log: pino.Logger;

  constructor(
    private graphql: GraphQLClient,
    shopDomain: string,
    private subscriptionContractId: string,
  ) {
    this.log = logger.child({shopDomain, subscriptionContractId});
  }

  async run(): Promise<void> {
    try {
      await this.pauseSubscriptionContract();
      this.log.info('SubscriptionContractPauseService completed successfully');
    } catch (error) {
      this.log.error(
        {error},
        `Failed to process SubscriptionContractPauseService`,
      );
      throw error;
    }
  }

  private async pauseSubscriptionContract() {
    const response = await this.graphql(SubscriptionContractPause, {
      variables: {
        subscriptionContractId: this.subscriptionContractId,
      },
    });

    const json = await response.json();
    const subscriptionContractPause = json.data?.subscriptionContractPause;

    if (!subscriptionContractPause) {
      this.log.error(
        'Received invalid response from SubscriptionContractPause mutation. Expected property `subscriptionContractPause`, received ',
        json,
      );
      throw new Error(
        'Failed to cancel subscription via SubscriptionContractPause',
      );
    }

    const {userErrors} = subscriptionContractPause;

    if (userErrors.length !== 0) {
      this.log.error(
        {userErrors},
        'Failed to process SubscriptionContractPause',
      );
      throw new Error(
        'Failed to cancel subscription via SubscriptionContractPause',
      );
    }
  }
}
