import {
  BlockStack,
  Box,
  Button,
  Card,
  Divider,
  Icon,
  InlineStack,
  TextField as PolarisTextField,
  Text,
  useBreakpoints,
} from '@shopify/polaris';
import {SearchIcon} from '@shopify/polaris-icons';
import {useFormContext} from '@rvf/remix';
import {useTranslation} from 'react-i18next';
import {Select} from '~/components/Select';
import {TextField} from '~/components/TextField';
import type {ResourcePickerItem} from '~/types';
import {createNewPricingPolicy} from '~/utils/helpers/subscriptionLines';
import {DeliveryFrequencyInterval} from '~/utils/helpers/zod';
import type {SubscriptionLine} from '../../validator';
import {EditSubscriptionLine} from './components/EditSubscriptionLine';
import {EditSubscriptionLineInputs} from './components/EditSubscriptionLineInputs';

export interface EditSubscriptionDetailsCardProps {
  // the contract currency could be different from the shop's current currency
  // so we need to pass it in instead of grabbing it from the shop context
  currencyCode: string;
}

export function EditSubscriptionDetailsCard({
  currencyCode,
}: EditSubscriptionDetailsCardProps) {
  const {t} = useTranslation('app.contracts');
  const {smDown: isMobile} = useBreakpoints();
  const form = useFormContext<{lines: SubscriptionLine[]}>();

  const lines = form.value('lines') ?? [];
  const currentLinesVariantIds = new Set<string>(
    lines.map((line) => line.variantId).filter(Boolean) as string[],
  );

  const removeLine = (lineIndex: number) => {
    form.setValue(
      'lines',
      lines.filter((_, index) => index !== lineIndex),
    );
  };

  /* If there are multiple subscription lines with variants that share the
  same parent product it will result in multiple entries with the same product id
  but the product resource picker will recognize them as being the same product
  */
  const selectedItemsForProductPicker = lines
    .filter((line) => Boolean(line.productId))
    .map((line) => ({
      id: line.productId!,
      ...(line.variantId && {variants: [{id: line.variantId}]}),
    }));

  const deliveryIntervalOptions = [
    {
      label: t('edit.details.deliveryInterval.weeks'),
      value: DeliveryFrequencyInterval.Week,
    },
    {
      label: t('edit.details.deliveryInterval.months'),
      value: DeliveryFrequencyInterval.Month,
    },
    {
      label: t('edit.details.deliveryInterval.years'),
      value: DeliveryFrequencyInterval.Year,
    },
  ];

  async function selectProducts(
    selectedProducts: ResourcePickerItem[],
    searchQuery?: string,
  ) {
    const selectedItems = await window.shopify.resourcePicker({
      selectionIds: selectedProducts,
      multiple: true,
      query: searchQuery,
      type: 'product',
      action: 'select',
      filter: {
        query: 'bundles:false',
      },
    });

    if (!selectedItems) {
      return;
    }

    const selectionVariantIds = new Set<string>();
    const newLines: SubscriptionLine[] = [];

    // add lines that are in the selection but not in the current lines
    selectedItems.forEach((selectedItem) => {
      /*
      even if a product doesn't have any variants
      it will still have a default variant with an id
      the selection id will still be the product id.
      */
      if ('variants' in selectedItem) {
        selectedItem.variants.forEach((variant) => {
          if (variant.id) {
            selectionVariantIds.add(variant.id);

            if (!currentLinesVariantIds.has(variant.id)) {
              const newLineVariantPrice = Number(variant.price ?? '0.00');
              /*
              variant image is only available for products with variants despite
              the default variant
              */
              const variantImage = variant.image
                ? {
                    url: variant.image.originalSrc,
                    altText: variant.image.altText ?? '',
                  }
                : null;
              const fallbackImage = selectedItem.images
                ? {
                    url: selectedItem.images[0]?.originalSrc,
                    altText: selectedItem.images[0]?.altText ?? '',
                  }
                : null;

              const newLine = {
                title: selectedItem.title,
                variantTitle: variant.title,
                quantity: 1,
                productId: selectedItem.id,
                variantId: variant.id,
                currentPrice: {
                  amount: newLineVariantPrice,
                  currencyCode,
                },
                pricingPolicy: createNewPricingPolicy(
                  currencyCode,
                  newLineVariantPrice,
                  newLineVariantPrice,
                ),
                currentOneTimePurchasePrice: newLineVariantPrice,
                variantImage:
                  selectedItem.totalVariants > 1 ? variantImage : fallbackImage,
              };

              newLines.push(newLine);
            }
          }
        });
      }
    });

    // filter out lines that are not in the selection but are in the current lines
    // keep the lines that contain a deleted product variant
    const linesToKeep = [...lines, ...newLines].filter(
      (line) => !line.variantId || selectionVariantIds.has(line.variantId),
    );

    if (linesToKeep.length === 0) {
      shopify.toast.show(t('edit.actions.selectProducts.lineCountError'), {
        isError: true,
      });
      return;
    }

    form.setValue('lines', linesToKeep);
  }

  async function onSearchChange(newValue: string) {
    if (newValue.length > 0) {
      await selectProducts(selectedItemsForProductPicker, newValue);
    }
  }

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd" fontWeight="semibold">
          {t('edit.details.title')}
        </Text>
        <InlineStack gap="200" align="start">
          <div style={{flexGrow: 1}}>
            <PolarisTextField
              prefix={<Icon source={SearchIcon} />}
              type="search"
              autoComplete="off"
              label={t('edit.details.searchProducts')}
              labelHidden
              id="productSearch"
              name="productSearch"
              placeholder={t('edit.details.searchProducts')}
              value={''}
              onChange={onSearchChange}
            />
          </div>
          <Button
            onClick={() => {
              selectProducts(selectedItemsForProductPicker);
            }}
          >
            {t('edit.details.browse')}
          </Button>
        </InlineStack>
        {lines.map((line, index) => (
          <EditSubscriptionLine
            key={index}
            line={line}
            index={index}
            removeLine={lines.length > 1 ? removeLine : undefined}
            currencyCode={currencyCode}
          />
        ))}
        <Divider />
        <BlockStack gap="200">
          <Text as="h3" variant="bodySm" fontWeight="medium">
            {t('edit.details.deliveryFrequency.title')}
          </Text>
          <InlineStack gap="150">
            <Box maxWidth={!isMobile ? '6rem' : ''}>
              <TextField
                label={t('edit.details.deliveryFrequency.intervalCount')}
                labelHidden
                name={'deliveryPolicy.intervalCount'}
                type="number"
                min={1}
              />
            </Box>
            <Select
              label={t('edit.details.deliveryFrequency.interval')}
              labelHidden
              name={'deliveryPolicy.interval'}
              options={deliveryIntervalOptions}
            />
          </InlineStack>
          <Text as="p" variant="bodyMd" tone="subdued">
            {t('edit.details.deliveryFrequency.warning')}
          </Text>
        </BlockStack>
      </BlockStack>
      <EditSubscriptionLineInputs lines={lines} />
    </Card>
  );
}
