import type {GridCellProps, GridProps} from '@shopify/polaris';
import {BlockStack, Button, Grid, Icon, InlineStack} from '@shopify/polaris';
import {DeleteIcon} from '@shopify/polaris-icons';
import type {TFunction} from 'i18next';
import {useTranslation} from 'react-i18next';
import {Select} from '~/components/Select';
import {TextField} from '~/components/TextField';
import type {DiscountTypeType} from '~/routes/app.plans.$id/validator';
import {DiscountType} from '~/routes/app.plans.$id/validator';
import {getSymbolFromCurrency} from '~/utils/helpers/money';
import {DeliveryFrequencyInterval} from '~/utils/helpers/zod';

export interface DiscountDeliveryOptionLineProps {
  id?: string;
  index: number;
  discountType: DiscountTypeType;
  offerDiscount: boolean;
  shopCurrencyCode: string;
  remove?: (index: number) => void;
}

export function DiscountDeliveryOptionLine({
  id,
  index,
  discountType,
  offerDiscount,
  shopCurrencyCode,
  remove,
}: DiscountDeliveryOptionLineProps) {
  const {t} = useTranslation('app.plans.details');

  const {discountValueFieldLabel, discountValueHelpText} =
    getDiscountValueLabelAndHelptext(t, discountType);

  const deliveryIntervalOptions = [
    {
      label: t('discountDeliveryCard.deliveryInterval.weeks'),
      value: DeliveryFrequencyInterval.Week,
    },
    {
      label: t('discountDeliveryCard.deliveryInterval.months'),
      value: DeliveryFrequencyInterval.Month,
    },
    {
      label: t('discountDeliveryCard.deliveryInterval.years'),
      value: DeliveryFrequencyInterval.Year,
    },
  ];

  const {columns, frequencyColumnSpan, intervalColumnSpan, discountColumnSpan} =
    getGridProps(Boolean(offerDiscount));

  return (
    <>
      <input
        type="hidden"
        name={`discountDeliveryOptions[${index}].id`}
        value={id}
      />
      <BlockStack key={index} gap="300">
        <Grid
          columns={columns}
          gap={{
            xs: '0.5rem',
            sm: '0.5rem',
            md: '0.5rem',
            lg: '0.5rem',
            xl: '0.5rem',
          }}
        >
          <Grid.Cell columnSpan={frequencyColumnSpan}>
            <TextField
              label={t('discountDeliveryCard.deliveryFrequency')}
              type="number"
              min={1}
              name={`discountDeliveryOptions[${index}].deliveryFrequency`}
            />
          </Grid.Cell>
          <Grid.Cell columnSpan={intervalColumnSpan}>
            <InlineStack
              gap={{xs: '100', sm: '100', md: '100', lg: '100', xl: '100'}}
            >
              <div style={{flexGrow: 1}}>
                <Select
                  label={t('discountDeliveryCard.deliveryInterval.label')}
                  name={`discountDeliveryOptions[${index}].deliveryInterval`}
                  options={deliveryIntervalOptions}
                />
              </div>
              {remove && !offerDiscount ? (
                <div style={{paddingTop: '1.8rem'}}>
                  <Button
                    variant="plain"
                    accessibilityLabel={t('discountDeliveryCard.removeOption')}
                    onClick={() => remove(index)}
                    icon={<Icon source={DeleteIcon} tone="base" />}
                  />
                </div>
              ) : null}
            </InlineStack>
          </Grid.Cell>
          {offerDiscount ? (
            <Grid.Cell columnSpan={discountColumnSpan}>
              <TextField
                type="number"
                label={discountValueFieldLabel}
                helpText={discountValueHelpText}
                name={`discountDeliveryOptions[${index}].discountValue`}
                prefix={
                  discountType !== DiscountType.PERCENTAGE
                    ? getSymbolFromCurrency(shopCurrencyCode)
                    : ''
                }
                suffix={discountType === DiscountType.PERCENTAGE ? '%' : ''}
                connectedRight={
                  remove ? (
                    <div style={{paddingTop: '0.25rem'}}>
                      <Button
                        variant="plain"
                        accessibilityLabel={t(
                          'discountDeliveryCard.removeOption',
                        )}
                        onClick={() => remove(index)}
                        icon={<Icon source={DeleteIcon} tone="base" />}
                      />
                    </div>
                  ) : null
                }
              />
            </Grid.Cell>
          ) : null}
        </Grid>
      </BlockStack>
    </>
  );
}

function getGridProps(offerDiscount: boolean): {
  columns: GridProps['columns'];
  frequencyColumnSpan: GridCellProps['columnSpan'];
  intervalColumnSpan: GridCellProps['columnSpan'];
  discountColumnSpan: GridCellProps['columnSpan'];
} {
  const columns = {xs: 6, sm: 6, md: 6, lg: 6, xl: 6};

  if (offerDiscount) {
    return {
      columns,
      frequencyColumnSpan: {xs: 3, sm: 3, md: 2, lg: 2, xl: 2},
      intervalColumnSpan: {xs: 3, sm: 3, md: 2, lg: 2, xl: 2},
      discountColumnSpan: {xs: 6, sm: 6, md: 2, lg: 2, xl: 2},
    };
  }

  return {
    columns,
    frequencyColumnSpan: {xs: 3, sm: 3, md: 3, lg: 3, xl: 3},
    intervalColumnSpan: {xs: 3, sm: 3, md: 3, lg: 3, xl: 3},
    discountColumnSpan: {xs: 1, sm: 1, md: 1, lg: 1, xl: 1},
  };
}

function getDiscountValueLabelAndHelptext(
  t: TFunction,
  discountType: DiscountTypeType,
) {
  switch (discountType) {
    case DiscountType.PERCENTAGE:
      return {
        discountValueFieldLabel: t(
          'discountDeliveryCard.discountType.percentageOff',
        ),
      };
    case DiscountType.FIXED_AMOUNT:
      return {
        discountValueFieldLabel: t(
          'discountDeliveryCard.discountType.amountOff',
        ),
      };
    case DiscountType.PRICE:
      return {
        discountValueFieldLabel: t(
          'discountDeliveryCard.discountType.fixedPrice',
        ),
        discountValueHelpText: t(
          'discountDeliveryCard.discountValueFixedPriceHelpText',
        ),
      };
    default:
      return {
        discountValueFieldLabel: t(
          'discountDeliveryCard.discountType.percentageOff',
        ),
      };
  }
}
