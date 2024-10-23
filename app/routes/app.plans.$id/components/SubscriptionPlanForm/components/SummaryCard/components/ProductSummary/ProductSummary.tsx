import {useFormContext} from '@rvf/remix';
import {List} from '@shopify/polaris';
import {useTranslation} from 'react-i18next';
import type {Product} from '~/types';

export function ProductSummary() {
  const {t} = useTranslation('app.plans.details');
  const form = useFormContext<{products: Product[]}>();

  const selectedProducts = form.value('products') || [];
  if (!selectedProducts.length) {
    return null;
  }

  function getProductAndVaraintCounts() {
    let productCount = 0;
    let variantCount = 0;

    selectedProducts.forEach((product) => {
      if (product.areAllVariantsSelected) {
        productCount++;
      } else {
        variantCount += product.variants?.length || 0;
      }
    });

    return {productCount, variantCount};
  }

  function getProductsAndVariantsSummary(): string {
    const {productCount, variantCount} = getProductAndVaraintCounts();
    const productText =
      productCount > 0
        ? t('summaryCard.countProducts', {
            count: productCount,
          })
        : '';
    const variantText =
      variantCount > 0
        ? t('summaryCard.countVariants', {
            count: variantCount,
          })
        : '';

    if (productText && variantText) {
      return t('summaryCard.productAndVariantTextSeparatedList', {
        productText,
        variantText,
      });
    } else if (productText) {
      return productText;
    } else if (variantText) {
      return variantText;
    } else {
      return '';
    }
  }

  if (selectedProducts.length === 1) {
    return selectedProducts[0].areAllVariantsSelected ? (
      <List.Item>{selectedProducts[0].title}</List.Item>
    ) : (
      <List.Item>
        {selectedProducts[0].title} ({getProductsAndVariantsSummary()})
      </List.Item>
    );
  }

  return <List.Item>{getProductsAndVariantsSummary()}</List.Item>;
}
