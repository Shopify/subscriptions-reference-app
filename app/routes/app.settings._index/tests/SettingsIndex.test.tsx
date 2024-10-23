import {
  mockShopifyServer,
  mountRemixStubWithAppContext,
  waitForGraphQL,
} from '#/test-utils';
import {screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {UserError} from 'types/admin.types';
import {describe, expect, it, vi} from 'vitest';
import MetaobjectFieldsUpdateMutation from '~/graphql/MetaobjectFieldsUpdateMutation';
import {createMockShopContext} from '~/routes/app.contracts.$id._index/tests/Fixtures';
import SettingsIndex, {action, loader} from '../route';
import type {
  OnFailureTypeType,
  InventoryNotificationFrequencyTypeType,
} from '../validator';
import {mockShopify} from '#/setup-app-bridge';

const mockShopContext = createMockShopContext();
const {graphQL, mockGraphQL} = mockShopifyServer();

vi.stubGlobal('shopify', mockShopify);

const buildServerRequest = (
  payload: {
    retryAttempts: string;
    daysBetweenRetryAttempts: string;
    inventoryRetryAttempts: string;
    inventoryDaysBetweenRetryAttempts: string;
    inventoryOnFailure: string;
    onFailure: string;
    inventoryNotificationFrequency;
  } = {
    retryAttempts: '3',
    daysBetweenRetryAttempts: '5',
    onFailure: 'skip',
    inventoryRetryAttempts: '3',
    inventoryDaysBetweenRetryAttempts: '5',
    inventoryOnFailure: 'skip',
    inventoryNotificationFrequency: 'monthly',
  },
) =>
  new Request('http://foo.bar', {
    method: 'POST',
    body: new URLSearchParams({
      id: 'gid://shopify/Metaobject/1',
      ...payload,
    }),
  });

const buildGraphQLMock = ({
  operation,
  retryAttempts,
  daysBetweenRetryAttempts,
  onFailure,
  inventoryRetryAttempts,
  inventoryDaysBetweenRetryAttempts,
  inventoryOnFailure,
  inventoryNotificationFrequency,
  userErrors = [],
}: {
  operation: 'query' | 'update';
  retryAttempts: number;
  daysBetweenRetryAttempts: number;
  onFailure: OnFailureTypeType;
  inventoryRetryAttempts: number;
  inventoryDaysBetweenRetryAttempts: number;
  inventoryOnFailure: OnFailureTypeType;
  inventoryNotificationFrequency: InventoryNotificationFrequencyTypeType;
  userErrors: UserError[];
}) => ({
  SettingsMetaobject: {
    data: {
      metaobjectByHandle: {
        id: 'gid://shopify/Metaobject/1',
        retryAttempts: {
          value: retryAttempts,
        },
        daysBetweenRetryAttempts: {
          value: daysBetweenRetryAttempts,
        },
        onFailure: {
          value: onFailure,
        },
        inventoryRetryAttempts: {
          value: inventoryRetryAttempts,
        },
        inventoryDaysBetweenRetryAttempts: {
          value: inventoryDaysBetweenRetryAttempts,
        },
        inventoryOnFailure: {
          value: inventoryOnFailure,
        },
        inventoryNotificationFrequency: {
          value: inventoryNotificationFrequency,
        },
        userErrors,
      },
    },
  },
  MetaobjectFieldsUpdateMutation: {
    data: {
      metaobjectUpdate: {
        id: 'gid://shopify/Metaobject/1',
        retryAttempts: {
          value: retryAttempts,
        },
        daysBetweenRetryAttempts: {
          value: daysBetweenRetryAttempts,
        },
        onFailure: {
          value: onFailure,
        },
        inventoryRetryAttempts: {
          value: inventoryRetryAttempts,
        },
        inventoryDaysBetweenRetryAttempts: {
          value: inventoryDaysBetweenRetryAttempts,
        },
        inventoryOnFailure: {
          value: inventoryOnFailure,
        },
        inventoryNotificationFrequency: {
          value: inventoryNotificationFrequency,
        },
        userErrors,
      },
    },
  },
});

describe('loader', () => {
  const request = buildServerRequest();

  describe('when settings can be loaded', () => {
    it('returns the settings', async () => {
      mockGraphQL(
        buildGraphQLMock({
          operation: 'query',
          retryAttempts: 1,
          daysBetweenRetryAttempts: 14,
          onFailure: 'cancel',
          inventoryRetryAttempts: 1,
          inventoryDaysBetweenRetryAttempts: 14,
          inventoryOnFailure: 'skip',
          inventoryNotificationFrequency: 'monthly',
          userErrors: [],
        }),
      );

      const response = await loader({request, context: {}, params: {}});
      const settings = await response.json();

      expect(settings).toEqual({
        settings: {
          id: 'gid://shopify/Metaobject/1',
          retryAttempts: 1,
          daysBetweenRetryAttempts: 14,
          onFailure: 'cancel',
          inventoryRetryAttempts: 1,
          inventoryDaysBetweenRetryAttempts: 14,
          inventoryOnFailure: 'skip',
          inventoryNotificationFrequency: 'monthly',
        },
      });
    });
  });
});

describe('action', () => {
  describe('when the form is invalid', () => {
    it('returns a validation error', async () => {
      const request = buildServerRequest({
        retryAttempts: '1000',
        daysBetweenRetryAttempts: '1000',
        onFailure: 'oh hi mark',
        inventoryRetryAttempts: '1000',
        inventoryDaysBetweenRetryAttempts: '1000',
        inventoryOnFailure: 'oh hi mark',
        inventoryNotificationFrequency: 'aaa',
      });

      const response = await action({request, context: {}, params: {}});

      expect(response.status).toEqual(422);
      expect(await response.json()).toEqual({
        fieldErrors: {
          retryAttempts: 'Number of retry attempts is too high',
          daysBetweenRetryAttempts:
            'Days between payment retry attempts is too high',
          onFailure:
            "Invalid enum value. Expected 'skip' | 'pause' | 'cancel', received 'oh hi mark'",
          inventoryDaysBetweenRetryAttempts:
            'Days between inventory retry attempts is too high',
          inventoryOnFailure:
            "Invalid enum value. Expected 'skip' | 'pause' | 'cancel', received 'oh hi mark'",
          inventoryRetryAttempts:
            'Number of inventory retry attempts is too high',
          inventoryNotificationFrequency:
            "Invalid enum value. Expected 'immediately' | 'weekly' | 'monthly', received 'aaa'",
        },
      });
    });
  });

  describe('when the form is valid', () => {
    it('commits the settings', async () => {
      mockGraphQL(
        buildGraphQLMock({
          operation: 'update',
          retryAttempts: 1,
          daysBetweenRetryAttempts: 14,
          onFailure: 'cancel',
          inventoryRetryAttempts: 1,
          inventoryDaysBetweenRetryAttempts: 14,
          inventoryOnFailure: 'cancel',
          inventoryNotificationFrequency: 'monthly',
          userErrors: [],
        }),
      );

      const request = buildServerRequest();

      const response = await action({request, context: {}, params: {}});
      const settings = await response.json();

      expect(settings).toEqual({
        toast: {
          isError: false,
          message: 'Settings updated',
        },
      });
    });
  });
});

async function mountSettingsIndex(graphQLMock?: any) {
  mockGraphQL(graphQLMock || defaultGraphQLMock());
  mountRemixStubWithAppContext({
    routes: [
      {
        path: `/app/settings`,
        Component: () => <SettingsIndex />,
        loader,
        action,
      },
    ],
    remixStubProps: {
      initialEntries: [`/app/settings`],
    },
    shopContext: mockShopContext,
  });

  // wait for the page to load
  await screen.findByText('Billing attempts');

  const [retryAttemptsInput, inventoryRetryAttemptsInput] =
    screen.getAllByLabelText('Number of retry attempts');
  const [
    daysBetweenRetryAttemptsInput,
    inventoryDaysBetweenRetryAttemptsInput,
  ] = screen.getAllByLabelText('Days between payment retry attempts');
  const [onFailureSelect, inventoryOnFailureSelect] = screen.getAllByLabelText(
    'Action when all retry attempts have failed',
  );
  const inventoryNotificationFrequencySelect = screen.queryByLabelText(
    'Frequency of notifications to staff',
  )!;

  return {
    retryAttemptsInput,
    inventoryRetryAttemptsInput,
    daysBetweenRetryAttemptsInput,
    inventoryDaysBetweenRetryAttemptsInput,
    onFailureSelect,
    inventoryOnFailureSelect,
    inventoryNotificationFrequencySelect,
  };
}

function defaultGraphQLMock() {
  return buildGraphQLMock({
    operation: 'query',
    retryAttempts: 3,
    daysBetweenRetryAttempts: 5,
    onFailure: 'skip',
    inventoryRetryAttempts: 4,
    inventoryDaysBetweenRetryAttempts: 2,
    inventoryOnFailure: 'pause',
    inventoryNotificationFrequency: 'monthly',
    userErrors: [],
  });
}

describe('SettingsIndex', () => {
  describe('when loading settings', () => {
    it('renders the settings form', async () => {
      const {
        retryAttemptsInput,
        daysBetweenRetryAttemptsInput,
        onFailureSelect,
        inventoryRetryAttemptsInput,
        inventoryDaysBetweenRetryAttemptsInput,
        inventoryOnFailureSelect,
        inventoryNotificationFrequencySelect,
      } = await mountSettingsIndex();

      expect(retryAttemptsInput).toHaveValue(3);
      expect(daysBetweenRetryAttemptsInput).toHaveValue(5);

      expect(onFailureSelect).toHaveValue('skip');
      expect(inventoryRetryAttemptsInput).toHaveValue(4);
      expect(inventoryDaysBetweenRetryAttemptsInput).toHaveValue(2);
      expect(inventoryOnFailureSelect).toHaveValue('pause');
      expect(inventoryNotificationFrequencySelect).toHaveValue('monthly');
    });
  });

  describe('when the API does not accept the changes', () => {
    it('shows an error', async () => {
      await mountSettingsIndex({
        ...buildGraphQLMock({
          operation: 'query',
          retryAttempts: 3,
          daysBetweenRetryAttempts: 5,
          onFailure: 'skip',
          inventoryRetryAttempts: 3,
          inventoryDaysBetweenRetryAttempts: 5,
          inventoryOnFailure: 'skip',
          inventoryNotificationFrequency: 'monthly',
          userErrors: [],
        }),
        ...buildGraphQLMock({
          operation: 'update',
          retryAttempts: 3,
          daysBetweenRetryAttempts: 5,
          onFailure: 'skip',
          inventoryRetryAttempts: 3,
          inventoryDaysBetweenRetryAttempts: 5,
          inventoryOnFailure: 'skip',
          inventoryNotificationFrequency: 'monthly',
          userErrors: [
            {
              field: ['daysBetweenRetryAttempts'],
              message: 'Something went wrong',
            },
          ],
        }),
      });

      userEvent.click(screen.getByRole('button', {name: 'Save'}));

      await waitFor(() => {
        expect(window.shopify.toast.show).toHaveBeenCalledWith(
          'Something went wrong',
          {isError: true},
        );
      });
    });
  });

  describe('when updating settings with valid values', () => {
    it('commits the settings', async () => {
      const {
        retryAttemptsInput,
        daysBetweenRetryAttemptsInput,
        onFailureSelect,
        inventoryRetryAttemptsInput,
        inventoryDaysBetweenRetryAttemptsInput,
        inventoryOnFailureSelect,
        inventoryNotificationFrequencySelect,
      } = await mountSettingsIndex();

      await userEvent.clear(retryAttemptsInput);
      await userEvent.type(retryAttemptsInput, '1');

      await userEvent.clear(daysBetweenRetryAttemptsInput);
      await userEvent.type(daysBetweenRetryAttemptsInput, '14');

      await userEvent.selectOptions(onFailureSelect, 'skip');

      await userEvent.clear(inventoryRetryAttemptsInput);
      await userEvent.type(inventoryRetryAttemptsInput, '7');

      await userEvent.clear(inventoryDaysBetweenRetryAttemptsInput);
      await userEvent.type(inventoryDaysBetweenRetryAttemptsInput, '6');

      await userEvent.selectOptions(inventoryOnFailureSelect, 'pause');
      await userEvent.selectOptions(
        inventoryNotificationFrequencySelect,
        'immediately',
      );

      userEvent.click(screen.getByRole('button', {name: 'Save'}));

      await waitForGraphQL();

      expect(graphQL).toHavePerformedGraphQLOperation(
        MetaobjectFieldsUpdateMutation,
        {
          variables: {
            id: 'gid://shopify/Metaobject/1',
            metaobject: {
              fields: [
                {key: 'retryAttempts', value: '1'},
                {key: 'daysBetweenRetryAttempts', value: '14'},
                {key: 'onFailure', value: 'skip'},
                {key: 'inventoryRetryAttempts', value: '7'},
                {key: 'inventoryDaysBetweenRetryAttempts', value: '6'},
                {key: 'inventoryOnFailure', value: 'pause'},
                {key: 'inventoryNotificationFrequency', value: 'immediately'},
              ],
            },
          },
        },
      );
    });
  });
});
