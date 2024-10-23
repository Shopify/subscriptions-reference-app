import {nodesFromEdges} from '@shopify/admin-graphql-api-utilities';
import type {TFunction} from 'i18next';
import type {
  CreateSellingPlanGroupMutation as CreateSellingPlanGroupMutationType,
  DeleteSellingPlanGroupMutation as DeleteSellingPlanGroupMutationType,
  SellingPlanGroupQuery as SellingPlanGroupQueryType,
  SellingPlanGroupUpdateMutation as SellingPlanGroupUpdateMutationType,
  SellingPlanGroupUpdateMutationVariables,
  SellingPlanGroupsQuery as SellingPlanGroupsQueryType,
  SellingPlanGroupsQueryVariables,
} from 'types/admin.generated';
import CreateSellingPlanGroupMutation from '~/graphql/CreateSellingPlanGroupMutation';
import DeleteSellingPlanGroupMutation from '~/graphql/DeleteSellingPlanGroupMutation';
import SellingPlanGroupQuery from '~/graphql/SellingPlanGroupQuery';
import SellingPlanGroupUpdateMutation from '~/graphql/SellingPlanGroupUpdateMutation';
import SellingPlanGroupsQuery from '~/graphql/SellingPlanGroupsQuery';
import i18n from '~/i18n/i18next.server';
import {
  NEW_DELIVERY_OPTION_ID,
  formatSelectedProducts,
  getSellingPlansFromDiscountDeliveryOptions,
  sellingPlanInformation,
} from '~/routes/app.plans.$id/utils';
import type {
  DiscountDeliveryOption,
  DiscountTypeType,
} from '~/routes/app.plans.$id/validator';
import {DiscountType} from '~/routes/app.plans.$id/validator';
import type {
  GraphQLClient,
  PaginationInfo,
  RecurringPolicy,
  SellingPlanGroup,
  SellingPlanGroupProduct,
  SellingPlanGroupProductVariant,
  ShopLocale,
  TranslationResource,
} from '~/types';
import type {
  SellingPlanGroupListItemSellingPlan,
  SellingPlanPricingPolicy,
  SellingPlanGroupListItem,
} from '~/types/plans';
import {SellingPlanAdjustment} from '~/types/plans';
import {
  createTranslationFunctions,
  getShopLocales,
  getTranslatableResources,
  registerTranslations,
} from '../Translations/Translations.server';

function formatSellingPlanGroupProducts(products: {
  edges: {
    node: {
      id: string;
      title: string;
    };
  }[];
}): SellingPlanGroupProduct[] {
  return products?.edges
    ? nodesFromEdges(products?.edges).map((product) => ({
        id: product.id,
        title: product.title,
      }))
    : [];
}

function formatSellingPlanGroupSellingPlans(
  sellingPlans: SellingPlanGroupsQueryType['sellingPlanGroups']['edges'][0]['node']['sellingPlans'],
): SellingPlanGroupListItemSellingPlan[] {
  return nodesFromEdges(sellingPlans.edges).map((sellingPlan) => {
    return {
      deliveryPolicy: sellingPlan.deliveryPolicy as RecurringPolicy,
      pricingPolicies:
        sellingPlan.pricingPolicies as SellingPlanPricingPolicy[],
    };
  });
}

function formatSellingPlanGroupsData(
  data: SellingPlanGroupsQueryType,
): SellingPlanGroupListItem[] {
  return nodesFromEdges(data.sellingPlanGroups.edges).map(
    (sellingPlanGroup) => ({
      id: sellingPlanGroup.id,
      merchantCode: sellingPlanGroup.merchantCode,
      productsCount: sellingPlanGroup.productsCount?.count,
      productVariantsCount: sellingPlanGroup.productVariantsCount?.count,
      products: formatSellingPlanGroupProducts(sellingPlanGroup.products),
      sellingPlans: formatSellingPlanGroupSellingPlans(
        sellingPlanGroup.sellingPlans,
      ),
      sellingPlansPageInfo: sellingPlanGroup.sellingPlans
        ?.pageInfo as PaginationInfo,
    }),
  );
}

export async function getSellingPlanGroups(
  graphql: GraphQLClient,
  variables: SellingPlanGroupsQueryVariables,
) {
  const response = await graphql(SellingPlanGroupsQuery, {
    variables: variables,
  });

  const {data} = await response.json();

  if (!data) {
    throw new Error('Unable to load selling plan groups');
  }

  return {
    sellingPlanGroups: formatSellingPlanGroupsData(data),
    pageInfo: data?.sellingPlanGroups.pageInfo as PaginationInfo,
  };
}

interface CreateSellingPlanGroupInput {
  name: string;
  merchantCode: string;
  productIds: string[];
  productVariantIds: string[];
  discountDeliveryOptions: DiscountDeliveryOption[];
  discountType: DiscountTypeType;
  offerDiscount: boolean;
  currencyCode: string;
}

interface UpdateSellingPlanGroupVariables {
  id: string;
  name: string;
  merchantCode: string;
  sellingPlansToDelete: string[];
  discountDeliveryOptions: DiscountDeliveryOption[];
  productIdsToAdd: string[];
  productIdsToRemove: string[];
  productVariantIdsToAdd: string[];
  productVariantIdsToRemove: string[];
  discountType: DiscountTypeType;
  offerDiscount: boolean;
  currencyCode: string;
}

export async function getSellingPlanGroup(
  graphql: GraphQLClient,
  variables: {id: string; firstProducts: number},
) {
  const response = await graphql(SellingPlanGroupQuery, {
    variables: variables,
  });
  const {data} = await response.json();

  let sellingPlanGroup = data?.sellingPlanGroup;

  while (
    sellingPlanGroup?.productVariants.pageInfo.hasNextPage ||
    sellingPlanGroup?.products.pageInfo.hasNextPage
  ) {
    const response = await graphql(SellingPlanGroupQuery, {
      variables: {
        ...variables,
        productsAfter: sellingPlanGroup.products.pageInfo.endCursor,
        variantsAfter: sellingPlanGroup.productVariants.pageInfo.endCursor,
      },
    });

    const {data} = await response.json();

    const sellingPlanGroupWithProducts = data?.sellingPlanGroup;

    if (!sellingPlanGroupWithProducts) {
      throw new Error('Unable to load selling plan group products');
    }

    sellingPlanGroup = {
      ...sellingPlanGroup,
      products: {
        edges: [
          ...sellingPlanGroup.products.edges,
          ...sellingPlanGroupWithProducts.products.edges,
        ],
        pageInfo: sellingPlanGroupWithProducts.products.pageInfo,
      },
      productVariants: {
        edges: [
          ...sellingPlanGroup.productVariants.edges,
          ...sellingPlanGroupWithProducts.productVariants.edges,
        ],
        pageInfo: sellingPlanGroupWithProducts.productVariants.pageInfo,
      },
    };
  }

  return sellingPlanGroup ? formatSellingPlanGroup(sellingPlanGroup) : null;
}

function formatSellingPlanGroup(
  sellingPlanGroup: NonNullable<SellingPlanGroupQueryType['sellingPlanGroup']>,
): SellingPlanGroup {
  const sellingPlans = nodesFromEdges(
    sellingPlanGroup.sellingPlans.edges || [],
  );

  const {
    products: {edges: productEdges},
    productVariants: {edges: productVariantEdges},
  } = sellingPlanGroup;

  const productNodes = nodesFromEdges(
    productEdges,
  ) as SellingPlanGroupProduct[];
  const productVariantNodes = nodesFromEdges(
    productVariantEdges,
  ) as SellingPlanGroupProductVariant[];

  const products = formatSelectedProducts(productNodes, productVariantNodes);

  const selectedProductIds = productNodes
    .map((product) => product.id)
    .join(',');

  const selectedProductVariantIds = productVariantNodes
    .map((productVariant) => productVariant.id)
    .join(',');

  const discountType =
    sellingPlans[0]?.pricingPolicies[0]?.adjustmentType ||
    DiscountType.PERCENTAGE;

  const discountDeliveryOptions = sellingPlans.map((sellingPlan) => {
    const {billingPolicy, pricingPolicies} = sellingPlan;

    const isRecurringPolicy = 'interval' in billingPolicy;
    const interval = isRecurringPolicy ? billingPolicy.interval : '';
    const intervalCount = isRecurringPolicy ? billingPolicy.intervalCount : '';
    const firstPricingPolicy = pricingPolicies[0];
    const hasAdjustment =
      firstPricingPolicy && 'adjustmentValue' in firstPricingPolicy;
    const percentageValue =
      hasAdjustment &&
      'percentage' in firstPricingPolicy.adjustmentValue &&
      firstPricingPolicy.adjustmentValue.percentage;
    const amountValue =
      hasAdjustment &&
      'amount' in firstPricingPolicy.adjustmentValue &&
      firstPricingPolicy.adjustmentValue.amount;

    const discountValue = percentageValue || amountValue || '';

    return {
      id: sellingPlan.id,
      deliveryInterval: interval as DiscountDeliveryOption['deliveryInterval'],
      deliveryFrequency: intervalCount || 0,
      discountValue: discountValue,
    };
  });

  const offerDiscount = discountDeliveryOptions.length
    ? discountDeliveryOptions.some((discountDeliveryOption) =>
        Boolean(discountDeliveryOption.discountValue),
      )
    : true;

  const formattedOfferDiscount = offerDiscount ? 'true' : '';

  return {
    merchantCode: sellingPlanGroup.merchantCode,
    planName: sellingPlanGroup.name,
    products,
    offerDiscount: formattedOfferDiscount,
    discountType,
    discountDeliveryOptions,
    selectedProductIds,
    selectedProductVariantIds,
  };
}

function extractSellingPlanDetails(
  graphqlSellingPlan: SellingPlanGroupListItemSellingPlan,
):
  | {
      deliveryPolicy: RecurringPolicy;
      discountType?: DiscountTypeType;
      discountValue?: number;
    }
  | undefined {
  const {deliveryPolicy, pricingPolicies} = graphqlSellingPlan;

  if (!('interval' in deliveryPolicy)) return;

  let pricingPolicy;
  if (pricingPolicies && pricingPolicies.length) {
    pricingPolicy = pricingPolicies[0];
  }

  if (!pricingPolicy) {
    return {
      deliveryPolicy,
    };
  }

  const discountType = pricingPolicy.adjustmentType;
  const discountValue =
    discountType == SellingPlanAdjustment.Percentage
      ? pricingPolicy.adjustmentValue.percentage
      : pricingPolicy.adjustmentValue.amount;

  return {
    discountType,
    discountValue,
    deliveryPolicy,
  };
}

/**
 * Builds the translations array for all locales for a single selling plan
 * where each entry corresponds to 1 selling plan field for 1 locale
 * ex: [{locale: 'en', key: 'name', value: 'Monthly 10% off'}, {locale: 'fr', key: 'name', value: 'Mensuel 10% de réduction']
 */
function buildSingleSellingPlanTranslations(
  sellingPlan: SellingPlanGroupListItemSellingPlan,
  currencyCode: string,
  translationFunctions: {locale: string; t: TFunction}[],
  translationResource: TranslationResource,
) {
  const sellingPlanDetails = extractSellingPlanDetails(sellingPlan);

  if (!sellingPlanDetails) {
    return [];
  }

  const {discountValue, deliveryPolicy, discountType} = sellingPlanDetails;
  const {interval, intervalCount} = deliveryPolicy;

  return translationResource.translatableContent.flatMap(({key, digest}) =>
    translationFunctions.flatMap(({locale, t}) => {
      const sellingPlanInfo = sellingPlanInformation(
        t,
        locale,
        discountType,
        discountValue?.toString(),
        currencyCode,
        interval,
        intervalCount,
      );

      return [
        {
          key,
          value:
            key === 'name'
              ? sellingPlanInfo.sellingPlanName
              : sellingPlanInfo.option,
          translatableContentDigest: digest!,
          locale,
        },
      ];
    }),
  );
}

export async function createSellingPlanTranslations(
  graphql: GraphQLClient,
  sellingPlans: SellingPlanGroupListItemSellingPlan[],
  shopLocalesWithoutPrimary: ShopLocale[],
  currencyCode: string,
) {
  const sellingPlanIds = sellingPlans.map(({id}) => id!);

  const translationFunctions = await createTranslationFunctions(
    shopLocalesWithoutPrimary,
    'app.plans.details',
  );

  const translationResources = await getTranslatableResources(
    graphql,
    sellingPlanIds,
  );

  // 1 translation resource corresponds to 1 selling plan
  for (const translationResource of translationResources) {
    const {resourceId} = translationResource;

    const correspondingSellingPlan = sellingPlans.find(
      (sellingPlan) => sellingPlan.id === resourceId,
    )!;

    const currentSellingPlanTranslations = buildSingleSellingPlanTranslations(
      correspondingSellingPlan,
      currencyCode,
      translationFunctions,
      translationResource,
    );

    await registerTranslations(
      graphql,
      resourceId,
      currentSellingPlanTranslations,
    );
  }
}

export async function createSellingPlanGroup(
  graphql,
  input: CreateSellingPlanGroupInput,
) {
  const {
    name,
    merchantCode,
    productIds,
    productVariantIds,
    discountDeliveryOptions,
    discountType,
    offerDiscount,
    currencyCode,
  } = input;

  const {primaryLocale} = await getShopLocales(graphql);

  const t = await i18n.getFixedT(primaryLocale, 'app.plans.details');

  const sellingPlansToCreate = getSellingPlansFromDiscountDeliveryOptions(
    discountDeliveryOptions,
    discountType,
    offerDiscount,
    currencyCode,
    t,
    primaryLocale,
  );

  const response = await graphql(CreateSellingPlanGroupMutation, {
    variables: {
      input: {
        name,
        merchantCode,
        options: [t('creationMutation.options.deliveryFrequency')],
        sellingPlansToCreate,
      },
      resources: {
        productIds,
        productVariantIds,
      },
    },
  });

  const {
    data: {sellingPlanGroupCreate},
  } = (await response.json()) as {data: CreateSellingPlanGroupMutationType};

  return {
    sellingPlanGroupId: sellingPlanGroupCreate?.sellingPlanGroup?.id,
    userErrors: sellingPlanGroupCreate?.userErrors,
  };
}

export async function deleteSellingPlanGroup(
  graphql: GraphQLClient,
  sellingPlanGroupId: string,
) {
  const response = await graphql(DeleteSellingPlanGroupMutation, {
    variables: {
      id: sellingPlanGroupId,
    },
  });

  return (await response.json()) as {data: DeleteSellingPlanGroupMutationType};
}

export async function updateSellingPlanGroup(
  graphql,
  input: UpdateSellingPlanGroupVariables,
) {
  const {primaryLocale} = await getShopLocales(graphql);
  const t = await i18n.getFixedT(primaryLocale, 'app.plans.details');

  const sellingPlans = getSellingPlansFromDiscountDeliveryOptions(
    input.discountDeliveryOptions,
    input.discountType,
    input.offerDiscount,
    input.currencyCode,
    t,
    primaryLocale,
  );

  let sellingPlansToCreate: ReturnType<
    typeof getSellingPlansFromDiscountDeliveryOptions
  > = [];
  let sellingPlansToUpdate: ReturnType<
    typeof getSellingPlansFromDiscountDeliveryOptions
  > = [];

  sellingPlans.forEach((sellingPlan) => {
    if (sellingPlan.id) {
      sellingPlansToUpdate.push(sellingPlan);
    } else {
      sellingPlansToCreate.push(sellingPlan);
    }
  });

  const sellingPlansToDelete = input.sellingPlansToDelete.filter(
    (id) => !id.includes(NEW_DELIVERY_OPTION_ID),
  );

  const variables: SellingPlanGroupUpdateMutationVariables = {
    id: input.id,
    input: {
      name: input.name,
      merchantCode: input.merchantCode,
      sellingPlansToDelete,
      sellingPlansToCreate,
      sellingPlansToUpdate,
      options: [t('creationMutation.options.deliveryFrequency')],
    },
    productIdsToAdd: input.productIdsToAdd,
    productIdsToRemove: input.productIdsToRemove,
    productVariantIdsToAdd: input.productVariantIdsToAdd,
    productVariantIdsToRemove: input.productVariantIdsToRemove,
  };

  const response = await graphql(SellingPlanGroupUpdateMutation, {
    variables,
  });

  const {
    data: {
      sellingPlanGroupUpdate,
      sellingPlanGroupAddProducts,
      sellingPlanGroupRemoveProducts,
      sellingPlanGroupAddProductVariants,
      sellingPlanGroupRemoveProductVariants,
    },
  } = (await response.json()) as {data: SellingPlanGroupUpdateMutationType};

  return {
    sellingPlanGroupId: sellingPlanGroupUpdate?.sellingPlanGroup?.id,
    userErrors: [
      ...(sellingPlanGroupUpdate?.userErrors ?? []),
      ...(sellingPlanGroupAddProducts?.userErrors ?? []),
      ...(sellingPlanGroupRemoveProducts?.userErrors ?? []),
      ...(sellingPlanGroupAddProductVariants?.userErrors ?? []),
      ...(sellingPlanGroupRemoveProductVariants?.userErrors ?? []),
    ],
  };
}
