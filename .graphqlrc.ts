import {ApiType, pluckConfig} from '@shopify/api-codegen-preset';
import {existsSync, readdirSync} from 'node:fs';

function getConfig() {
  const host = 'app.myshopify.com';
  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiVersion = 'unstable';
  const customerApiVersion = 'unstable';

  const adminSchemaUrl = `https://${host}/services/graphql/introspection/admin?api_client_api_key=${apiKey}&api_version=${apiVersion}`;

  const config = {
    projects: {
      adminSubsActionExtension: {
        schema: [
          {
            [adminSchemaUrl]: {
              method: 'GET',
            },
          },
        ],
        documents: [
          './extensions/admin-subs-action/**/*.{graphql,js,ts,jsx,tsx}',
        ],
        extensions: {
          codegen: {
            pluckConfig,
            generates: {
              './extensions/admin-subs-action/types/admin.types.d.ts': {
                plugins: ['typescript'],
              },
              './extensions/admin-subs-action/types/admin.generated.d.ts': {
                preset: '@shopify/api-codegen-preset',
                presetConfig: {
                  apiType: ApiType.Admin,
                },
              },
            },
          },
        },
      },
      shopifyAdminApi: {
        schema: [
          {
            [adminSchemaUrl]: {
              method: 'GET',
            },
          },
        ],
        documents: ['./app/**/*.{graphql,js,ts,jsx,tsx}'],
      },
      shopifyCustomerApi: {
        schema: [
          {
            [`https://${host}/services/graphql/introspection/customer?api_client_api_key=${apiKey}&api_version=${customerApiVersion}`]:
              {
                method: 'GET',
              },
          },
        ],
        documents: [
          './extensions/buyer-subscriptions/**/*.{graphql,js,ts,jsx,tsx}',
          '!./extensions/buyer-subscriptions/dist/**',
        ],
        extensions: {
          codegen: {
            pluckConfig,
            generates: {
              './extensions/buyer-subscriptions/types/customer.schema.json': {
                plugins: ['introspection'],
                config: {minify: true},
              },
              './extensions/buyer-subscriptions/types/customer.types.d.ts': {
                plugins: ['typescript'],
              },
              './extensions/buyer-subscriptions/types/customer.generated.d.ts':
                {
                  preset: '@shopify/api-codegen-preset',
                  presetConfig: {
                    apiType: ApiType.Customer,
                    module: '@shopify/customer-api-client',
                  },
                },
            },
          },
        },
      },
      // To produce variable / return types for Admin API operations
      default: {
        schema: [
          {
            [`https://${host}/services/graphql/introspection/admin?api_client_api_key=${apiKey}&api_version=${apiVersion}`]:
              {
                method: 'GET',
              },
          },
        ],
        documents: [
          './app/**/*.{graphql,js,ts,jsx,tsx}',
          '!./app/**/*.public.{graphql,js,ts,jsx,tsx}',
          '!./extensions/buyer-subscriptions/**/*.{graphql,js,ts,jsx,tsx}',
        ],
        extensions: {
          codegen: {
            // Enables support for `#graphql` tags, as well as `/* GraphQL */`
            pluckConfig,
            generates: {
              './types/admin.schema.json': {
                plugins: ['introspection'],
                config: {minify: true},
              },
              './types/admin.types.d.ts': {
                plugins: ['typescript'],
              },
              './types/admin.generated.d.ts': {
                preset: '@shopify/api-codegen-preset',
                presetConfig: {
                  apiType: ApiType.Admin,
                },
              },
            },
          },
        },
      },
    },
  };

  return config;
}

module.exports = getConfig();
