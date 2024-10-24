import type pino from 'pino';
import OrderTagsAddMutation from '~/graphql/OrderTagsAddMutation';
import {unauthenticated} from '~/shopify.server';
import {logger} from '~/utils/logger.server';

export class AddOrderTagsService {
  private log: pino.Logger;

  constructor(
    private shopDomain: string,
    private orderId: string,
  ) {
    this.log = logger.child({shopDomain, orderId});
  }

  async run(tags: string[]): Promise<void> {
    const {admin} = await unauthenticated.admin(this.shopDomain);
    const response = await admin.graphql(OrderTagsAddMutation, {
      variables: {
        id: this.orderId,
        tags: tags,
      },
    });

    const json = await response.json();
    const orderTagsAdd = json.data?.tagsAdd;

    if (!orderTagsAdd) {
      this.log.error(
        'Received invalid response from tagsAdd mutation. Expected property `tagdsAdd`, received ',
        json,
      );
      throw new Error('Failed to add tags to order in AddOrderTagsService');
    }

    const userErrors = orderTagsAdd.userErrors;

    if (userErrors.length !== 0) {
      this.log.error({userErrors}, 'Failed to process AddOrderTagsService');
      throw new Error('Failed to add tags to order in AddOrderTagsService');
    }

    this.log.info('AddOrderTagsService completed successfully');
  }
}
