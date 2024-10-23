import {
  BlockStack,
  Box,
  Card,
  FormLayout,
  InlineGrid,
    Text,
} from '@shopify/polaris';
import {useTranslation} from 'react-i18next';
import {RvfSelect} from '~/components/Select';
import {RvfTextField} from '~/components/TextField';
import {OnFailureType} from '../validator';

export default function PaymentFailureSettings() {
  const {t} = useTranslation('app.settings', {
    keyPrefix: 'paymentFailureSettings',
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

  return (
    <InlineGrid columns={{xs: '1fr', md: '2fr 5fr'}} gap="400">
      <Box as="section" paddingBlockStart="400">
        <Text as="h3" variant="headingMd">
          {t('title')}
        </Text>
      </Box>
      <Card>
        <BlockStack gap="200">
          <Text as="h2" variant="headingSm">
            {t('cardTitle')}
          </Text>
          <FormLayout>
            <FormLayout.Group>
              <RvfTextField
                label={t('retryAttempts.label')}
                name="retryAttempts"
                helpText={t('retryAttempts.helpText')}
                type="number"
                min={0}
                max={10}
              />
              <RvfTextField
                label={t('daysBetweenRetryAttempts.label')}
                name="daysBetweenRetryAttempts"
                helpText={t('daysBetweenRetryAttempts.helpText')}
                type="number"
                min={1}
                max={14}
              />
            </FormLayout.Group>
            <RvfSelect
              label={t('onFailure.label')}
              name="onFailure"
              options={onFailureOptions}
            />
          </FormLayout>
          
        </BlockStack>
      </Card>
    </InlineGrid>
  );
}
