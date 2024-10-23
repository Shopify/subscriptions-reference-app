import {restResources} from '@shopify/shopify-api/rest/admin/2023-07';
import {
  ApiVersion,
  AppDistribution,
  LogSeverity,
  shopifyApp,
} from '@shopify/shopify-app-remix/server';
import '@shopify/shopify-app-remix/adapters/node';
import {MemorySessionStorage} from '@shopify/shopify-app-session-storage-memory';
import {PrismaSessionStorage} from '@shopify/shopify-app-session-storage-prisma';

import prisma from '~/db.server';
import {shopifyApiLoggerFn} from '~/utils/logger.server';
import {SessionStorageConfig, config} from '../config';

import {AfterAuthService} from './services/AfterAuthService';

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || '',
  apiVersion: ApiVersion.Unstable,
  scopes: process.env.SCOPES?.split(','),
  appUrl: process.env.SHOPIFY_APP_URL || '',
  authPathPrefix: '/auth',
  sessionStorage:
    config.shopify.sessionStorage === SessionStorageConfig.Memory
      ? new MemorySessionStorage()
      : new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  restResources,
  logger: {
    log: shopifyApiLoggerFn,
    level: LogSeverity.Info,
    httpRequests: true,
  },
  hooks: {
    afterAuth: async ({session, admin}) => {
      await new AfterAuthService(session, admin).run();
    },
  },
  future: {
    unstable_newEmbeddedAuthStrategy: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? {customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN]}
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.Unstable;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const sessionStorage = shopify.sessionStorage;
