import {mockShopifyServer} from '#/test-utils';
import {describe, expect, it} from 'vitest';
import MetaobjectFieldsUpdateMutation from '~/graphql/MetaobjectFieldsUpdateMutation';
import {authenticate} from '~/shopify.server';
import {updateSettingsMetaobject} from '../Settings.server';

const {graphQL, mockGraphQL} = mockShopifyServer();

describe('Settings', () => {
  describe('updateSettingsMetaobject', () => {
    it('updates the settings and returns userErrors', async () => {
      const userErrors = [
        {
          field: ['retryAttempts'],
          message: 'Retry attempts must be a number',
        },
      ];

      mockGraphQL({
        MetaobjectFieldsUpdateMutation: {
          data: {
            metaobjectUpdate: {
              userErrors,
            },
          },
        },
      });

      const {admin} = await authenticate.admin(new Request('https://foo.bar'));

      const result = await updateSettingsMetaobject(admin.graphql, {
        id: 'gid://shopify/Metaobject/1',
        retryAttempts: 3,
        daysBetweenRetryAttempts: 7,
        onFailure: 'cancel',
        inventoryRetryAttempts: 3,
        inventoryDaysBetweenRetryAttempts: 7,
        inventoryOnFailure: 'skip',
        inventoryNotificationFrequency: 'monthly',
      });

      expect(result).toEqual({userErrors});
      expect(graphQL).toHavePerformedGraphQLOperation(
        MetaobjectFieldsUpdateMutation,
        {
          variables: {
            id: 'gid://shopify/Metaobject/1',
            metaobject: {
              fields: [
                {key: 'retryAttempts', value: '3'},
                {key: 'daysBetweenRetryAttempts', value: '7'},
                {key: 'onFailure', value: 'cancel'},
              ],
            },
          },
        },
      );
    });
  });
});
