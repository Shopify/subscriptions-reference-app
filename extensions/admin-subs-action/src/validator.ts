import type {TypeOf} from 'zod';
import {z} from 'zod';
import {DeliveryInterval, DiscountType} from './consts';
import type {I18nTranslate} from '@shopify/ui-extensions/admin';

const discountDeliveryOption = (t: I18nTranslate) =>
  z
    .object({
      id: z.string().optional(),
      intervalCount: z.coerce
        .number()
        .min(1, {message: t('validator.deliveryFrequencyError')})
        .max(36500, {
          message: t('validator.deliveryFrequencyMaxError'),
        })
        .int(t('validator.deliveryFrequencyFloatError')),
      interval: z.nativeEnum(DeliveryInterval),
      discountType: z.nativeEnum(DiscountType),
      discount: z.coerce.number().optional(),
    })
    .superRefine(({discountType, discount}, refinementContext) => {
      if (discount === undefined) {
        return;
      }

      if (discountType !== DiscountType.NONE) {
        if (discount <= 0) {
          refinementContext.addIssue({
            code: 'custom',
            message: t('validator.discountValueMinError'),
            path: ['discount'],
          });
        }

        if (discount > Number.MAX_SAFE_INTEGER) {
          refinementContext.addIssue({
            code: 'custom',
            message: t('validator.discountValueMaxError'),
            path: ['discount'],
          });
        }
      }

      if (discountType === DiscountType.PERCENTAGE && discount > 100) {
        refinementContext.addIssue({
          code: 'custom',
          message: t('validator.discountValueMaxPercentError'),
          path: ['discount'],
        });
      }
    });

export type ZodDiscountDeliveryOption = TypeOf<
  ReturnType<typeof discountDeliveryOption>
>;

export function getExtensionSellingPlanGroupValidator(t: I18nTranslate) {
  return z.object({
    merchantCode: z
      .string()
      .min(1, {message: t('validator.merchantCodeEmptyError')}),
    planName: z.string().min(1, {message: t('validator.nameEmptyError')}),
    deliveryOptions: z.array(discountDeliveryOption(t)),
  });
}
