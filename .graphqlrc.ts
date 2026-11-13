import {ApiType, shopifyApiProject} from '@shopify/api-codegen-preset';
import * as dotenv from 'dotenv';

dotenv.config();

const apiVersion = 'unstable';

// No public schema endpoint exists for the Customer Account API; the preset introspects it with the app's API key.
function customerApiProject() {
  const apiKey = process.env.SHOPIFY_API_KEY;
  if (!apiKey) {
    console.warn(
      'SHOPIFY_API_KEY is not set, so the shopifyCustomerApi project is unavailable. Run `shopify app env show` to get it.',
    );
    return {};
  }

  return {
    shopifyCustomerApi: shopifyApiProject({
      apiType: ApiType.Customer,
      apiVersion,
      apiKey,
      outputDir: './extensions/buyer-subscriptions/types',
      documents: [
        './extensions/buyer-subscriptions/**/*.{graphql,js,ts,jsx,tsx}',
        '!./extensions/buyer-subscriptions/dist/**',
      ],
      module: '@shopify/customer-api-client',
    }),
  };
}

export default {
  projects: {
    adminSubsActionExtension: shopifyApiProject({
      apiType: ApiType.Admin,
      apiVersion,
      outputDir: './extensions/admin-subs-action/types',
      documents: [
        './extensions/admin-subs-action/**/*.{graphql,js,ts,jsx,tsx}',
      ],
    }),
    ...customerApiProject(),
    default: shopifyApiProject({
      apiType: ApiType.Admin,
      apiVersion,
      outputDir: './types',
      documents: ['./app/**/*.{graphql,js,ts,jsx,tsx}'],
    }),
  },
};
