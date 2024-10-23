import type {CustomerPaymentMethodSendUpdateEmailMutation as CustomerPaymentMethodSendUpdateEmailMutationData} from 'types/admin.generated';
import type {EmailInput} from 'types/admin.types';
import CustomerPaymentMethodSendUpdateEmailMutation from '~/graphql/CustomerPaymentMethodSendUpdateEmailMutation';
import type {GraphQLClient} from '~/types';

/**
 * Sends an email to a customer containing a link to update their payment method
 */
export async function sendPaymentMethodUpdateEmail(
  graphql: GraphQLClient,
  customerPaymentMethodId: string,
  emailInput: EmailInput,
) {
  const response = await graphql(CustomerPaymentMethodSendUpdateEmailMutation, {
    variables: {
      customerPaymentMethodId,
      emailInput,
    },
  });

  const {data} = (await response.json()) as {
    data: CustomerPaymentMethodSendUpdateEmailMutationData;
  };

  return data.customerPaymentMethodSendUpdateEmail;
}
