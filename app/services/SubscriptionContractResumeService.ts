import type pino from 'pino';
import SubscriptionContractResume from '~/graphql/SubscriptionContractResumeMutation';
import type {GraphQLClient} from '~/types';
import {logger} from '~/utils/logger.server';

export class SubscriptionContractResumeService {
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
      await this.resumeSubscriptionContract();
      this.log.info('SubscriptionContractResumeService completed successfully');
    } catch (error) {
      this.log.error(
        {error},
        `Failed to process SubscriptionContractResumeService`,
      );
      throw error;
    }
  }

  private async resumeSubscriptionContract() {
    const response = await this.graphql(SubscriptionContractResume, {
      variables: {
        subscriptionContractId: this.subscriptionContractId,
      },
    });

    const json = await response.json();
    const subscriptionContractActivate =
      json.data?.subscriptionContractActivate;

    if (!subscriptionContractActivate) {
      this.log.error(
        'Received invalid response from SubscriptionContractActivate mutation. Expected property `subscriptionContractActivate`, received ',
        json,
      );
      throw new Error(
        'Failed to resume subscription via subscriptionContractActivate',
      );
    }

    const {userErrors} = subscriptionContractActivate;

    if (userErrors.length !== 0) {
      this.log.error(
        {userErrors},
        'Failed to process SubscriptionContractResumeService',
      );
      throw new Error(
        'Failed to resume subscription via SubscriptionContractResumeService',
      );
    }
  }
}
