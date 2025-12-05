const DEFAULT_API_VERSION = '2025-10';

export async function fetchCustomerApi<TData = any, TVariables = any>(
  query: string,
  variables?: TVariables,
  options?: {
    apiVersion?: string;
  },
): Promise<{data: TData; errors?: any[]}> {
  const apiVersion = options?.apiVersion || DEFAULT_API_VERSION;

  const response = await fetch(
    `shopify:customer-accounts/customer/api/${apiVersion}/graphql`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Customer API request failed: ${response.statusText}`);
  }

  return response.json();
}
