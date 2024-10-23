import {
  BlockStack,
  Box,
  Card,
  Divider,
  FormLayout,
  InlineGrid,
  Text,
} from '@shopify/polaris';
import {useTranslation} from 'react-i18next';
import {Select} from '~/components/Select';
import {TextField} from '~/components/TextField';
import {OnFailureType, InventoryNotificationFrequencyType} from '../validator';
import type {Settings} from '~/types';

interface BillingFailureSettingsProps {
  inventoryEnabled?: boolean;
  settings: Settings;
}

export function BillingFailureSettings({
  inventoryEnabled,
  settings,
}: BillingFailureSettingsProps) {
  const {t} = useTranslation('app.settings', {
    keyPrefix: 'billingFailureSettings',
  });

  const onFailureOptions = [
    {
      label: t('onFailure.options.skip'),
      value: OnFailureType.skip,
    },
    {
      label: t('onFailure.options.pause'),
      value: OnFailureType.pause,
    },
    {
      label: t('onFailure.options.cancel'),
      value: OnFailureType.cancel,
    },
  ];

  const staffNotificationFrequencyOptions = [
    {
      label: t('staffNotificationFrequency.options.immediately'),
      value: InventoryNotificationFrequencyType.immediately,
    },
    {
      label: t('staffNotificationFrequency.options.weekly'),
      value: InventoryNotificationFrequencyType.weekly,
    },
    {
      label: t('staffNotificationFrequency.options.monthly'),
      value: InventoryNotificationFrequencyType.monthly,
    },
  ];

  return (
    <InlineGrid columns={{xs: '1fr', md: '2fr 5fr'}} gap="400">
      <Box as="section" paddingBlockStart="400">
        <BlockStack gap="200">
          <Text as="h3" variant="headingMd">
            {t('title')}
          </Text>
          <Text as="p" variant="bodyMd">
            {t('description')}
          </Text>
        </BlockStack>
      </Box>
      <Card>
        <BlockStack gap="200">
          <Text as="h2" variant="headingSm">
            {t('paymentFailureTitle')}
          </Text>
          <FormLayout>
            <FormLayout.Group>
              <TextField
                label={t('retryAttempts.label')}
                name="retryAttempts"
                helpText={t('retryAttempts.helpText')}
                type="number"
                min={0}
                max={10}
              />
              <TextField
                label={t('daysBetweenRetryAttempts.label')}
                name="daysBetweenRetryAttempts"
                helpText={t('daysBetweenRetryAttempts.helpText')}
                type="number"
                min={1}
                max={14}
              />
            </FormLayout.Group>
            <BlockStack gap="200">
              <Select
                label={t('onFailure.label')}
                name="onFailure"
                options={onFailureOptions}
              />
            </BlockStack>
          </FormLayout>
          {inventoryEnabled ? (
            <>
              <Box paddingBlockStart="200" paddingBlockEnd="200">
                <Divider />
              </Box>
              <Text as="h2" variant="headingSm">
                {t('inventoryFailureTitle')}
              </Text>
              <FormLayout>
                <FormLayout.Group>
                  <TextField
                    label={t('retryAttempts.label')}
                    name="inventoryRetryAttempts"
                    helpText={t('retryAttempts.helpText')}
                    type="number"
                    min={0}
                    max={10}
                  />
                  <TextField
                    label={t('daysBetweenRetryAttempts.label')}
                    name="inventoryDaysBetweenRetryAttempts"
                    helpText={t('daysBetweenRetryAttempts.helpText')}
                    type="number"
                    min={1}
                    max={14}
                  />
                </FormLayout.Group>
                <Select
                  label={t('onFailure.label')}
                  name="inventoryOnFailure"
                  options={onFailureOptions}
                />
                <BlockStack gap="200">
                  <Select
                    label={t('staffNotificationFrequency.label')}
                    name="inventoryNotificationFrequency"
                    options={staffNotificationFrequencyOptions}
                  />
                </BlockStack>
              </FormLayout>
            </>
          ) : (
            <>
              <input
                hidden
                defaultValue={settings.inventoryOnFailure}
                name="inventoryOnFailure"
              />
              <input
                hidden
                defaultValue={settings.inventoryRetryAttempts}
                name="inventoryRetryAttempts"
              />
              <input
                hidden
                defaultValue={settings.inventoryDaysBetweenRetryAttempts}
                name="inventoryDaysBetweenRetryAttempts"
              />
              <input
                hidden
                defaultValue={settings.inventoryNotificationFrequency}
                name="inventoryNotificationFrequency"
              />
            </>
          )}
        </BlockStack>
      </Card>
    </InlineGrid>
  );
}
