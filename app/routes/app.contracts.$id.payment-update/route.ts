import {
  json,
  type TypedResponse,
  type ActionFunctionArgs,
} from '@remix-run/node';
import {composeGid} from '@shopify/admin-graphql-api-utilities';
import PaymentUpdateDetailsQuery from '~/graphql/PaymentUpdateDetailsQuery';
import i18n from '~/i18n/i18next.server';
import {sendPaymentMethodUpdateEmail} from '~/services/SendPaymentMethodUpdateEmailService';
import {authenticate} from '~/shopify.server';
import type {WithToast} from '~/types';
import {toast} from '~/utils/toast';

// This code is tested in the context of where it is used on the contract details page
// tests are available in the CustomerPaymentMethodEmailModal.test.tsx file
export async function action({
  request,
  params,
}: ActionFunctionArgs): Promise<TypedResponse<WithToast<{error?: boolean}>>> {
  const {admin} = await authenticate.admin(request);
  const t = await i18n.getFixedT(request, 'app.contracts');
  const contractId = composeGid('SubscriptionContract', params.id || '');

  const emailError = json({
    error: true,
    ...toast(t('paymentMethodDetails.emailModal.errorMessage'), {
      isError: true,
    }),
  });

  const response = await admin.graphql(PaymentUpdateDetailsQuery, {
    variables: {contractId},
  });

  const {data} = await response.json();

  if (!data) {
    return emailError;
  }

  const {name: shopName, contactEmail: shopEmail} = data?.shop;
  const subscriptionContract = data?.subscriptionContract;
  const customerEmail = subscriptionContract?.customer?.email;
  const customerPaymentMethodId =
    subscriptionContract?.customerPaymentMethod?.id;

  if (!shopEmail || !customerEmail || !customerPaymentMethodId) {
    return emailError;
  }

  const subjectMessage = t('paymentMethodDetails.emailModal.subjectMessage', {
    shopName,
  });

  const sendEmailResponse = await sendPaymentMethodUpdateEmail(
    admin.graphql,
    customerPaymentMethodId,
    {
      from: shopEmail,
      to: customerEmail,
      subject: subjectMessage,
    },
  );

  const {customer, userErrors} = sendEmailResponse || {};

  if (!customer || userErrors?.length) {
    return emailError;
  }

  return json(toast(t('paymentMethodDetails.emailModal.successMessage')));
}
