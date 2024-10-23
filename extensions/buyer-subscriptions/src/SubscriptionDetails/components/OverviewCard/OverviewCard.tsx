import {useState} from 'react';
import type {Address as AddressType} from '@shopify/address';
import {
  Heading,
  Card,
  BlockStack,
  View,
  Text,
  Grid,
  Style,
  ProductThumbnail,
  InlineLayout,
  InlineStack,
  Icon,
  Button,
} from '@shopify/ui-extensions-react/customer-account';
import {Address, PaymentInstrument} from 'components';
import type {
  DeliveryPolicy,
  SubscriptionStatus,
  PaymentInstrument as PaymentInstrumentType,
  Money,
  SubscriptionLine,
} from 'types';

import {OverviewActions} from './components/OverviewActions';
import {useExtensionApi} from 'foundation/Api';
import {UpdatePaymentMethodModal} from '../UpdatePaymentMethodModal';
import {DeliveryModal} from '../DeliveryModal';
import {SuccessToastType, useToast} from 'utilities/hooks/useToast';
import {createBlankAddress} from '../DeliveryModal/utilities/helpers';
import {CountryCode} from 'generatedTypes/customer.types';

export interface OverviewCardProps {
  contractId: string;
  deliveryPolicy: DeliveryPolicy;
  lines: SubscriptionLine[];
  paymentInstrument?: PaymentInstrumentType;
  shippingAddress?: AddressType;
  shippingMethodTitle?: string | null;
  pickupAddress?: AddressType | null;
  status: SubscriptionStatus;
  billingAddress?: AddressType;
  nextBillingDate?: string;
  lastOrderPrice?: Money | null;
  nextOrderPrice?: Money | null;
  refetchSubscriptionContract: () => void;
}

export function OverviewCard({
  contractId,
  lines,
  deliveryPolicy,
  paymentInstrument,
  shippingAddress,
  shippingMethodTitle,
  pickupAddress,
  status,
  billingAddress,
  nextBillingDate,
  lastOrderPrice,
  nextOrderPrice,
  refetchSubscriptionContract,
}: OverviewCardProps) {
  const {i18n} = useExtensionApi();
  const [paymentModalOpened, setPaymentModalOpened] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const {showSuccessToast} = useToast();
  const isCancelled = status === 'CANCELLED';

  function onPaymentMethodUpdated() {
    showSuccessToast(SuccessToastType.PaymentUpdated);
    refetchSubscriptionContract();
  }

  return (
    <Card padding>
      <BlockStack spacing="loose">
        <Heading level={2}>{i18n.translate('overviewCard.overview')}</Heading>
        <BlockStack spacing="tight">
          <Text appearance="subdued">
            {i18n.translate('overviewCard.product')}
          </Text>
          <Grid
            columns={Style.default(['fill']).when(
              {viewportInlineSize: {min: 'medium'}},
              ['1fr', '1fr'],
            )}
            spacing="loose"
            blockAlignment="start"
          >
            {lines.map((line) => (
              <SubscriptionLineItem key={line.id} line={line} />
            ))}
          </Grid>
        </BlockStack>
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
              <Text appearance="subdued">
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
          <BlockStack spacing="tight">
            <InlineStack blockAlignment="center">
              <Text appearance="subdued">
                {i18n.translate('overviewCard.payment')}
              </Text>
              {!isCancelled ? (
                <Button
                  kind="plain"
                  accessibilityLabel={i18n.translate(
                    'overviewCard.changePaymentMethodButtonLabel',
                  )}
                  overlay={
                    <UpdatePaymentMethodModal
                      opened={paymentModalOpened}
                      contractId={contractId}
                      currentPaymentInstrumentId={paymentInstrument?.id}
                      onPaymentMethodUpdated={onPaymentMethodUpdated}
                    />
                  }
                  onPress={() => setPaymentModalOpened(true)}
                >
                  <Icon appearance="interactive" size="base" source="pen" />
                </Button>
              ) : null}
            </InlineStack>
            <PaymentInstrument paymentInstrument={paymentInstrument} />
          </BlockStack>
          {shippingAddress ? (
            <BlockStack spacing="tight">
              <InlineStack>
                <Text appearance="subdued">
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
                <Text appearance="subdued">
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
          <BlockStack spacing="tight">
            <Text appearance="subdued">
              {i18n.translate('overviewCard.billingAddress')}
            </Text>
            {billingAddress ? <Address address={billingAddress} /> : null}
          </BlockStack>
          {shippingMethodTitle ? (
            <BlockStack spacing="tight">
              <Text appearance="subdued">
                {i18n.translate('overviewCard.shippingMethod')}
              </Text>
              <Text>{shippingMethodTitle}</Text>
            </BlockStack>
          ) : null}
        </Grid>
        {['ACTIVE', 'PAUSED'].includes(status) ? (
          <OverviewActions
            contractId={contractId}
            status={status}
            nextBillingDate={nextBillingDate}
            lastOrderPrice={lastOrderPrice}
            nextOrderPrice={nextOrderPrice}
            refetchSubscriptionContract={refetchSubscriptionContract}
          />
        ) : null}
      </BlockStack>
    </Card>
  );
}

function SubscriptionLineItem({line}: {line: SubscriptionLine}) {
  return (
    <InlineLayout
      columns={['auto', 'fill']}
      spacing="base"
      blockAlignment="center"
    >
      <ProductThumbnail source={line.image?.url} badge={line.quantity} />
      <BlockStack spacing="none">
        <Text>{line.title}</Text>
        <Text appearance="subdued">{line.variantTitle}</Text>
      </BlockStack>
    </InlineLayout>
  );
}
