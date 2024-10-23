import {
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Icon,
  InlineError,
  InlineStack,
  Link,
  Scrollable,
  Text,
  TextField,
  Thumbnail,
} from '@shopify/polaris';
import {ImageIcon, SearchIcon, XIcon} from '@shopify/polaris-icons';
import {useMemo} from 'react';
import {useFormContext} from '@rvf/remix';

import {useTranslation} from 'react-i18next';
import {getSelectedResourceCount} from '~/routes/app.plans.$id/utils';
import type {Product} from '~/types';
import {MAX_SELLING_PLAN_PRODUCTS} from '~/utils/constants';
import {findUniqueElements} from '~/utils/helpers/other';
import {useAppBridge} from '@shopify/app-bridge-react';

export interface ProductPickerCardProps {
  initialSelectedVariantIds: string;
  initialSelectedProductIds: string;
}

export function ProductPickerCard({
  initialSelectedVariantIds,
  initialSelectedProductIds,
}: ProductPickerCardProps) {
  const {t} = useTranslation('app.plans.details');
  const {t: commonTranslate} = useTranslation();
  const shopify = useAppBridge();

  const form = useFormContext<{
    products: Product[];
    selectedProductIds: string;
    selectedVariantIds: string;
  }>();

  const selectedProducts = form.value('products') || [];
  const selectedProductsError = form.error('selectedProductIds');
  const selectedVariantsError = form.error('selectedVariantIds');

  const initialSelectedProductIdsArray = useMemo(
    () => initialSelectedProductIds.split(','),
    [initialSelectedProductIds],
  );
  const initialSelectedVariantIdsArray = useMemo(
    () => initialSelectedVariantIds.split(','),
    [initialSelectedVariantIds],
  );

  const selectedCount = getSelectedResourceCount(selectedProducts);

  const selectedProductIdsArray = selectedProducts.flatMap(
    ({areAllVariantsSelected, id}) => {
      return areAllVariantsSelected ? [id] : [];
    },
  );

  // selected variants are only surfaced as part of the variant array
  // under the selected products
  const selectedVariantIdsArray = selectedProducts.flatMap(
    ({variants, areAllVariantsSelected}) => {
      if (variants && !areAllVariantsSelected) {
        return variants.map((variant) => variant.id!);
      }

      return [];
    },
  );

  const productIdsToAdd = findUniqueElements(
    selectedProductIdsArray,
    initialSelectedProductIdsArray,
  ).join(',');

  const variantIdsToAdd = findUniqueElements(
    selectedVariantIdsArray,
    initialSelectedVariantIdsArray,
  ).join(',');

  const productIdsToRemove = findUniqueElements(
    initialSelectedProductIdsArray,
    selectedProductIdsArray,
  ).join(',');

  const variantIdsToRemove = findUniqueElements(
    initialSelectedVariantIdsArray,
    selectedVariantIdsArray,
  ).join(',');

  function onSearchChange(newValue: string) {
    if (newValue.length > 0) {
      selectProducts(selectedProducts, newValue);
    }
  }

  function removeProduct(productId: string) {
    form.setValue(
      'products',
      selectedProducts.filter((product) => product.id !== productId),
    );
  }

  async function selectProducts(
    selectedProducts: Product[],
    searchQuery?: string,
  ) {
    const selectedItems = await shopify.resourcePicker({
      selectionIds: selectedProducts.map((product) => ({
        id: product.id!,
        variants: product.variants?.map((variant) => ({id: variant.id!})) ?? [],
      })),
      multiple: true,
      query: searchQuery,
      type: 'product',
      action: 'select',
      filter: {
        query: 'bundles:false',
      },
    });

    if (selectedItems) {
      form.setValue(
        'products',
        selectedItems.map((selectedProduct) => {
          const areAllVariantsSelected = (() => {
            if (
              'hasOnlyDefaultVariant' in selectedProduct &&
              selectedProduct.hasOnlyDefaultVariant
            ) {
              return true;
            }

            if (
              'totalVariants' in selectedProduct &&
              'variants' in selectedProduct &&
              selectedProduct.variants.length > 0
            ) {
              return (
                selectedProduct.totalVariants ===
                selectedProduct.variants.length
              );
            }

            return true;
          })();

          return {
            ...selectedProduct,
            areAllVariantsSelected,
          };
        }),
      );
    }
  }

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h1" variant="headingMd" fontWeight="semibold">
          {t('productCard.title')}
        </Text>
        {selectedCount > MAX_SELLING_PLAN_PRODUCTS ? (
          <Banner>
            <Text as="p" variant="bodyMd">
              {t('productCard.maxProductsWarning', {
                count: MAX_SELLING_PLAN_PRODUCTS,
              })}
            </Text>
          </Banner>
        ) : null}
        <InlineStack gap="400" align="start">
          <div style={{flexGrow: 1}}>
            {/* There is no way to get back the search query value changes from the resource picker
            so no point in assigning it to a state variable */}
            <TextField
              prefix={<Icon source={SearchIcon} />}
              type="search"
              label=""
              id="productSearch"
              name="productSearch"
              placeholder={t('productCard.searchProducts')}
              autoComplete="off"
              value={''}
              onChange={onSearchChange}
            />
          </div>
          <Button
            onClick={() => {
              selectProducts(selectedProducts);
            }}
          >
            {t('productCard.browse')}
          </Button>
        </InlineStack>
        <Scrollable vertical horizontal={false} style={{maxHeight: '364px'}}>
          <BlockStack gap="400">
            {selectedProducts
              ? selectedProducts.map(
                  ({id, images, variants, title, totalVariants}, index) => {
                    const hasImage = images && images.length;

                    return (
                      <InlineStack
                        key={`${id}-${index}`}
                        gap="400"
                        blockAlign="center"
                        wrap={false}
                      >
                        {/* Thumbnails auto-resize by default
                  box them to make sure they are always the same width */}
                        <Box width="1500">
                          <Thumbnail
                            source={
                              hasImage ? images[0].originalSrc : ImageIcon
                            }
                            alt={
                              hasImage && images[0].altText
                                ? images[0].altText
                                : ''
                            }
                            size="medium"
                          />
                        </Box>
                        <div style={{flexGrow: 1}}>
                          <BlockStack>
                            <Text as="span">{title}</Text>
                            {totalVariants !== undefined ? (
                              <Text as="span" tone="subdued">
                                {t('productCard.variantsSelected', {
                                  count: variants?.length || totalVariants,
                                  total: totalVariants,
                                })}
                              </Text>
                            ) : null}
                          </BlockStack>
                        </div>
                        <Link
                          removeUnderline
                          onClick={() => selectProducts(selectedProducts)}
                        >
                          {commonTranslate('actions.edit')}
                        </Link>
                        <Button
                          variant="plain"
                          icon={XIcon}
                          onClick={() => {
                            removeProduct(id);
                          }}
                        />
                      </InlineStack>
                    );
                  },
                )
              : null}
          </BlockStack>
        </Scrollable>
        {selectedProductsError ? (
          <InlineError
            fieldID="selectedProductIds"
            message={selectedProductsError}
          />
        ) : null}
        {selectedVariantsError ? (
          <InlineError
            fieldID="selectedVariantsError"
            message={selectedVariantsError}
          />
        ) : null}
      </BlockStack>
      <input hidden defaultValue={productIdsToAdd} name="selectedProductIds" />
      <input hidden defaultValue={variantIdsToAdd} name="selectedVariantIds" />
      <input
        hidden
        defaultValue={productIdsToRemove}
        name="removedProductIds"
      />
      <input
        hidden
        defaultValue={variantIdsToRemove}
        name="removedVariantIds"
      />
    </Card>
  );
}
