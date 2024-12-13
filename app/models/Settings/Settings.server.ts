import type {GraphQLClient, Settings, SettingsMetaobject} from '~/types';
import {
  MetaobjectRepository,
  MetafieldType,
  type NonNullMetaobjectField,
} from '~/utils/metaobjects';
import {logger} from '~/utils/logger.server';

import type {
  MetaobjectDefinitionCreateMutationVariables,
  SettingsMetaobjectQuery,
} from 'types/admin.generated';
import type {
  MetaobjectAdminAccessInput,
  MetaobjectStorefrontAccess,
} from 'types/admin.types';
import MetaobjectFieldsUpdateMutation from '~/graphql/MetaobjectFieldsUpdateMutation';
import {
  OnFailureType,
  type OnFailureTypeType,
  type OnInventoryFailureTypeType,
  type InventoryNotificationFrequencyTypeType,
} from '~/routes/app.settings._index/validator';

export const SETTINGS_METAOBJECT_HANDLE = {
  type: '$app:settings',
  handle: 'subscription_settings',
};

export const SETTINGS_METAOBJECT_DEFINITION: MetaobjectDefinitionCreateMutationVariables =
  {
    definition: {
      name: 'Settings',
      description: 'Subscription app settings',
      type: SETTINGS_METAOBJECT_HANDLE.type,
      access: {
        admin: 'MERCHANT_READ' as MetaobjectAdminAccessInput,
        storefront: 'NONE' as MetaobjectStorefrontAccess,
      },
      fieldDefinitions: [
        {
          key: 'retryAttempts',
          type: 'number_integer',
          name: 'Retry attempts',
          description: 'Number of retry attempts',
          required: true,
          validations: [],
        },
        {
          key: 'daysBetweenRetryAttempts',
          type: 'number_integer',
          name: 'Days between',
          description: 'Days between payment retry attempts',
          required: true,
          validations: [],
        },
        {
          key: 'onFailure',
          type: 'single_line_text_field',
          name: 'On failure',
          description: 'Action when all retry attempts have failed',
          required: true,
          validations: [],
        },
        {
          key: 'inventoryDaysBetweenRetryAttempts',
          type: 'number_integer',
          name: 'Days between inventory',
          description: 'Days between retry attempts for inventory errors',
          required: true,
          validations: [],
        },
        {
          key: 'inventoryRetryAttempts',
          type: 'number_integer',
          name: 'Retry attempts',
          description: 'Number of retry attempts for inventory errors',
          required: true,
          validations: [],
        },
        {
          key: 'inventoryOnFailure',
          type: 'single_line_text_field',
          name: 'On failure',
          description: 'Action when all retry attempts have failed',
          required: true,
          validations: [],
        },
        {
          key: 'inventoryNotificationFrequency',
          type: 'single_line_text_field',
          name: 'Notification frequency',
          description: 'Notification frequency for inventory errors',
          required: true,
          validations: [],
        },
      ],
    },
  };

const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_DAYS_BETWEEN_RETRY_ATTEMPTS = 7;
const DEFAULT_ON_FAILURE = OnFailureType.cancel;
const DEFAULT_INVENTORY_DAYS_BETWEEN_RETRY_ATTEMPTS = 1;
const DEFAULT_INVENTORY_RETRY_ATTEMPTS = 5;
const DEFAULT_INVENTORY_ON_FAILURE = 'skip';
const DEFAULT_INVENTORY_NOTIFICATION_FREQUENCY = 'weekly';

export const SETTINGS_METAOBJECT_FIELDS: NonNullMetaobjectField[] = [
  {
    key: 'retryAttempts',
    value: DEFAULT_RETRY_ATTEMPTS,
    valueType: MetafieldType.NUMBER_INTEGER,
  },
  {
    key: 'daysBetweenRetryAttempts',
    value: DEFAULT_DAYS_BETWEEN_RETRY_ATTEMPTS,
    valueType: MetafieldType.NUMBER_INTEGER,
  },
  {
    key: 'onFailure',
    value: DEFAULT_ON_FAILURE,
    valueType: MetafieldType.SINGLE_LINE_TEXT_FIELD,
  },
  {
    key: 'inventoryDaysBetweenRetryAttempts',
    value: DEFAULT_INVENTORY_DAYS_BETWEEN_RETRY_ATTEMPTS,
    valueType: MetafieldType.NUMBER_INTEGER,
  },
  {
    key: 'inventoryRetryAttempts',
    value: DEFAULT_INVENTORY_RETRY_ATTEMPTS,
    valueType: MetafieldType.NUMBER_INTEGER,
  },
  {
    key: 'inventoryOnFailure',
    value: DEFAULT_INVENTORY_ON_FAILURE,
    valueType: MetafieldType.SINGLE_LINE_TEXT_FIELD,
  },
  {
    key: 'inventoryNotificationFrequency',
    value: DEFAULT_INVENTORY_NOTIFICATION_FREQUENCY,
    valueType: MetafieldType.SINGLE_LINE_TEXT_FIELD,
  },
];

export async function ensureSettingsMetaobjectDefinitionExists(
  graphqlClient: GraphQLClient,
) {
  const repository = new MetaobjectRepository(graphqlClient);
  await repository.createOrUpdateMetaobjectDefinition(
    SETTINGS_METAOBJECT_DEFINITION.definition,
  );
  await repository.createOrUpdateMetaobjectFields({
    handle: SETTINGS_METAOBJECT_HANDLE,
    fields: SETTINGS_METAOBJECT_FIELDS,
  });
}

export async function ensureSettingsMetaobjectExists(
  graphqlClient: GraphQLClient,
  shopDomain: string,
) {
  const settingsObject = await loadSettingsMetaobject(graphqlClient);

  if (settingsObject) {
    return;
  }

  return await createSettingsMetaobject(graphqlClient, shopDomain);
}

export async function loadSettingsMetaobject(
  graphqlClient: GraphQLClient,
): Promise<Settings> {
  const response = await graphqlClient(
    `#graphql
      query SettingsMetaobject($handle: MetaobjectHandleInput!) {
        metaobjectByHandle(handle: $handle) {
          id
          retryAttempts: field(key: "retryAttempts") {
            value
          }
          daysBetweenRetryAttempts: field(key: "daysBetweenRetryAttempts") {
            value
          }
          onFailure: field(key: "onFailure") {
            value
          }
          inventoryRetryAttempts: field(key: "inventoryRetryAttempts") {
            value
          }
          inventoryDaysBetweenRetryAttempts: field(key: "inventoryDaysBetweenRetryAttempts") {
            value
          }
          inventoryOnFailure: field(key: "inventoryOnFailure") {
            value
          }
          inventoryNotificationFrequency: field(key: "inventoryNotificationFrequency") {
            value
          }
        }
      }
    `,
    {
      variables: {
        handle: SETTINGS_METAOBJECT_HANDLE,
      },
    },
  );

  const {data} = (await response.json()) as SettingsMetaobjectQuery as {
    data: {metaobjectByHandle: SettingsMetaobject};
  };

  let settingsMetaobject: SettingsMetaobject | undefined =
    data?.metaobjectByHandle;

  if (!settingsMetaobject) {
    await ensureSettingsMetaobjectDefinitionExists(graphqlClient);
    settingsMetaobject = await createSettingsMetaobject(graphqlClient);
  }

  return settingsValuesFromMetaobject(settingsMetaobject);
}

export async function updateSettingsMetaobject(
  graphqlClient: GraphQLClient,
  {
    id,
    retryAttempts,
    daysBetweenRetryAttempts,
    onFailure,
    inventoryRetryAttempts,
    inventoryDaysBetweenRetryAttempts,
    inventoryOnFailure,
    inventoryNotificationFrequency,
  }: Settings,
) {
  const response = await graphqlClient(MetaobjectFieldsUpdateMutation, {
    variables: {
      id,
      metaobject: {
        fields: [
          {key: 'retryAttempts', value: retryAttempts.toString()},
          {
            key: 'daysBetweenRetryAttempts',
            value: daysBetweenRetryAttempts.toString(),
          },
          {key: 'onFailure', value: onFailure},
          {
            key: 'inventoryRetryAttempts',
            value: inventoryRetryAttempts.toString(),
          },
          {
            key: 'inventoryDaysBetweenRetryAttempts',
            value: inventoryDaysBetweenRetryAttempts.toString(),
          },
          {key: 'inventoryOnFailure', value: inventoryOnFailure},
          {
            key: 'inventoryNotificationFrequency',
            value: inventoryNotificationFrequency,
          },
        ],
      },
    },
  });

  const json = await response.json();
  const userErrors = json.data?.metaobjectUpdate?.userErrors;

  return {userErrors};
}

export async function createSettingsMetaobject(
  graphqlClient: GraphQLClient,
  shopDomain?: string,
): Promise<SettingsMetaobject> {
  const metaobjectRepository = new MetaobjectRepository(graphqlClient);
  const metaobject = await metaobjectRepository.createMetaobject({
    handle: SETTINGS_METAOBJECT_HANDLE,
    fields: SETTINGS_METAOBJECT_FIELDS,
  });

  logger.info({shopDomain}, 'Created settings metaobject');

  const mappedMetaobject: SettingsMetaobject = {
    id: metaobject.id,
    retryAttempts: {
      value: metaobject.getNumberIntegerFieldValue('retryAttempts'),
    },
    daysBetweenRetryAttempts: {
      value: metaobject.getNumberIntegerFieldValue('daysBetweenRetryAttempts'),
    },
    onFailure: {
      value: metaobject.getSingleLineTextFieldValue(
        'onFailure',
      ) as OnFailureTypeType,
    },
    inventoryDaysBetweenRetryAttempts: {
      value: metaobject.getNumberIntegerFieldValue(
        'inventoryDaysBetweenRetryAttempts',
      ),
    },
    inventoryRetryAttempts: {
      value: metaobject.getNumberIntegerFieldValue('inventoryRetryAttempts'),
    },
    inventoryOnFailure: {
      value: metaobject.getSingleLineTextFieldValue(
        'inventoryOnFailure',
      ) as OnInventoryFailureTypeType,
    },
    inventoryNotificationFrequency: {
      value: metaobject.getSingleLineTextFieldValue(
        'inventoryNotificationFrequency',
      ) as InventoryNotificationFrequencyTypeType,
    },
  };

  return mappedMetaobject;
}

function settingsValuesFromMetaobject(
  metaobject: SettingsMetaobject,
): Settings {
  return {
    id: metaobject.id,
    retryAttempts: Number(metaobject.retryAttempts.value),
    daysBetweenRetryAttempts: Number(metaobject.daysBetweenRetryAttempts.value),
    onFailure: metaobject.onFailure.value,
    inventoryRetryAttempts: Number(metaobject.inventoryRetryAttempts.value),
    inventoryDaysBetweenRetryAttempts: Number(
      metaobject.inventoryDaysBetweenRetryAttempts.value,
    ),
    inventoryOnFailure: metaobject.inventoryOnFailure.value,
    inventoryNotificationFrequency:
      metaobject.inventoryNotificationFrequency.value,
  };
}
