import type {TFunction} from 'i18next';
import type {
  SellingPlanCategory,
  SellingPlanInterval,
  SellingPlanPricingPolicyAdjustmentType,
} from 'types/admin.types';
import type {
  Product,
  SellingPlanGroup,
  SellingPlanGroupProduct,
  SellingPlanGroupProductVariant,
} from '~/types';
import {formatPrice} from '~/utils/helpers/money';
import {DeliveryFrequencyInterval} from '~/utils/helpers/zod';
import type {DiscountDeliveryOption, DiscountTypeType} from './validator';
import {DiscountType} from './validator';

export const NEW_DELIVERY_OPTION_ID = 'NewDeliveryOption';

export const defaultDiscountDeliveryOption = {
  id: `${NEW_DELIVERY_OPTION_ID}--0`,
  deliveryFrequency: 1,
  deliveryInterval: DeliveryFrequencyInterval.Week,
  discountValue: undefined,
};

/**
 * Gets the empty selling plan to be returned by the loader
 */
export function getEmptySellingPlan(t: TFunction): SellingPlanGroup {
  return {
    merchantCode: '',
    planName: t('defaultPurchaseOptionTitle'),
    offerDiscount: 'on',
    discountType: DiscountType.PERCENTAGE,
    discountDeliveryOptions: [defaultDiscountDeliveryOption],
    products: [],
    selectedProductIds: '',
    selectedProductVariantIds: '',
  };
}

/**
 * Formats the selected products and product variants into a single array
 * Where each entry represents a product and which of its variants are selected
 */

/*
  We want the selected products to be in the same format that the product resource
  picker uses. This means:
  [
    {
      id: 'gid://shopify/Product/123',
      images: [...]
      variants: [{
        id: 'gid://shopify/ProductVariant/123',
        ...
      }]
    }
  ]
  If a selling plan group is applied at the product level, then the product
  will be part of the product array. When a product id is passed in to the
  product picker, all its variants are automatically marked as selected
  (ie: variants[] is not specified)

  If a selling plan group is applied at the variant level then they will be returned
  as part of the productVariants array while their parent product
  will not be part of the products array. We need to group these variants
  by their parent product and reformat them to be compatible with the resource picker
  */
export function formatSelectedProducts(
  products: SellingPlanGroupProduct[],
  productVariants: SellingPlanGroupProductVariant[],
): Product[] {
  const getImages = (product: SellingPlanGroupProduct) => {
    const {featuredImage: image} = product;
    return image
      ? [
          {
            originalSrc: image.transformedSrc,
            altText: image.altText || '',
          },
        ]
      : [];
  };

  /* Group the product variants by their parent product
  ex:
  {
    id: 'gid://shopify/Product/123': {
      id: 'gid://shopify/Product/123',
      variants: [
        {
          id: 'gid://shopify/ProductVariant/123',
          ...
        },
        ...
      ]
    },
  }
  */
  const variantsByProductId: {[id: string]: Product} = productVariants
    ? productVariants.reduce((acc, productVariant) => {
        const {product: variantParentProduct} = productVariant;
        const productId = variantParentProduct.id;

        if (acc[productId]) {
          acc[productId].variants.push(productVariant);
        } else {
          const formattedProduct: Product = {
            ...variantParentProduct,
            images: getImages(variantParentProduct),
            variants: [productVariant],
          };
          acc[productId] = formattedProduct;
        }

        return acc;
      }, {})
    : {};

  const selectedProductVariants = Object.values(variantsByProductId);

  return [
    ...products.map((product) => ({
      ...product,
      images: getImages(product),
      areAllVariantsSelected: true,
    })),
    ...selectedProductVariants,
  ];
}

export function getSellingPlansFromDiscountDeliveryOptions(
  discountDeliveryOptions: DiscountDeliveryOption[],
  discountType: DiscountTypeType,
  offerDiscount: boolean,
  currencyCode: string,
  t: TFunction,
  locale: string,
) {
  return discountDeliveryOptions.map(
    ({
      id,
      deliveryFrequency: deliveryFrequencyString,
      deliveryInterval,
      discountValue,
    }) => {
      const deliveryFrequency = Number(deliveryFrequencyString);

      const information = sellingPlanInformation(
        t,
        locale,
        discountType,
        String(discountValue || ''),
        currencyCode,
        deliveryInterval,
        deliveryFrequency,
      );

      const recurringDeliveryAndBillingPolicy = {
        interval: deliveryInterval as SellingPlanInterval,
        intervalCount: deliveryFrequency,
      };

      const adjustmentValue =
        discountType === DiscountType.PERCENTAGE
          ? {percentage: discountValue}
          : {fixedValue: discountValue};

      const pricingPolicies = {
        fixed: {
          adjustmentType:
            discountType as SellingPlanPricingPolicyAdjustmentType,
          adjustmentValue,
        },
      };

      return {
        // If the ID is for anew delivery option, dont include it
        ...(id.includes(NEW_DELIVERY_OPTION_ID) ? {} : {id}),
        name: information.sellingPlanName,
        options: [information.option],
        category: 'SUBSCRIPTION' as SellingPlanCategory,
        billingPolicy: {
          recurring: recurringDeliveryAndBillingPolicy,
        },
        deliveryPolicy: {
          recurring: recurringDeliveryAndBillingPolicy,
        },
        pricingPolicies:
          discountValue && offerDiscount ? [pricingPolicies] : [],
      };
    },
  );
}

export function sellingPlanInformation(
  t: TFunction,
  locale: string,
  discountType: DiscountTypeType | undefined,
  discountValue: string | undefined,
  currencyCode: string,
  deliveryIntervalField: string,
  deliveryFrequency: number,
) {
  let deliveryInterval;
  let discountText;

  switch (deliveryIntervalField) {
    case DeliveryFrequencyInterval.Month:
      deliveryInterval = t('summaryCard.monthlyDelivery', {
        intervalCount: deliveryFrequency,
        count: Number(deliveryFrequency),
      });
      break;
    case DeliveryFrequencyInterval.Year:
      deliveryInterval = t('summaryCard.yearlyDelivery', {
        intervalCount: deliveryFrequency,
        count: Number(deliveryFrequency),
      });
      break;
    default:
      deliveryInterval = t('summaryCard.weeklyDelivery', {
        intervalCount: deliveryFrequency,
        count: Number(deliveryFrequency),
      });
  }

  if (!discountValue || !discountType) {
    return {option: deliveryInterval, sellingPlanName: deliveryInterval};
  }

  switch (discountType) {
    case DiscountType.PERCENTAGE:
      discountText = t('summaryCard.percentageOff', {
        amount: discountValue,
      });
      break;
    case DiscountType.FIXED_AMOUNT:
      discountText = t('summaryCard.amountOff', {
        amount: formatPrice({
          currency: currencyCode,
          amount: Number(discountValue),
          locale,
        }),
      });
      break;
    default:
      discountText = t('summaryCard.fixedPrice', {
        amount: formatPrice({
          currency: currencyCode,
          amount: Number(discountValue),
          locale,
        }),
      });
  }

  return {
    option: deliveryInterval,
    sellingPlanName: `${deliveryInterval}, ${discountText}`,
  };
}

/**
 * Gets the selected resource count from a list of selected products.
 * If a product has all variants selected, it will count as 1 resource
 * If a product does not have all variants selected, it will count as [seleceted variant count] resources
 */
export function getSelectedResourceCount(selectedProducts: Product[]) {
  return selectedProducts.reduce((totalCount, selectedProduct) => {
    if (
      selectedProduct.variants &&
      selectedProduct.variants.length > 0 &&
      selectedProduct.variants.length !== selectedProduct.totalVariants
    ) {
      return totalCount + selectedProduct.variants.length;
    }

    return totalCount + 1;
  }, 0);
}
