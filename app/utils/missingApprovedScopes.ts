import {AuthScopes} from '@shopify/shopify-api';

export function missingApprovedScopes(): string[] {
  const scopes = new AuthScopes(process.env.SCOPES ?? []);

  return [
    'read_all_orders',
    'write_own_subscription_contracts',
    'read_customer_payment_methods',
    'write_customers',
  ].reduce(
    (acc, scope) => (scopes.has(scope) ? acc : acc.concat([scope])),
    [] as string[],
  );
}
