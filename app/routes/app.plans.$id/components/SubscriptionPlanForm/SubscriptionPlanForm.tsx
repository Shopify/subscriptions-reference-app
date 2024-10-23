import {useLocation} from '@remix-run/react';
import {
  BlockStack,
  Button,
  Card,
  FormLayout,
  Layout,
  Link,
  PageActions,
  Text,
} from '@shopify/polaris';
import {useTranslation} from 'react-i18next';
import {SubmitButton} from '~/components/SubmitButton';
import {TextField} from '~/components/TextField';
import type {Product} from '~/types';
import {DiscountDeliveryCard} from './components/DiscountDeliveryCard';
import {ProductPickerCard} from './components/ProductPickerCard';
import {SummaryCard} from './components/SummaryCard';
import DeleteSellingPlanGroupModal from '../DeleteSellingPlanModal/DeleteSellingPlanModal';
import {useState} from 'react';

export interface SubscriptionPlanFormProps {
  selectedProducts: Product[];
  setSelectedProducts: (value: Product[]) => void;
  selectedVariantIds: string;
  selectedProductIds: string;
  sellingPlanGroupName: string;
}

export function SubscriptionPlanForm({
  selectedProducts,
  setSelectedProducts,
  selectedProductIds,
  selectedVariantIds,
  sellingPlanGroupName,
}: SubscriptionPlanFormProps) {
  const {t} = useTranslation(['app.plans.details', 'common']);
  const [deleteSellingPlanGroupModalOpen, setDeleteSellingPlanGroupModalOpen] =
    useState(false);
  const location = useLocation();
  const isCreate = location.pathname.includes('create');
  const {i18n} = useTranslation();
  const locale = i18n.language;
  const productDisplayLink = `https://help.shopify.com/${locale}/manual/products/purchase-options/shopify-subscriptions/setup#display-subscriptions-on-online-store`;

  return (
    <>
      <Layout>
        <Layout.Section>
          <BlockStack gap="300">
            <Card>
              <FormLayout>
                <TextField
                  label={t('planTitle')}
                  name="merchantCode"
                  helpText={t('planTitleHelpText')}
                />
                <TextField
                  label={t('purchaseOptionTitle')}
                  name="planName"
                  helpText={
                    <Text as="p">
                      {t('purchaseOptionTitleHelpText', {
                        howToDisplayProductsLink: (
                          <Link url={productDisplayLink} target="_blank">
                            {t('purchaseOptionTitleHelpLinkText')}
                          </Link>
                        ),
                      })}
                    </Text>
                  }
                />
              </FormLayout>
            </Card>
            <ProductPickerCard
              selectedProducts={selectedProducts}
              setSelectedProducts={setSelectedProducts}
              initialSelectedProductIds={selectedProductIds}
              initialSelectedVariantIds={selectedVariantIds}
            />
            <DiscountDeliveryCard />
          </BlockStack>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <SummaryCard selectedProducts={selectedProducts} />
        </Layout.Section>
      </Layout>
      <Layout.Section>
        <PageActions
          primaryAction={
            <SubmitButton>
              {t('actions.saveButtonText', {ns: 'common'})}
            </SubmitButton>
          }
          secondaryActions={
            !isCreate ? (
              <Button
                tone="critical"
                onClick={() => setDeleteSellingPlanGroupModalOpen(true)}
              >
                {t('deleteButtonText')}
              </Button>
            ) : undefined
          }
        />
      </Layout.Section>
      {!isCreate ? (
        <DeleteSellingPlanGroupModal
          open={deleteSellingPlanGroupModalOpen}
          onClose={() => setDeleteSellingPlanGroupModalOpen(false)}
          sellingPlanGroupName={sellingPlanGroupName}
        />
      ) : null}
    </>
  );
}
