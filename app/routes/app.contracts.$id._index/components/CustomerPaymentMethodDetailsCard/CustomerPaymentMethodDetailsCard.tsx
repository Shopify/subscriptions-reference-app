import {parseGid} from '@shopify/admin-graphql-api-utilities';
import {
  ActionList,
  BlockStack,
  Button,
  Card,
  InlineStack,
  Popover,
  Text,
} from '@shopify/polaris';
import {EditIcon} from '@shopify/polaris-icons';
import {useCallback, useState} from 'react';
import {useTranslation} from 'react-i18next';
import PaymentIcon from '~/components/PaymentIcon/PaymentIcon';
import type {Customer, CustomerPaymentMethod} from '~/types/contracts';
import {getMobileSafeProtocolURL} from '~/utils/getMobileSafeProtocolURL';
import {
  formatExpirationDate,
  formatPaymentBrandName,
  getPaymentInstrumentIconBrand,
  paymentInstrumentIsCreditCard,
  paymentInstrumentIsPaypal,
  paymentInstrumentIsShopPay,
} from '~/utils/helpers/paymentMethods';
import {CustomerPaymentMethodEmailModal} from './components/CustomerPaymentMethodEmailModal/CustomerPaymentMethodEmailModal';
import {useFormatDate} from '~/utils/helpers/date';

interface CustomerPaymentMethodDetailsCardProps {
  customerPaymentMethod: CustomerPaymentMethod;
  customer: Customer;
}

export function CustomerPaymentMethodDetailsCard({
  customer,
  customerPaymentMethod,
}: CustomerPaymentMethodDetailsCardProps) {
  const {t, i18n} = useTranslation('app.contracts');
  const formatDate = useFormatDate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const {instrument} = customerPaymentMethod;

  const toggleEditMenu = useCallback(
    () => setMenuOpen((active) => !active),
    [],
  );

  if (!instrument) {
    return null;
  }

  const paymentMethodText = (() => {
    if (paymentInstrumentIsPaypal(instrument)) {
      return instrument.paypalAccountEmail;
    }

    if (paymentInstrumentIsCreditCard(instrument)) {
      const brand = formatPaymentBrandName(instrument.brand);
      const paymentBrandText = t(
        `paymentMethodDetails.paymentInstrumentBrands.${brand}`,
        '',
      );
      return `${paymentBrandText} ${instrument.maskedNumber}`;
    }

    if (paymentInstrumentIsShopPay(instrument)) {
      return `${instrument.maskedNumber}`;
    }

    throw new Error('Invalid payment instrument');
  })();

  const expirationDateText = (() => {
    if (
      paymentInstrumentIsCreditCard(instrument) ||
      paymentInstrumentIsShopPay(instrument)
    ) {
      return formatExpirationDate(
        instrument.expiryMonth,
        instrument.expiryYear,
        t,
      );
    }

    return null;
  })();

  return (
    <>
      <Card>
        <BlockStack gap="300">
          {customerPaymentMethod.revokedAt == null ? (
            <>
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd" fontWeight="semibold">
                  {t('paymentMethodDetails.title')}
                </Text>
                <Popover
                  active={menuOpen}
                  activator={
                    <Button
                      variant="plain"
                      icon={EditIcon}
                      onClick={toggleEditMenu}
                    />
                  }
                  autofocusTarget="first-node"
                  onClose={toggleEditMenu}
                >
                  <ActionList
                    actionRole="menuitem"
                    items={[
                      {
                        content: t(
                          'paymentMethodDetails.actions.sendUpdateLink',
                        ),
                        onAction: () => {
                          setEmailModalOpen(true);
                        },
                      },
                      {
                        content: t(
                          'paymentMethodDetails.actions.managePayment',
                        ),
                        onAction: () => {
                          open(
                            getMobileSafeProtocolURL(
                              `shopify:admin/customers/${parseGid(customer.id)}`,
                            ),
                            '_top',
                          );
                        },
                      },
                    ]}
                  />
                </Popover>
              </InlineStack>
              <BlockStack gap="200">
                <InlineStack gap="200" blockAlign="center">
                  <PaymentIcon
                    brand={getPaymentInstrumentIconBrand(instrument)}
                  />
                  <Text as="span" variant="bodyMd">
                    {paymentMethodText}
                  </Text>
                </InlineStack>
                {expirationDateText ? (
                  <Text as="span" variant="bodyMd" tone="subdued">
                    {expirationDateText}
                  </Text>
                ) : null}
              </BlockStack>
            </>
          ) : (
            <>
              <InlineStack align="space-between">
                <Text as="h2" variant="headingMd" fontWeight="semibold">
                  {t('paymentMethodDetails.title')}
                </Text>
              </InlineStack>
              <BlockStack gap="200">
                <Text as="span" variant="bodyMd">
                  <Text as="span" variant="bodyMd" tone="subdued">
                    {t('paymentMethodDetails.revoked', {
                      revokedAt: formatDate(
                        customerPaymentMethod.revokedAt,
                        i18n.language,
                      ),
                    })}
                  </Text>
                </Text>
              </BlockStack>
            </>
          )}
        </BlockStack>
      </Card>
      {customer.email ? (
        <CustomerPaymentMethodEmailModal
          open={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          instrument={instrument}
          customerEmail={customer.email}
          customerDisplayName={customer.displayName || ''}
        />
      ) : null}
    </>
  );
}
