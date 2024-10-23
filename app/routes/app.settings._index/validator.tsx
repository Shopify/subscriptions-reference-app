import {withZod} from '@rvf/zod';
import type {TFunction} from 'i18next';
import type {TypeOf} from 'zod';
import z from 'zod';

const OnFailureEnum = z.enum(['skip', 'pause', 'cancel']);
const OnInventoryFailureEnum = z.enum(['skip', 'pause', 'cancel']);
export const OnFailureType = OnFailureEnum.enum;
export type OnFailureTypeType = TypeOf<typeof OnFailureEnum>;
export const OnInventoryFailureType = OnInventoryFailureEnum;
export type OnInventoryFailureTypeType = TypeOf<typeof OnInventoryFailureEnum>;

const InventoryNotificationFrequencyEnum = z.enum([
  'immediately',
  'weekly',
  'monthly',
]);

export const InventoryNotificationFrequencyType =
  InventoryNotificationFrequencyEnum.enum;

export type InventoryNotificationFrequencyTypeType = TypeOf<
  typeof InventoryNotificationFrequencyEnum
>;

export function getSettingsValidator(t: TFunction) {
  return withZod(
    z.object({
      id: z.string(),
      retryAttempts: z.coerce
        .number()
        .min(0, {message: t('billingFailureSettings.retryAttempts.errors.min')})
        .max(10, {
          message: t('billingFailureSettings.retryAttempts.errors.max'),
        }),
      daysBetweenRetryAttempts: z.coerce
        .number()
        .min(1, {
          message: t(
            'billingFailureSettings.daysBetweenRetryAttempts.errors.min',
          ),
        })
        .max(14, {
          message: t(
            'billingFailureSettings.daysBetweenRetryAttempts.errors.max',
          ),
        }),
      inventoryRetryAttempts: z.coerce
        .number()
        .min(0, {
          message: t(
            'billingFailureSettings.inventoryRetryAttempts.errors.min',
          ),
        })
        .max(10, {
          message: t(
            'billingFailureSettings.inventoryRetryAttempts.errors.max',
          ),
        }),
      inventoryDaysBetweenRetryAttempts: z.coerce
        .number()
        .min(1, {
          message: t(
            'billingFailureSettings.inventoryDaysBetweenRetryAttempts.errors.min',
          ),
        })
        .max(14, {
          message: t(
            'billingFailureSettings.inventoryDaysBetweenRetryAttempts.errors.max',
          ),
        }),
      onFailure: OnFailureEnum,
      inventoryOnFailure: OnInventoryFailureEnum,
      inventoryNotificationFrequency: InventoryNotificationFrequencyEnum,
    }),
  );
}

export const useSettingsValidator = getSettingsValidator;
