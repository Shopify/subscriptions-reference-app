import {isGid} from '@shopify/admin-graphql-api-utilities';
import type {SellingPlanPricingPolicyAdjustmentType} from 'types/admin.types';
import type {TypeOf} from 'zod';
import z from 'zod';
import {SellingPlanInterval} from '~/types';

export const MAX_MONEY_AMOUNT = 1000000;

/**
 * Validates that an array is contains only GID strings of the given type
 * ex: gidArray<'Product'> = ['gid://shopify/Product/123', 'gid://shopify/Product/456']
 */
export function gidArray(gidType: string, message: string) {
  return z.array(
    z.string().refine((value: string) => isGid(value, gidType), {message}),
  );
}

/**
 * Validates that a string is a comma separated list of GIDs
 * ex: gidArrayString<'Product'> = 'gid://shopify/Product/123,gid://shopify/Product/456'
 */
export function gidArrayString(
  gidType: string,
  message: string,
  allowEmpty = true,
) {
  const gidList = z
    .string()
    .refine(
      (value: string) => value.split(',').every((id) => isGid(id, gidType)),
      {
        message,
      },
    );

  if (allowEmpty) {
    return gidList.or(z.literal(''));
  }

  return gidList;
}

export const priceAmount = z.union([
  z.coerce.number().min(0).max(MAX_MONEY_AMOUNT),
  z.number().min(0).max(MAX_MONEY_AMOUNT),
]);

export const money = z.object({
  amount: priceAmount,
  currencyCode: z.string(),
});

export const DeliveryFrequencyIntervalEnum = z.nativeEnum(SellingPlanInterval);
export const DeliveryFrequencyInterval = DeliveryFrequencyIntervalEnum.enum;
export type DeliveryFrequencyIntervalType = TypeOf<
  typeof DeliveryFrequencyIntervalEnum
>;

export const DiscountTypeEnum = z.enum([
  'PERCENTAGE' as SellingPlanPricingPolicyAdjustmentType,
  'FIXED_AMOUNT' as SellingPlanPricingPolicyAdjustmentType,
  'PRICE' as SellingPlanPricingPolicyAdjustmentType,
]);
export const DiscountType = DiscountTypeEnum.enum;
export type DiscountTypeType = TypeOf<typeof DiscountTypeEnum>;
