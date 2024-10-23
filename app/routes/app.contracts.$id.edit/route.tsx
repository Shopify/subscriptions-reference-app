import type {ActionFunctionArgs, TypedResponse} from '@remix-run/node';
import {json} from '@remix-run/node';
import {useLoaderData} from '@remix-run/react';
import {composeGid, parseGid} from '@shopify/admin-graphql-api-utilities';
import {BlockStack, Page, PageActions} from '@shopify/polaris';
import {useTranslation} from 'react-i18next';
import {StatusBadge} from '~/components';
import {Form} from '~/components/Form';
import {SubmitButton} from '~/components/SubmitButton';
import i18n from '~/i18n/i18next.server';
import {getContractEditDetails} from '~/models/SubscriptionContract/SubscriptionContract.server';
import {authenticate} from '~/shopify.server';
import {isNonEmptyString} from '~/utils/helpers/form';
import {PaymentSummaryCard} from '../../components/PaymentSummaryCard/PaymentSummaryCard';
import {EditSubscriptionDetailsCard} from './components/EditSubscriptionDetailsCard/EditSubscriptionDetailsCard';
import {
  getContractEditFormValidator,
  useContractEditFormValidator,
} from './validator';

import type {
  SubscriptionContractEditDetails,
  SubscriptionDraftUpdateInput,
} from '~/types/contractEditing';
import {
  getLineIdsToRemove,
  getLinesToAdd,
  getLinesToUpdate,
} from '~/utils/helpers/subscriptionLines';
import {buildDraftFromContract} from '~/models/SubscriptionContractDraft/SubscriptionContractDraft.server';
import {formatStatus} from '~/utils/helpers/contracts';
import {useToasts} from '~/hooks';
import type {WithToast} from '~/types';
import {toast} from '~/utils/toast';

export const handle = {
  i18n: 'app.contracts',
};

export async function loader({
  params,
  request,
}): Promise<SubscriptionContractEditDetails> {
  const {admin} = await authenticate.admin(request);

  const id = params.id;
  const gid = composeGid('SubscriptionContract', id);

  const subscriptionContract = await getContractEditDetails(admin.graphql, gid);

  return subscriptionContract;
}

export async function action({
  request,
  params,
}: ActionFunctionArgs): Promise<TypedResponse<WithToast>> {
  const t = await i18n.getFixedT(request, 'app.contracts');
  const {admin, session} = await authenticate.admin(request);
  const shopDomain = session.shop;

  const contractId = params.id;

  const contractUpdateError = json(
    toast(t('edit.actions.updateContract.error'), {isError: true}),
  );

  if (!isNonEmptyString(contractId)) {
    return contractUpdateError;
  }

  const validator = getContractEditFormValidator(t);
  const validationResult = await validator.validate(await request.formData());

  if (validationResult.error) {
    return contractUpdateError;
  }

  const gid = composeGid('SubscriptionContract', contractId);

  const {lines: initialLines, deliveryPolicy: initialDeliveryPolicy} =
    await getContractEditDetails(admin.graphql, gid);

  const {lines, deliveryPolicy} = validationResult.data;

  const deliveryPolicyChanged =
    deliveryPolicy.interval !== initialDeliveryPolicy.interval ||
    deliveryPolicy.intervalCount !== initialDeliveryPolicy.intervalCount;

  const linesToAdd = getLinesToAdd(initialLines, lines);
  const lineIdsToRemove = getLineIdsToRemove(initialLines, lines);
  const linesToUpdate = getLinesToUpdate(initialLines, lines);

  const draft = await buildDraftFromContract(shopDomain, gid, admin.graphql);

  if (linesToAdd.length > 0) {
    let allLinesAdded = true;

    await Promise.all(
      linesToAdd.map(async (line) => {
        const lineAdded = await draft.addLine(line);
        if (!lineAdded) {
          allLinesAdded = false;
        }
      }),
    );

    if (!allLinesAdded) {
      return contractUpdateError;
    }
  }

  if (lineIdsToRemove.length > 0) {
    let allLinesRemoved = true;
    await Promise.all(
      lineIdsToRemove.map(async (lineId) => {
        const lineRemoved = await draft.removeLine(lineId);

        if (!lineRemoved) {
          allLinesRemoved = false;
        }
      }),
    );

    if (!allLinesRemoved) {
      return contractUpdateError;
    }
  }

  if (linesToUpdate.length > 0) {
    let allLinesUpdated = true;
    await Promise.all(
      linesToUpdate.map(async (line) => {
        const {
          quantity: newQuantity,
          price: newPrice,
          pricingPolicy: newPricingPolicy,
        } = line;

        const lineUpdateInput = {
          quantity: newQuantity,
          currentPrice: newPrice,
          ...(newPricingPolicy && {pricingPolicy: newPricingPolicy}),
        };

        const lineUpdated = await draft.updateLine(line.id, lineUpdateInput);

        if (!lineUpdated) {
          allLinesUpdated = false;
        }
      }),
    );

    if (!allLinesUpdated) {
      return contractUpdateError;
    }
  }

  if (deliveryPolicyChanged) {
    const draftUpdateInput: SubscriptionDraftUpdateInput = {
      billingPolicy: deliveryPolicy,
      deliveryPolicy,
    };

    const draftUpdated = await draft.update(draftUpdateInput);

    if (!draftUpdated) {
      return contractUpdateError;
    }
  }

  const draftCommitted = await draft.commit();

  if (!draftCommitted) {
    return contractUpdateError;
  }

  return json(toast(t('edit.actions.updateContract.success')));
}

export default function ContractEditPage() {
  const {t} = useTranslation('app.contracts');
  const validator = useContractEditFormValidator();

  const subscriptionContract = useLoaderData<typeof loader>();

  useToasts();

  const {status, lines, deliveryPolicy, currencyCode} = subscriptionContract;
  const id = parseGid(subscriptionContract.id);

  const defaultValues = {
    lines,
    linesToAdd: [],
    deliveryPolicy,
  };

  return (
    <Page
      title={t('edit.title')}
      titleMetadata={<StatusBadge status={formatStatus(status)} />}
      subtitle={id}
      backAction={{
        url: `/app/contracts/${id}`,
      }}
    >
      <Form
        id="edit-subscription-form"
        validator={validator}
        defaultValues={defaultValues}
      >
        <BlockStack gap="400">
          <EditSubscriptionDetailsCard currencyCode={currencyCode} />
          {subscriptionContract?.priceBreakdownEstimate && (
            <PaymentSummaryCard
              subtotal={
                // Type casting because JsonifyObject is making amount optional
                subscriptionContract.priceBreakdownEstimate.subtotalPrice
              }
              totalTax={subscriptionContract.priceBreakdownEstimate.totalTax}
              totalShipping={
                subscriptionContract.priceBreakdownEstimate.totalShippingPrice
              }
              total={subscriptionContract.priceBreakdownEstimate.totalPrice}
              deliveryMethod={subscriptionContract.deliveryMethod ?? undefined}
            />
          )}
        </BlockStack>
        <PageActions
          primaryAction={
            <SubmitButton>
              {t('actions.saveButtonText', {ns: 'common'})}
            </SubmitButton>
          }
        />
      </Form>
    </Page>
  );
}
