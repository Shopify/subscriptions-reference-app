import {
  BlockStack,
  InlineStack,
  NumberField,
  Select,
  Icon,
  Pressable,
} from '@shopify/ui-extensions-react/admin';
import {DeliveryInterval, DiscountType, type DiscountTypeType} from './consts';
import type {PurchaseOptionExtensionTarget} from 'foundation/api';
import {useExtensionApi} from 'foundation/api';
import type {DeliveryOption} from './models/DeliveryOption';

interface DeliveryOptionProps {
  option: DeliveryOption;
  offerDiscount: boolean;
  discountType: DiscountTypeType;
  updateDeliveryOption: (field: string, value: any) => void;
  removeDeliveryOption?: () => void;
  extensionTarget: PurchaseOptionExtensionTarget;
}

export function DeliveryOptionItem({
  option,
  offerDiscount,
  discountType,
  updateDeliveryOption,
  removeDeliveryOption,
  extensionTarget,
}: DeliveryOptionProps) {
  const {i18n} = useExtensionApi({extensionTarget});

  function getDiscountLabel(discountType: DiscountTypeType) {
    switch (discountType) {
      case DiscountType.PERCENTAGE:
        return i18n.translate('discountType.percentageOff');
      case DiscountType.AMOUNT:
        return i18n.translate('discountType.amountOff');
      case DiscountType.PRICE:
        return i18n.translate('discountType.flatRate');
    }
  }

  return (
    <InlineStack gap inlineAlignment="end" blockAlignment="end">
      <NumberField
        label={i18n.translate('deliveryFrequency')}
        value={option.intervalCount}
        onChange={(value) => updateDeliveryOption('intervalCount', value)}
      />
      <Select
        label={i18n.translate('deliveryInterval.label')}
        value={option.interval}
        onChange={(value) => updateDeliveryOption('interval', value)}
        options={[
          {
            value: DeliveryInterval.WEEK,
            label: i18n.translate('deliveryInterval.weeks'),
          },
          {
            value: DeliveryInterval.MONTH,
            label: i18n.translate('deliveryInterval.months'),
          },
          {
            value: DeliveryInterval.YEAR,
            label: i18n.translate('deliveryInterval.years'),
          },
        ]}
      />
      {offerDiscount ? (
        <NumberField
          label={getDiscountLabel(discountType)}
          value={option.discount}
          onChange={(value) => updateDeliveryOption('discount', value)}
        />
      ) : null}
      {removeDeliveryOption ? (
        <BlockStack blockSize={26} inlineSize={26}>
          <Pressable
            onPress={removeDeliveryOption}
            accessibilityLabel={i18n.translate('removeOption')}
          >
            <Icon name="DeleteMinor" />
          </Pressable>
        </BlockStack>
      ) : null}
    </InlineStack>
  );
}
