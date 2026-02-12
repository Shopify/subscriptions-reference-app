import {useState, useCallback} from 'react';
import {
  BlockStack,
  Box,
  Button,
  Card,
  Checkbox,
  FormLayout,
  InlineGrid,
  InlineStack,
  Select,
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
  const [pickedProduct, setPickedProduct] = useState<{
    title: string;
    variantTitle: string;
    imageUrl: string;
    price: string;
  } | null>(null);

  const productInfo = pickedProduct || offer.productInfo;

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
        // Clear selling plan since product changed — save first to load new selling plans
        setSellingPlanId('');
      }
    }
  }, [shopify]);

  const sellingPlanOptions = [
    {label: 'None (one-time only)', value: ''},
    ...offer.sellingPlans.map((sp) => ({
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

            <Text as="h2" variant="headingSm">
              Product
            </Text>

            {productInfo ? (
              <InlineStack gap="400" blockAlign="center" wrap={false}>
                <Box width="1500">
                  <Thumbnail
                    source={productInfo.imageUrl || ImageIcon}
                    alt={productInfo.title}
                    size="medium"
                  />
                </Box>
                <div style={{flexGrow: 1}}>
                  <BlockStack>
                    <Text as="span" fontWeight="semibold">
                      {productInfo.title}
                    </Text>
                    <Text as="span" tone="subdued">
                      {productInfo.variantTitle} — ${productInfo.price}
                    </Text>
                  </BlockStack>
                </div>
                <Button onClick={selectProduct}>Change</Button>
              </InlineStack>
            ) : (
              <Button onClick={selectProduct}>Select product</Button>
            )}

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
              />

              {offer.sellingPlans.length > 0 && (
                <Select
                  label="Subscription selling plan"
                  options={sellingPlanOptions}
                  value={sellingPlanId}
                  onChange={setSellingPlanId}
                  helpText="Select a selling plan to enable subscription upsells. Save after selecting a new product to load its selling plans."
                />
              )}

              {pickedProduct && offer.sellingPlans.length === 0 && (
                <Text as="p" tone="subdued" variant="bodySm">
                  Save to load selling plans for the selected product.
                </Text>
              )}
            </FormLayout>

            <InlineStack align="end">
              <Button submit loading={isSubmitting} variant="primary">
                Save
              </Button>
            </InlineStack>
          </BlockStack>
        </Form>
      </Card>
    </InlineGrid>
  );
}
