import {nodesFromEdges} from '@shopify/admin-graphql-api-utilities';
import type {
  WebhookSubscription,
  WebhookSubscriptionTopic,
} from 'types/admin.types';
import WebhookSubscriptions from '~/graphql/WebhookSubscriptionsQuery';
import {Job} from '~/lib/jobs';
import {registerWebhooks, unauthenticated} from '~/shopify.server';
import type {Jobs} from '~/types/index';
import {logger} from '~/utils/logger.server';
import {webhookSubscriptionTopics} from '~/utils/webhookSubscriptionTopics';

export class WebhookSubscriptionRecoveryJob extends Job<Jobs.Parameters<{}>> {
  async perform(): Promise<void> {
    const {shop} = this.parameters;
    logger.info(`Processing webhook recovery for shop ${shop}`);

    const missingWebhooks = await this.getMissingWebhooks(shop);
    if (!missingWebhooks.length) return;

    await this.registerMissingWebhooks(shop);
    logger.info(`Registered ${missingWebhooks.join(', ')} for shop ${shop}`);
  }

  private async getMissingWebhooks(shop: string): Promise<string[]> {
    const {admin} = await unauthenticated.admin(shop);

    const response = await admin.graphql(WebhookSubscriptions, {});
    const json = await response.json();
    const webhookSubscriptions = json.data?.webhookSubscriptions;

    if (!webhookSubscriptions) {
      logger.error(
        json,
        'Received invalid response from mutation. Expected property `webhookSubscriptions`, received:',
      );

      throw new Error('Failed to process WebhookSubscriptionsQuery');
    }

    const registeredWebhooks = nodesFromEdges<
      Pick<WebhookSubscription, 'id' | 'topic'>
    >(webhookSubscriptions.edges).map((node) => node.topic);

    const missingWebhooks = webhookSubscriptionTopics.filter(
      (topic) =>
        !Object.values(registeredWebhooks).includes(
          topic as WebhookSubscriptionTopic,
        ),
    );
    return missingWebhooks;
  }

  private async registerMissingWebhooks(shop: string): Promise<void> {
    const {session} = await unauthenticated.admin(shop);

    await registerWebhooks({session});
  }
}
