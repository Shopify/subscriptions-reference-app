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
import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {SubmitButton} from '~/components/SubmitButton';
import {TextField} from '~/components/TextField';
import {DiscountDeliveryCard} from './components/DiscountDeliveryCard';
import {ProductPickerCard} from './components/ProductPickerCard';
import {SummaryCard} from './components/SummaryCard';
import DeleteSellingPlanGroupModal from '../DeleteSellingPlanModal/DeleteSellingPlanModal';
import type {DiscountDeliveryOption} from '../../validator';

export interface SubscriptionPlanFormProps {
  selectedVariantIds: string;
  selectedProductIds: string;
  sellingPlanGroupName: string;
  discountDeliveryOptions: DiscountDeliveryOption[];
}

export function SubscriptionPlanForm({
  selectedProductIds,
  selectedVariantIds,
  sellingPlanGroupName,
  discountDeliveryOptions,
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
              initialSelectedProductIds={selectedProductIds}
              initialSelectedVariantIds={selectedVariantIds}
            />
            <DiscountDeliveryCard
              discountDeliveryOptions={discountDeliveryOptions}
            />
          </BlockStack>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <SummaryCard />
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
