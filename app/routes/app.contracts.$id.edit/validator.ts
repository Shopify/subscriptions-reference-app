import {withZod} from '@rvf/zod';
import type {TFunction} from 'i18next';
import {useTranslation} from 'react-i18next';
import type {TypeOf} from 'zod';
import {z} from 'zod';
import {
  DeliveryFrequencyIntervalEnum,
  DiscountTypeEnum,
  money,
  priceAmount,
} from '~/utils/helpers/zod';

export const subscriptionLine = (t: TFunction) =>
  // only the quantity and price can be edited in place on a subscription line
  // other fields are marked as optional so no input elements
  // need to be created for them
  z.object({
    // editable fields
    quantity: z.coerce
      .number()
      .int()
      .min(1)
      .max(1000000, {
        message: t('edit.actions.updateDraft.quantityTooLargeError'),
      }),
    currentPrice: money,
    // readonly fields
    // newly added lines will not have an id -> make it nullable
    id: z.string().nullish().readonly(),
    // if a contract line has a product that has been deleted
    // the variant and product IDs will be null
    variantId: z.string().nullish().readonly(),
    productId: z.string().nullish().readonly(),
    title: z.string().nullish().readonly(),
    pricingPolicy: pricingPolicy().nullish().readonly(),
    variantTitle: z.string().nullish().readonly(),
    variantImage: z
      .object({
        altText: z.string().nullish(),
        url: z.string().nullish(),
      })
      .nullish()
      .readonly(),
    currentOneTimePurchasePrice: z.coerce.number().optional().readonly(),
  });

const subscriptionLineUpdateInput = () =>
  z.object({
    id: z.string(),
    quantity: z.coerce.number().int().min(1).optional(),
    // for updating a line we only need the price amount and not the currency
    // price: priceAmount.optional(),
    price: priceAmount.optional(),
    pricingPolicy: pricingPolicyInput().optional(),
  });

const deliveryPolicy = (t: TFunction) =>
  z.object({
    interval: DeliveryFrequencyIntervalEnum,
    intervalCount: z.coerce
      .number()
      .int({
        message: t('edit.actions.updateDraft.deliveryFrequencyIntegerError'),
      })
      .min(1)
      .max(36500, {
        message: t('edit.actions.updateDraft.deliveryFrequencyTooLargeError'),
      }),
  });

const adjustmentValue = () =>
  z.union([
    money,
    z.object({
      percentage: z.coerce.number().min(0).max(100),
    }),
  ]);

const adjustmentValueInput = () =>
  z.union([
    z.object({
      fixedValue: priceAmount,
    }),
    z.object({
      percentage: z.coerce.number().min(0).max(100),
    }),
  ]);

const pricingPolicy = () =>
  z.object({
    basePrice: money.readonly(),
    cycleDiscounts: z.array(
      z.object({
        adjustmentType: DiscountTypeEnum,
        adjustmentValue: adjustmentValue(),
        computedPrice: money.readonly(),
        afterCycle: z.coerce.number().int().min(0).readonly(),
      }),
    ),
  });

// the same as pricing policy but the prices are numbers instead of money objects
const pricingPolicyInput = () =>
  z.object({
    basePrice: priceAmount,
    cycleDiscounts: z.array(
      z.object({
        adjustmentType: DiscountTypeEnum,
        adjustmentValue: adjustmentValueInput(),
        computedPrice: priceAmount,
        // we don't support adjusting afterCycle but it's a required property
        // in pricing policies -> force it to 0 for now
        afterCycle: z.coerce.number().int().min(0).max(0).readonly(),
      }),
    ),
  });

export function getContractEditFormValidator(t: TFunction) {
  return withZod(
    z.object({
      lines: z.array(subscriptionLine(t)),
      deliveryPolicy: deliveryPolicy(t),
    }),
  );
}

export function useContractEditFormValidator() {
  const {t} = useTranslation('app.contracts');

  return getContractEditFormValidator(t);
}

export type CycleDiscountAdjustmentValue = TypeOf<
  ReturnType<typeof adjustmentValue>
>;
export type PricingPolicy = TypeOf<ReturnType<typeof pricingPolicy>>;
export type PricingPolicyInput = TypeOf<ReturnType<typeof pricingPolicyInput>>;
export type DeliveryPolicy = TypeOf<ReturnType<typeof deliveryPolicy>>;
export type SubscriptionLine = TypeOf<ReturnType<typeof subscriptionLine>>;
export type SubscriptionLineUpdateInput = TypeOf<
  ReturnType<typeof subscriptionLineUpdateInput>
>;
