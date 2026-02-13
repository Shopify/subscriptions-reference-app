import {useState, useCallback, useMemo} from 'react';
import {
  BlockStack,
  Box,
  Button,
  Card,
  Checkbox,
  Divider,
  FormLayout,
  InlineGrid,
  InlineStack,
  Select,
  Spinner,
  Text,
  TextField,
  Thumbnail,
} from '@shopify/polaris';
import {ImageIcon} from '@shopify/polaris-icons';
import {useAppBridge} from '@shopify/app-bridge-react';
import {Form, useNavigation} from '@remix-run/react';

interface SellingPlanInfo {
  id: string;
  name: string;
}

interface ProductInfo {
  title: string;
  variantTitle: string;
  imageUrl: string;
  price: string;
}

export interface PostPurchaseOfferData {
  enabled: boolean;
  variantId: string;
  discountPercent: number;
  sellingPlanId: string;
  productInfo: ProductInfo | null;
  sellingPlans: SellingPlanInfo[];
}

interface PostPurchaseUpsellSettingsProps {
  offer: PostPurchaseOfferData;
}

const SELLING_PLANS_QUERY = `
  query ProductSellingPlans($id: ID!) {
    product(id: $id) {
      sellingPlanGroups(first: 5) {
        nodes {
          sellingPlans(first: 10) {
            nodes {
              id
              name
            }
          }
        }
      }
    }
  }
`;

async function fetchSellingPlans(
  productGid: string,
): Promise<SellingPlanInfo[]> {
  const response = await fetch('shopify:admin/api/2025-04/graphql.json', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      query: SELLING_PLANS_QUERY,
      variables: {id: productGid},
    }),
  });

  const json = await response.json();
  const data = json.data;
  const plans: SellingPlanInfo[] = [];

  for (const group of data?.product?.sellingPlanGroups?.nodes || []) {
    for (const plan of group.sellingPlans?.nodes || []) {
      plans.push({
        id: plan.id.replace('gid://shopify/SellingPlan/', ''),
        name: plan.name,
      });
    }
  }

  return plans;
}

export function PostPurchaseUpsellSettings({
  offer,
}: PostPurchaseUpsellSettingsProps) {
  const shopify = useAppBridge();
  const navigation = useNavigation();
  const isSubmitting =
    navigation.state === 'submitting' &&
    navigation.formData?.get('_action') === 'postPurchaseOffer';

  const [enabled, setEnabled] = useState(offer.enabled);
  const [variantId, setVariantId] = useState(offer.variantId);
  const [discountPercent, setDiscountPercent] = useState(
    String(offer.discountPercent),
  );
  const [sellingPlanId, setSellingPlanId] = useState(offer.sellingPlanId);

  // Local product info from resource picker (overrides loader data when user picks a new product)
  const [pickedProduct, setPickedProduct] = useState<ProductInfo | null>(null);

  // Selling plans fetched for the picked product (null = using loader data)
  const [pickedSellingPlans, setPickedSellingPlans] = useState<
    SellingPlanInfo[] | null
  >(null);
  const [loadingSellingPlans, setLoadingSellingPlans] = useState(false);

  const productInfo = pickedProduct || offer.productInfo;
  const availableSellingPlans = pickedSellingPlans ?? offer.sellingPlans;

  // Track dirty state
  const isDirty = useMemo(() => {
    return (
      enabled !== offer.enabled ||
      variantId !== offer.variantId ||
      discountPercent !== String(offer.discountPercent) ||
      sellingPlanId !== offer.sellingPlanId
    );
  }, [enabled, variantId, discountPercent, sellingPlanId, offer]);

  const selectProduct = useCallback(async () => {
    const selected = await shopify.resourcePicker({
      type: 'product',
      action: 'select',
      multiple: false,
      filter: {
        variants: true,
      },
    });

    if (selected && selected.length > 0) {
      const product = selected[0];
      const variant =
        product.variants && product.variants.length > 0
          ? product.variants[0]
          : null;

      if (variant) {
        const numericId = variant.id?.replace(
          'gid://shopify/ProductVariant/',
          '',
        );
        setVariantId(numericId || '');
        setPickedProduct({
          title: product.title,
          variantTitle: variant.title || 'Default',
          imageUrl: product.images?.[0]?.originalSrc || '',
          price: String(variant.price || '0.00'),
        });
        setSellingPlanId('');

        // Fetch selling plans for the newly picked product
        setLoadingSellingPlans(true);
        try {
          const plans = await fetchSellingPlans(product.id);
          setPickedSellingPlans(plans);
        } catch (e) {
          console.error('Failed to fetch selling plans:', e);
          setPickedSellingPlans([]);
        } finally {
          setLoadingSellingPlans(false);
        }
      }
    }
  }, [shopify]);

  const sellingPlanOptions = [
    {label: 'None (one-time only)', value: ''},
    ...availableSellingPlans.map((sp) => ({
      label: sp.name,
      value: sp.id,
    })),
  ];

  return (
    <InlineGrid columns={{xs: '1fr', md: '2fr 5fr'}} gap="400">
      <Box as="section" paddingBlockStart="400">
        <BlockStack gap="200">
          <Text as="h3" variant="headingMd">
            Post-purchase upsell
          </Text>
          <Text as="p" variant="bodyMd">
            Configure the product offered to customers after checkout.
          </Text>
        </BlockStack>
      </Box>
      <Card>
        <Form method="post">
          <input type="hidden" name="_action" value="postPurchaseOffer" />
          <input type="hidden" name="variantId" value={variantId} />
          <input type="hidden" name="sellingPlanId" value={sellingPlanId} />
          <input type="hidden" name="discountPercent" value={discountPercent} />
          <input
            type="hidden"
            name="enabled"
            value={enabled ? 'true' : 'false'}
          />

          <BlockStack gap="400">
            <Checkbox
              label="Enable post-purchase upsell"
              checked={enabled}
              onChange={setEnabled}
            />

            <Divider />

            <Text as="h2" variant="headingSm">
              Product
            </Text>

            {productInfo ? (
              <InlineStack gap="400" blockAlign="center" wrap={false}>
                <Thumbnail
                  source={productInfo.imageUrl || ImageIcon}
                  alt={productInfo.title}
                  size="medium"
                />
                <Box minWidth="0" width="100%">
                  <BlockStack>
                    <Text as="span" fontWeight="semibold" truncate>
                      {productInfo.title}
                    </Text>
                    <Text as="span" tone="subdued">
                      {productInfo.variantTitle} — ${productInfo.price}
                    </Text>
                  </BlockStack>
                </Box>
                <Button onClick={selectProduct} disabled={!enabled}>
                  Change
                </Button>
              </InlineStack>
            ) : (
              <Box
                padding="400"
                borderWidth="025"
                borderColor="border"
                borderRadius="200"
              >
                <InlineStack align="center">
                  <BlockStack gap="200" inlineAlign="center">
                    <Text as="p" tone="subdued" alignment="center">
                      No product selected
                    </Text>
                    <Button onClick={selectProduct} disabled={!enabled}>
                      Select product
                    </Button>
                  </BlockStack>
                </InlineStack>
              </Box>
            )}

            <Divider />

            <FormLayout>
              <TextField
                label="Discount percentage"
                value={discountPercent}
                onChange={setDiscountPercent}
                type="number"
                min={0}
                max={100}
                suffix="%"
                autoComplete="off"
                disabled={!enabled}
                helpText="Percentage off the original price for one-time purchases."
              />

              {productInfo && (
                loadingSellingPlans ? (
                  <BlockStack gap="200">
                    <Text as="p" variant="bodySm">Subscription selling plan</Text>
                    <InlineStack gap="200" blockAlign="center">
                      <Spinner size="small" />
                      <Text as="span" tone="subdued" variant="bodySm">
                        Loading selling plans…
                      </Text>
                    </InlineStack>
                  </BlockStack>
                ) : (
                  <Select
                    label="Subscription selling plan"
                    options={
                      availableSellingPlans.length > 0
                        ? sellingPlanOptions
                        : [{label: 'None (one-time only)', value: ''}]
                    }
                    value={
                      availableSellingPlans.length > 0 ? sellingPlanId : ''
                    }
                    onChange={setSellingPlanId}
                    disabled={!enabled || availableSellingPlans.length === 0}
                    helpText={
                      availableSellingPlans.length > 0
                        ? 'Select a selling plan to offer a subscription option alongside one-time purchase.'
                        : 'This product has no selling plans. Add a selling plan to the product to enable subscription upsells.'
                    }
                  />
                )
              )}
            </FormLayout>

            <InlineStack align="end">
              <Button
                submit
                loading={isSubmitting}
                variant="primary"
                disabled={!isDirty}
              >
                Save
              </Button>
            </InlineStack>
          </BlockStack>
        </Form>
      </Card>
    </InlineGrid>
  );
}
