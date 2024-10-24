import type {Configuration, NodeEnv} from './types';
import {NODE_ENV, SessionStorageConfig} from './types';

export {NODE_ENV, SessionStorageConfig} from './types';
export type {Configuration, NodeEnv} from './types';

const environment: NodeEnv = process.env.NODE_ENV;

const isProduction = environment === NODE_ENV.PRODUCTION;
const isDevelopment = environment === NODE_ENV.DEVELOPMENT;
const isTest = environment === NODE_ENV.TEST;
const appGID = process.env.APP_GID;

export const config: Configuration = {
  environment: process.env.NODE_ENV as NodeEnv,
  i18n: {
    debug: isDevelopment,
  },
  shopify: {
    sessionStorage: isTest
      ? SessionStorageConfig.Memory
      : SessionStorageConfig.Prisma,
  },
  logger: (() => {
    if (isProduction) {
      return {};
    }

    if (isTest) {
      return {
        level: 'silent',
      };
    }

    return {
      level: 'trace',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      },
    };
  })(),
  jobs: (() => {
    if (isProduction) {
      return {
        scheduler: 'INLINE',
      };
    }

    if (isTest) {
      return {
        scheduler: 'TEST',
      };
    }

    return {
      scheduler: 'INLINE',
    };
  })(),
};

export const env = {
  isProduction,
  isDevelopment,
  isTest,
  appGID,
  config,
};
