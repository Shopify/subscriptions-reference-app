import type {GraphQLClient} from '~/types';
import type {PostPurchaseOffer} from '@prisma/client';

interface AddVariantChange {
  type: "add_variant";
  variantID: number;
  quantity: number;
  discount: {
    value: number;
    valueType: "percentage" | "fixed_amount";
    title: string;
  };
}

interface AddSubscriptionChange {
  type: "add_subscription";
  variantID: number;
  quantity: number;
  discount: {
    value: number;
    valueType: "percentage" | "fixed_amount";
    title: string;
  };
  sellingPlanID: number;
  initialShippingPrice: string;
  recurringShippingPrice: string;
}

interface AddShippingLineChange {
  type: "add_shipping_line";
  price: string;
  title: string;
}

export type OfferChange = AddVariantChange | AddSubscriptionChange | AddShippingLineChange;

export interface SellingPlanOption {
  label: string;
  value: string;
  sellingPlanName: string;
  interval: string;
  intervalCount: number;
  discount: number;
}

export interface Offer {
  id: number;
  productTitle: string;
  productImageURL: string;
  productDescription: string[];
  originalPrice: string;
  discountedPrice: string;
  changes: OfferChange[];
  hasSubscriptionOption: boolean;
  sellingPlanOptions?: SellingPlanOption[];
}

const VARIANT_QUERY = `#graphql
  query VariantDetails($id: ID!) {
    node(id: $id) {
      ... on ProductVariant {
        id
        title
        price
        product {
          title
          description
          featuredMedia {
            preview {
              image {
                url
              }
            }
          }
          sellingPlanGroups(first: 5) {
            nodes {
              sellingPlans(first: 10) {
                nodes {
                  id
                  name
                  billingPolicy {
                    ... on SellingPlanRecurringBillingPolicy {
                      interval
                      intervalCount
                    }
                  }
                  pricingPolicies {
                    ... on SellingPlanFixedPricingPolicy {
                      adjustmentType
                      adjustmentValue {
                        ... on SellingPlanPricingPolicyPercentageValue {
                          percentage
                        }
                      }
                    }
                    ... on SellingPlanRecurringPricingPolicy {
                      adjustmentType
                      adjustmentValue {
                        ... on SellingPlanPricingPolicyPercentageValue {
                          percentage
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export async function fetchOfferDetails(
  graphql: GraphQLClient,
  config: PostPurchaseOffer,
): Promise<Offer | null> {
  if (!config.variantId) return null;

  const variantGid = config.variantId.startsWith('gid://')
    ? config.variantId
    : `gid://shopify/ProductVariant/${config.variantId}`;

  const response = await graphql(VARIANT_QUERY, {
    variables: {id: variantGid},
  });

  const {data} = await response.json();
  const variant = data?.node;

  if (!variant) return null;

  const product = variant.product;
  const price = variant.price;
  const imageUrl = product?.featuredMedia?.preview?.image?.url || '';
  const discountedPrice = (
    parseFloat(price) *
    (1 - config.discountPercent / 100)
  ).toFixed(2);

  // Extract numeric variant ID for the changeset
  const numericVariantId = parseInt(
    variantGid.replace('gid://shopify/ProductVariant/', ''),
    10,
  );

  // Build selling plan options from the product's selling plans
  const sellingPlanOptions: SellingPlanOption[] = [];
  const hasSubscriptionOption = !!config.sellingPlanId;

  if (hasSubscriptionOption) {
    // Add one-time purchase option first
    sellingPlanOptions.push({
      label: `One-time purchase — $${price}`,
      value: 'one-time',
      sellingPlanName: '',
      interval: '',
      intervalCount: 0,
      discount: config.discountPercent,
    });

    // Find matching selling plans from the product
    for (const group of product?.sellingPlanGroups?.nodes || []) {
      for (const plan of group.sellingPlans?.nodes || []) {
        const planNumericId = plan.id.replace('gid://shopify/SellingPlan/', '');
        if (planNumericId !== config.sellingPlanId) continue;

        const interval = plan.billingPolicy?.interval || 'MONTH';
        const intervalCount = plan.billingPolicy?.intervalCount || 1;

        // Get discount from the selling plan's pricing policies
        let planDiscount = 0;
        for (const policy of plan.pricingPolicies || []) {
          if (policy.adjustmentType === 'PERCENTAGE') {
            planDiscount = policy.adjustmentValue?.percentage || 0;
          }
        }

        const planPrice = (
          parseFloat(price) *
          (1 - planDiscount / 100)
        ).toFixed(2);

        sellingPlanOptions.push({
          label: `${plan.name} — $${planPrice} (${planDiscount}% off)`,
          value: planNumericId,
          sellingPlanName: plan.name,
          interval,
          intervalCount,
          discount: planDiscount,
        });
      }
    }
  }

  return {
    id: 1,
    productTitle: product?.title || '',
    productImageURL: imageUrl,
    productDescription: product?.description
      ? [product.description]
      : [''],
    originalPrice: price,
    discountedPrice,
    hasSubscriptionOption,
    sellingPlanOptions: hasSubscriptionOption ? sellingPlanOptions : undefined,
    changes: [
      {
        type: 'add_variant',
        variantID: numericVariantId,
        quantity: 1,
        discount: {
          value: config.discountPercent,
          valueType: 'percentage',
          title: `Post-purchase ${config.discountPercent}% off`,
        },
      },
    ],
  };
}

export function buildChangesForPlan(
  offer: Offer,
  sellingPlanId: string,
): OfferChange[] {
  if (sellingPlanId === "one-time") {
    return offer.changes;
  }

  const plan = offer.sellingPlanOptions?.find(
    (opt) => opt.value === sellingPlanId,
  );

  if (!plan) return offer.changes;

  const variantID = (offer.changes[0] as AddVariantChange).variantID;

  return [
    {
      type: "add_subscription",
      variantID,
      quantity: 1,
      discount: {
        value: plan.discount,
        valueType: "percentage",
        title: `Subscribe & save ${plan.discount}%`,
      },
      sellingPlanID: parseInt(sellingPlanId, 10),
      initialShippingPrice: "0.00",
      recurringShippingPrice: "0.00",
    },
    {
      type: "add_shipping_line",
      price: "0.00",
      title: "Free shipping on subscriptions",
    },
  ];
}
