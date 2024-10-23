import {useState} from 'react';
import type {Address as AddressType} from '@shopify/address';
import {
  Card,
  Banner,
  BlockStack,
  View,
  Text,
  Grid,
  Style,
  InlineStack,
  Icon,
  Button,
} from '@shopify/ui-extensions-react/customer-account';
import {Address} from 'components';
import type {DeliveryPolicy, SubscriptionStatus} from 'types';

import {BillingAttemptErrorType} from 'types';
import {useExtensionApi} from 'foundation/Api';
import {DeliveryModal} from '../DeliveryModal';
import {createBlankAddress} from '../DeliveryModal/utilities/helpers';
import type {CountryCode} from 'generatedTypes/customer.types';

export interface OverviewCardProps {
  contractId: string;
  deliveryPolicy: DeliveryPolicy;
  shippingAddress?: AddressType;
  shippingMethodTitle?: string | null;
  pickupAddress?: AddressType | null;
  status: SubscriptionStatus;
  lastBillingAttemptErrorType?: BillingAttemptErrorType | null;
  refetchSubscriptionContract: () => void;
}

export function OverviewCard({
  contractId,
  deliveryPolicy,
  shippingAddress,
  shippingMethodTitle,
  pickupAddress,
  status,
  lastBillingAttemptErrorType,
  refetchSubscriptionContract,
}: OverviewCardProps) {
  const {i18n} = useExtensionApi();
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(
    lastBillingAttemptErrorType === BillingAttemptErrorType.InventoryError,
  );
  const isCancelled = status === 'CANCELLED';

  return (
    <Card padding>
      <BlockStack spacing="loose">
        {showBanner ? (
          <View padding={['none', 'none', 'base', 'none']}>
            <Banner
              onDismiss={() => {
                setShowBanner(false);
              }}
            >
              <Text appearance="subdued">
                {i18n.translate('overviewCard.inventoryError')}
              </Text>
            </Banner>
          </View>
        ) : null}
        <Grid
          columns={Style.default(['fill']).when(
            {viewportInlineSize: {min: 'small'}},
            ['1fr', '1fr'],
          )}
          rows={Style.default(['auto', 'auto', 'auto', 'auto']).when(
            {viewportInlineSize: {min: 'small'}},
            ['auto', 'auto'],
          )}
          spacing="loose"
          blockAlignment="start"
        >
          <BlockStack spacing="tight">
            <View>
              <Text emphasis="bold">
                {i18n.translate('overviewCard.deliveryFrequency')}
              </Text>
            </View>
            <Text>
              {i18n.translate(
                `deliveryInterval.${deliveryPolicy.interval.toLowerCase()}.${
                  deliveryPolicy.intervalCount?.count === 1 ? 'one' : 'other'
                }`,
                deliveryPolicy.intervalCount?.count === 1
                  ? undefined
                  : {
                      count: deliveryPolicy.intervalCount?.count,
                    },
              )}
            </Text>
          </BlockStack>

          {shippingAddress ? (
            <BlockStack spacing="tight">
              <InlineStack>
                <Text emphasis="bold">
                  {i18n.translate('overviewCard.shippingAddress')}
                </Text>
                {!isCancelled ? (
                  <Button
                    kind="plain"
                    accessibilityLabel={i18n.translate(
                      'overviewCard.editShippingAddressButtonLabel',
                    )}
                    overlay={
                      <DeliveryModal
                        currentAddress={shippingAddress}
                        subscriptionContractId={contractId}
                        addressModalOpen={addressModalOpen}
                        refetchSubscriptionContract={
                          refetchSubscriptionContract
                        }
                        onClose={() => setAddressModalOpen(false)}
                      />
                    }
                    onPress={() => setAddressModalOpen(true)}
                  >
                    <Icon source="pen" appearance="interactive" />
                  </Button>
                ) : null}
              </InlineStack>
              <Address address={shippingAddress} />
            </BlockStack>
          ) : null}
          {pickupAddress ? (
            <BlockStack spacing="tight">
              <InlineStack>
                <Text emphasis="bold">
                  {i18n.translate('overviewCard.pickupLocation')}
                </Text>
                {!isCancelled ? (
                  <Button
                    kind="plain"
                    accessibilityLabel={i18n.translate(
                      'overviewCard.editPickupAddressButtonLabel',
                    )}
                    overlay={
                      <DeliveryModal
                        currentAddress={createBlankAddress(
                          pickupAddress.country as CountryCode,
                        )}
                        subscriptionContractId={contractId}
                        addressModalOpen={addressModalOpen}
                        refetchSubscriptionContract={
                          refetchSubscriptionContract
                        }
                        onClose={() => setAddressModalOpen(false)}
                      />
                    }
                    onPress={() => {
                      setAddressModalOpen(true);
                    }}
                  >
                    <Icon source="pen" appearance="interactive" />
                  </Button>
                ) : null}
              </InlineStack>
              {pickupAddress ? <Address address={pickupAddress} /> : null}
            </BlockStack>
          ) : null}

          {shippingMethodTitle ? (
            <BlockStack spacing="tight">
              <Text emphasis="bold">
                {i18n.translate('overviewCard.shippingMethod')}
              </Text>
              <Text>{shippingMethodTitle}</Text>
            </BlockStack>
          ) : null}
        </Grid>
      </BlockStack>
    </Card>
  );
}
