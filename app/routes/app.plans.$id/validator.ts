import {withZod} from '@rvf/zod';
import type {TFunction} from 'i18next';
import {useTranslation} from 'react-i18next';
import type {TypeOf} from 'zod';
import {z} from 'zod';
import {
  DeliveryFrequencyIntervalEnum,
  gidArrayString,
} from '~/utils/helpers/zod';

const DiscountTypeEnum = z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'PRICE']);
export const DiscountType = DiscountTypeEnum.enum;
export type DiscountTypeType = TypeOf<typeof DiscountTypeEnum>;

const discountDeliveryOption = (t: TFunction) =>
  z.object({
    id: z.string(),
    deliveryFrequency: z.coerce
      .number()
      .min(1, {message: t('SubscriptionPlanForm.deliveryFrequencyError')})
      // 36500 days == 100 years, max allowed interval
      .max(36500, {
        message: t('SubscriptionPlanForm.deliveryFrequencyMaxError'),
      })
      .int(t('SubscriptionPlanForm.deliveryFrequencyFloatError')),
    deliveryInterval: DeliveryFrequencyIntervalEnum,
    discountValue: z.coerce
      .number()
      .min(1, {message: t('SubscriptionPlanForm.discountValueMinError')})
      .max(Number.MAX_SAFE_INTEGER, {
        message: t('SubscriptionPlanForm.discountValueMaxError'),
      })
      .optional(),
  });

export type DiscountDeliveryOption = TypeOf<
  ReturnType<typeof discountDeliveryOption>
>;

export function getSellingPlanFormValidator(t: TFunction) {
  return withZod(
    z
      .object({
        merchantCode: z
          .string()
          .min(1, {message: t('SubscriptionPlanForm.merchantCodeEmptyError')}),
        planName: z
          .string()
          .min(1, {message: t('SubscriptionPlanForm.nameEmptyError')}),
        // selling plan groups can be created without specifying any products or variants
        // so allow empty strings for selectedProductIds and selectedVariantIds
        // Because we need to insert these values into a (hidden) input field, we need to
        // convert them into strings. They will be converted back into arrays when we
        // submit data to the mutation
        selectedProductIds: gidArrayString(
          'Product',
          t('SubscriptionPlanForm.invalidProduct'),
        ),
        selectedVariantIds: gidArrayString(
          'ProductVariant',
          t('SubscriptionPlanForm.invalidVariant'),
        ),
        removedProductIds: gidArrayString(
          'Product',
          t('SubscriptionPlanForm.invalidProduct'),
        ),
        removedVariantIds: gidArrayString(
          'ProductVariant',
          t('SubscriptionPlanForm.invalidVariant'),
        ),
        offerDiscount: z.string().optional(),
        discountType: DiscountTypeEnum.optional(),
        discountDeliveryOptions: z.array(discountDeliveryOption(t)).optional(),
        sellingPlanIdsToDelete: z.string().optional(),
        shopCurrencyCode: z.string().optional(),
      })
      .superRefine(
        ({discountType, discountDeliveryOptions}, refinementContext) => {
          // Add validation for percentage based discounts
          if (
            discountType === DiscountType.PERCENTAGE &&
            discountDeliveryOptions?.length
          ) {
            discountDeliveryOptions.forEach((option, index) => {
              if (option.discountValue && option.discountValue > 100) {
                refinementContext.addIssue({
                  code: 'custom',
                  message: t(
                    'SubscriptionPlanForm.discountValueMaxPercentError',
                  ),
                  path: [`discountDeliveryOptions[${index}].discountValue`],
                });
              }
            });
          }

          // Validate that there are no plans with duplicate delivery options
          if (discountDeliveryOptions?.length) {
            const deliveryOptions = discountDeliveryOptions.reduce(
              (acc, option, index) => {
                const key = `${option.deliveryFrequency}-${option.deliveryInterval}`;
                acc[key] = acc[key] || [];
                acc[key].push(index);
                return acc;
              },
              {} as Record<string, number[]>,
            );

            Object.values(deliveryOptions).forEach((indexes) => {
              if (indexes.length > 1) {
                indexes.forEach((index) => {
                  refinementContext.addIssue({
                    code: 'custom',
                    message: t(
                      'SubscriptionPlanForm.duplicateDeliveryFrequencyError',
                    ),
                    path: [
                      `discountDeliveryOptions[${index}].deliveryFrequency`,
                    ],
                  });
                });
              }
            });
          }
        },
      ),
  );
}

export function useSellingPlanFormValidator() {
  const {t} = useTranslation('app.plans.details');

  return getSellingPlanFormValidator(t);
}
