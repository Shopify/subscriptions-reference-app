import type {I18nTranslate} from '@shopify/ui-extensions/admin';
import type {
  SellingPlanCategory,
  SellingPlanInterval,
  SellingPlanPricingPolicyAdjustmentType,
  SellingPlanInput,
  SellingPlan,
} from '../../types/admin.types';
import type {DeliveryIntervalType, DiscountTypeType} from '../consts';

type FormatCurrencyFunction = (
  number: number | bigint,
  options?: {
    inExtensionLocale?: boolean;
  } & Intl.NumberFormatOptions,
) => string;

export class DeliveryOption {
  public constructor(
    public intervalCount: number,
    public interval: DeliveryIntervalType,
    public discount: number,
    public discountType: DiscountTypeType,
  ) {
    this.intervalCount = intervalCount;
    this.interval = interval;
    this.discount = discount;
    this.discountType = discountType;
  }

  public static fromSellingPlan(sellingPlan: SellingPlan): DeliveryOption {
    throw new Error('Not implemented');
  }

  private buildSellingPlanDetails(
    t: I18nTranslate,
    formatCurrency: FormatCurrencyFunction,
    currencyCode: string,
  ): {
    name: string;
    options: string[];
  } {
    const deliveryFrequencyText = t(
      `deliveryInterval.${this.interval.toLowerCase()}`,
      {
        count: Number(this.intervalCount),
      },
    );

    if (this.discount === 0) {
      return {
        name: deliveryFrequencyText,
        options: [deliveryFrequencyText],
      };
    }

    const discountText = (() => {
      switch (this.discountType) {
        case 'PERCENTAGE':
          return t('discountDetails.percentageOff', {
            amount: Number(this.discount),
          });
        case 'FIXED_AMOUNT':
          return t('discountDetails.amountOff', {
            amount: formatCurrency(Number(this.discount), {
              currency: currencyCode,
              currencyDisplay: 'narrowSymbol',
            }),
          });
        default:
          return t('discountDetails.flatRate', {
            amount: formatCurrency(Number(this.discount), {
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

  public toSellingPlanInput(
    t: I18nTranslate,
    formatCurrency: FormatCurrencyFunction,
    currencyCode: string,
  ): SellingPlanInput {
    const {name, options} = this.buildSellingPlanDetails(
      t,
      formatCurrency,
      currencyCode,
    );

    const plan = {
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
      pricingPolicies: this.discount
        ? [
            {
              fixed: {
                adjustmentType: this
                  .discountType as SellingPlanPricingPolicyAdjustmentType,
                adjustmentValue: {
                  percentage:
                    this.discountType === 'PERCENTAGE'
                      ? Number(this.discount)
                      : undefined,
                  fixedValue:
                    this.discountType === 'FIXED_AMOUNT' ||
                    this.discountType === 'PRICE'
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
