import {useState, useCallback, useMemo, useEffect} from 'react';
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
import {Form, useNavigation, useFetcher} from '@remix-run/react';

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

export function PostPurchaseUpsellSettings({
  offer,
}: PostPurchaseUpsellSettingsProps) {
  const shopify = useAppBridge();
  const navigation = useNavigation();
  const sellingPlansFetcher = useFetcher<{sellingPlans: SellingPlanInfo[]}>();
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

  // Selling plans: use fetcher data when a new product is picked, otherwise loader data
  const [pickedProductId, setPickedProductId] = useState<string | null>(null);

  const loadingSellingPlans = pickedProductId !== null && sellingPlansFetcher.state === 'loading';
  const fetchedSellingPlans = pickedProductId !== null ? sellingPlansFetcher.data?.sellingPlans : null;
  const availableSellingPlans = fetchedSellingPlans ?? (pickedProductId !== null ? [] : offer.sellingPlans);

  const productInfo = pickedProduct || offer.productInfo;

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
        const numericVariantId = variant.id?.replace(
          'gid://shopify/ProductVariant/',
          '',
        );
        setVariantId(numericVariantId || '');
        setPickedProduct({
          title: product.title,
          variantTitle: variant.title || 'Default',
          imageUrl: product.images?.[0]?.originalSrc || '',
          price: String(variant.price || '0.00'),
        });
        setSellingPlanId('');

        // Fetch selling plans via server route
        const productNumericId = product.id.replace(
          'gid://shopify/Product/',
          '',
        );
        setPickedProductId(productNumericId);
        sellingPlansFetcher.load(
          `/app/selling-plans?productId=${productNumericId}`,
        );
      }
    }
  }, [shopify, sellingPlansFetcher]);

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
                helpText="Percentage off the original price applied to the post-purchase offer."
              />

              {productInfo && (
                loadingSellingPlans ? (
                  <BlockStack gap="200">
                    <Text as="p" variant="bodySm">
                      Subscription selling plan
                    </Text>
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
