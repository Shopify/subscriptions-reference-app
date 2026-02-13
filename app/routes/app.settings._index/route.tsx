import {Box, InlineStack, Layout, Page} from '@shopify/polaris';

import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  TypedResponse,
} from '@remix-run/node';
import {json} from '@remix-run/node';
import {useLoaderData} from '@remix-run/react';
import {useTranslation} from 'react-i18next';
import type {ValidationErrorResponseData} from '@rvf/remix';
import {validationError} from '@rvf/remix';
import {Form} from '~/components/Form';
import {SubmitButton} from '~/components/SubmitButton';
import i18n from '~/i18n/i18next.server';
import type {WithToast} from '~/types';
import {
  loadSettingsMetaobject,
  updateSettingsMetaobject,
} from '../../models/Settings/Settings.server';
import {authenticate} from '../../shopify.server';
import {BillingFailureSettings} from './components/BillingFailureSettings';
import {
  PostPurchaseUpsellSettings,
  type PostPurchaseOfferData,
} from './components/PostPurchaseUpsellSettings';
import {getSettingsSchema, useSettingsSchema} from './validator';
import {useToasts} from '~/hooks';
import {toast} from '~/utils/toast';
import {validateFormData} from '~/utils/validateFormData';
import {
  loadPostPurchaseOffer,
  updatePostPurchaseOffer,
} from '~/models/PostPurchaseOffer.server';

export const handle = {
  i18n: 'app.settings',
};

const VARIANT_WITH_SELLING_PLANS_QUERY = `#graphql
  query VariantWithSellingPlans($id: ID!) {
    node(id: $id) {
      ... on ProductVariant {
        title
        price
        product {
          title
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
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const loader = async ({request}: LoaderFunctionArgs) => {
  const {admin, session} = await authenticate.admin(request);

  const settings = await loadSettingsMetaobject(admin.graphql);
  const postPurchaseConfig = await loadPostPurchaseOffer(session.shop);

  // Build the post-purchase offer data for the UI
  let postPurchaseOffer: PostPurchaseOfferData = {
    enabled: postPurchaseConfig.enabled,
    variantId: postPurchaseConfig.variantId,
    discountPercent: postPurchaseConfig.discountPercent,
    sellingPlanId: postPurchaseConfig.sellingPlanId,
    productInfo: null,
    sellingPlans: [],
  };

  // If a variant is configured, fetch its details from the Admin API
  if (postPurchaseConfig.variantId) {
    const variantGid = postPurchaseConfig.variantId.startsWith('gid://')
      ? postPurchaseConfig.variantId
      : `gid://shopify/ProductVariant/${postPurchaseConfig.variantId}`;

    try {
      const response = await admin.graphql(VARIANT_WITH_SELLING_PLANS_QUERY, {
        variables: {id: variantGid},
      });
      const {data} = await response.json();
      const variant = data?.node;

      if (variant) {
        postPurchaseOffer.productInfo = {
          title: variant.product?.title || '',
          variantTitle: variant.title || 'Default',
          imageUrl:
            variant.product?.featuredMedia?.preview?.image?.url || '',
          price: variant.price || '0.00',
        };

        // Collect selling plans from all groups
        const sellingPlans: {id: string; name: string}[] = [];
        for (const group of variant.product?.sellingPlanGroups?.nodes || []) {
          for (const plan of group.sellingPlans?.nodes || []) {
            sellingPlans.push({
              id: plan.id.replace('gid://shopify/SellingPlan/', ''),
              name: plan.name,
            });
          }
        }
        postPurchaseOffer.sellingPlans = sellingPlans;
      }
    } catch (e) {
      console.error('Failed to fetch variant details:', e);
    }
  }

  return json({settings, postPurchaseOffer});
};

export async function action({
  request,
}: ActionFunctionArgs): Promise<
  TypedResponse<WithToast<Partial<ValidationErrorResponseData>>>
> {
  const {admin, session} = await authenticate.admin(request);

  const formData = await request.formData();
  const actionType = formData.get('_action');

  // Handle post-purchase offer settings
  if (actionType === 'postPurchaseOffer') {
    const enabled = formData.get('enabled') === 'true';
    const variantId = String(formData.get('variantId') || '');
    const discountPercent = parseInt(
      String(formData.get('discountPercent') || '10'),
      10,
    );
    const sellingPlanId = String(formData.get('sellingPlanId') || '');

    await updatePostPurchaseOffer(session.shop, {
      enabled,
      variantId,
      discountPercent: isNaN(discountPercent) ? 10 : discountPercent,
      sellingPlanId,
    });

    return json(toast('Post-purchase upsell settings saved'));
  }

  // Handle billing failure settings (existing)
  const t = await i18n.getFixedT(request, 'app.settings');
  const validationResult = await validateFormData(
    getSettingsSchema(t),
    formData,
  );

  if (validationResult.error) {
    return validationError(validationResult.error);
  }

  const {success} = await updateSettingsMetaobject(
    admin.graphql,
    validationResult.data,
  );

  if (!success) {
    return json(toast(t('actions.updateFailed'), {isError: true}));
  }

  return json(toast(t('actions.updateSuccess')));
}

export default function SettingsIndex() {
  const {settings, postPurchaseOffer} = useLoaderData<typeof loader>();
  useToasts();

  const {t} = useTranslation('app.settings');
  const schema = useSettingsSchema();

  return (
    <Page title={t('title')}>
      <Box paddingBlockEnd="400">
        <Form schema={schema} defaultValues={settings}>
          <input type="hidden" value={settings.id} name="id" />
          <Layout>
            <Layout.Section>
              <BillingFailureSettings />
            </Layout.Section>

            <Layout.Section>
              <InlineStack align="end" gap="200">
                <SubmitButton>{t('saveButtonText')}</SubmitButton>
              </InlineStack>
            </Layout.Section>
          </Layout>
        </Form>
      </Box>

      <Box paddingBlockEnd="400">
        <Layout>
          <Layout.Section>
            <PostPurchaseUpsellSettings offer={postPurchaseOffer} />
          </Layout.Section>
        </Layout>
      </Box>
    </Page>
  );
}
