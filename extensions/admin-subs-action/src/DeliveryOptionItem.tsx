import {
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
import type {ZodIssue} from 'zod';

interface DeliveryOptionProps {
  option: DeliveryOption;
  index: number;
  offerDiscount: boolean;
  discountType: DiscountTypeType;
  updateDeliveryOption: (field: string, value: any) => void;
  removeDeliveryOption?: () => void;
  extensionTarget: PurchaseOptionExtensionTarget;
  issues: ZodIssue[];
}

export function DeliveryOptionItem({
  option,
  index,
  offerDiscount,
  discountType,
  updateDeliveryOption,
  removeDeliveryOption,
  extensionTarget,
  issues,
}: DeliveryOptionProps) {
  const {i18n} = useExtensionApi({extensionTarget});

  function getDiscountLabel(discountType: DiscountTypeType) {
    switch (discountType) {
      case DiscountType.PERCENTAGE:
        return i18n.translate('discountType.percentageOff');
      case DiscountType.AMOUNT:
        return i18n.translate('discountType.amountOff');
      case DiscountType.PRICE:
        return i18n.translate('discountType.fixedPrice');
      default:
        return '';
    }
  }

  const errorMessages = new Map(
    issues
      .filter(
        ({path}) =>
          path.length === 3 &&
          path[0] === 'deliveryOptions' &&
          path[1] === index,
      )
      .map(({path, message}) => [path[2] as string, message]),
  );

  const hasError = errorMessages.size > 0;

  return (
    <InlineStack
      gap
      inlineAlignment="end"
      blockAlignment={hasError ? 'center' : 'end'}
    >
      <InlineStack gap blockAlignment="start">
        <NumberField
          label={i18n.translate('deliveryFrequency')}
          value={option.intervalCount}
          onChange={(value) => updateDeliveryOption('intervalCount', value)}
          error={errorMessages.get('intervalCount')}
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
        {offerDiscount && (
          <NumberField
            label={getDiscountLabel(discountType)}
            value={option.discount}
            onChange={(value) => updateDeliveryOption('discount', value)}
            error={errorMessages.get('discount')}
          />
        )}
      </InlineStack>
      {removeDeliveryOption && (
        <Pressable
          onPress={removeDeliveryOption}
          accessibilityLabel={i18n.translate('removeOption')}
        >
          <Icon name="DeleteMinor" />
        </Pressable>
      )}
    </InlineStack>
  );
}
