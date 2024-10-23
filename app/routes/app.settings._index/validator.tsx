import {withZod} from '@rvf/zod';
import type {TFunction} from 'i18next';
import type {TypeOf} from 'zod';
import z from 'zod';

const OnFailureEnum = z.enum(['skip', 'pause', 'cancel']);
const OnInventoryFailureEnum = z.optional(z.enum(['skip', 'pause', 'cancel']));
export const OnFailureType = OnFailureEnum.enum;
export type OnFailureTypeType = TypeOf<typeof OnFailureEnum>;
export const OnInventoryFailureType = OnInventoryFailureEnum;
export type OnInventoryFailureTypeType = TypeOf<typeof OnInventoryFailureEnum>;

const InventoryNotificationFrequencyEnum = z.optional(
  z.enum(['immediately', 'weekly', 'monthly']),
);
export const InventoryNotificationFrequencyType =
  InventoryNotificationFrequencyEnum;
export type InventoryNotificationFrequencyTypeType = TypeOf<
  typeof InventoryNotificationFrequencyEnum
>;

export function getSettingsValidator(t: TFunction) {
  return withZod(
    z.object({
      id: z.string(),
      retryAttempts: z.coerce
        .number()
        .min(0, {message: t('paymentFailureSettings.retryAttempts.errors.min')})
        .max(10, {
          message: t('paymentFailureSettings.retryAttempts.errors.max'),
        }),
      daysBetweenRetryAttempts: z.coerce
        .number()
        .min(1, {
          message: t(
            'paymentFailureSettings.daysBetweenRetryAttempts.errors.min',
          ),
        })
        .max(14, {
          message: t(
            'paymentFailureSettings.daysBetweenRetryAttempts.errors.max',
          ),
        }),
      inventoryRetryAttempts: z.optional(
        z.coerce
          .number()
          .min(0, {
            message: t(
              'paymentFailureSettings.inventoryRetryAttempts.errors.min',
            ),
          })
          .max(10, {
            message: t(
              'paymentFailureSettings.inventoryRetryAttempts.errors.max',
            ),
          }),
      ),
      inventoryDaysBetweenRetryAttempts: z.optional(
        z.coerce
          .number()
          .min(1, {
            message: t(
              'paymentFailureSettings.inventoryDaysBetweenRetryAttempts.errors.min',
            ),
          })
          .max(14, {
            message: t(
              'paymentFailureSettings.inventoryDaysBetweenRetryAttempts.errors.max',
            ),
          }),
      ),
      onFailure: OnFailureEnum,
      inventoryOnFailure: OnInventoryFailureEnum,
      inventoryNotificationFrequency: InventoryNotificationFrequencyEnum,
    }),
  );
}

export const useSettingsValidator = getSettingsValidator;
