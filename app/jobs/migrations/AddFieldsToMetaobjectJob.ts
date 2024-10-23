import type {Jobs} from '~/types';
import {Job} from '~/lib/jobs';
import {unauthenticated} from '~/shopify.server';
import {ensureSettingsMetaobjectDefinitionExists} from '~/models/Settings/Settings.server';

export class AddFieldsToMetaobjectJob extends Job<Jobs.Parameters<{}>> {
  public queue: string = 'migrations';

  async perform(): Promise<void> {
    const {shop} = this.parameters;
    const {admin} = await unauthenticated.admin(shop);
    await ensureSettingsMetaobjectDefinitionExists(admin.graphql);
  }
}
