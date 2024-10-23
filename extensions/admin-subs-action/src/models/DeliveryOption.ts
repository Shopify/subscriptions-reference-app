import type {I18n} from '@shopify/ui-extensions/admin';
import type {
  SellingPlanCategory,
  SellingPlanInterval,
  SellingPlanPricingPolicyAdjustmentType,
  SellingPlanInput,
  SellingPlanRecurringBillingPolicy,
  SellingPlanFixedPricingPolicy,
} from '../../types/admin.types';
import type {ExtensionSellingPlanGroupDetailsQuery} from 'generatedTypes/admin.generated';
import {
  DiscountType,
  type DeliveryIntervalType,
  type DiscountTypeType,
} from '../consts';

type SellingPlan = NonNullable<
  ExtensionSellingPlanGroupDetailsQuery['sellingPlanGroup']
>['sellingPlans']['edges'][number]['node'];

export class DeliveryOption {
  public constructor(
    public intervalCount: number,
    public interval: DeliveryIntervalType,
    public discount: number | undefined,
    public discountType: DiscountTypeType,
    public i18n: I18n,
    public sellingPlanId?: string,
  ) {
    this.intervalCount = intervalCount;
    this.interval = interval;
    this.discount = discount;
    this.discountType = discountType;
    this.i18n = i18n;
    this.sellingPlanId = sellingPlanId;
  }

  public static fromSellingPlan(
    sellingPlan: SellingPlan,
    i18n: I18n,
  ): DeliveryOption {
    const billingPolicy =
      sellingPlan.billingPolicy as SellingPlanRecurringBillingPolicy;
    const pricingPolicy =
      sellingPlan.pricingPolicies.length > 0
        ? (sellingPlan.pricingPolicies[0] as SellingPlanFixedPricingPolicy)
        : undefined;

    const discountType = pricingPolicy?.adjustmentType;
    const discountAmount = (() => {
      if (!pricingPolicy) {
        return 0;
      }

      switch (pricingPolicy.adjustmentType) {
        case 'PRICE':
        case 'FIXED_AMOUNT':
          return Number(pricingPolicy.adjustmentValue['amount'] ?? 0);
        case 'PERCENTAGE':
          return Number(pricingPolicy.adjustmentValue['percentage'] ?? 0);
        default:
          return 0;
      }
    })();

    return new DeliveryOption(
      billingPolicy.intervalCount,
      billingPolicy.interval,
      discountAmount,
      discountType ?? DiscountType.NONE,
      i18n,
      sellingPlan.id,
    );
  }

  private buildSellingPlanDetails(currencyCode: string): {
    name: string;
    options: string[];
  } {
    const count = Number(this.intervalCount);
    const deliveryFrequencyText = this.i18n.translate(
      count === 1
        ? `deliveryInterval.${this.interval.toLowerCase()}.singular`
        : `deliveryInterval.${this.interval.toLowerCase()}.plural`,
      {count},
    );

    if (!this.discount) {
      return {
        name: deliveryFrequencyText,
        options: [deliveryFrequencyText],
      };
    }

    const discountText = (() => {
      switch (this.discountType) {
        case DiscountType.PERCENTAGE:
          return this.i18n.translate('discountDetails.percentageOff', {
            amount: Number(this.discount),
          });
        case DiscountType.AMOUNT:
          return this.i18n.translate('discountDetails.amountOff', {
            amount: this.i18n.formatCurrency(Number(this.discount), {
              currency: currencyCode,
              currencyDisplay: 'narrowSymbol',
            }),
          });
        default:
          return this.i18n.translate('discountDetails.fixedPrice', {
            amount: this.i18n.formatCurrency(Number(this.discount), {
              currency: currencyCode,
              currencyDisplay: 'narrowSymbol',
            }),
          });
      }
    })();

    return {
      name: `${deliveryFrequencyText}, ${discountText}`,
      options: [deliveryFrequencyText],
    };
  }

  public toSellingPlanInput(currencyCode: string): SellingPlanInput {
    const {name, options} = this.buildSellingPlanDetails(currencyCode);

    const plan = {
      id: this.sellingPlanId,
      name,
      options,
      category: 'SUBSCRIPTION' as SellingPlanCategory,
      billingPolicy: {
        recurring: {
          interval: this.interval as SellingPlanInterval,
          intervalCount: Number(this.intervalCount),
        },
      },
      deliveryPolicy: {
        recurring: {
          interval: this.interval as SellingPlanInterval,
          intervalCount: Number(this.intervalCount),
        },
      },
      pricingPolicies:
        this.discount &&
        this.discount > 0 &&
        this.discountType !== DiscountType.NONE
          ? [
              {
                fixed: {
                  adjustmentType: this
                    .discountType as SellingPlanPricingPolicyAdjustmentType,
                  adjustmentValue: {
                    percentage:
                      this.discountType === DiscountType.PERCENTAGE
                        ? Number(this.discount)
                        : undefined,
                    fixedValue:
                      this.discountType === DiscountType.PRICE ||
                      this.discountType === DiscountType.AMOUNT
                        ? Number(this.discount)
                        : undefined,
                  },
                },
              },
            ]
          : undefined,
    };

    return plan;
  }
}
