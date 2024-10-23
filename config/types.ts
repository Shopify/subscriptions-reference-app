import type {LoggerOptions} from 'pino';
import type {CloudTaskSchedulerConfig} from '~/lib/jobs';

export type ObjectValues<T> = T[keyof T];

export const NODE_ENV = {
  DEVELOPMENT: 'development',
  TEST: 'test',
  PRODUCTION: 'production',
} as const;

export type NodeEnv = ObjectValues<typeof NODE_ENV>;

interface I18nConfig {
  debug: Boolean;
}

export enum SessionStorageConfig {
  Memory,
  Prisma,
}

interface ShopifyAppConfig {
  sessionStorage: SessionStorageConfig;
}

type JobSchedulerConfig =
  | {scheduler: 'INLINE'}
  | {scheduler: 'TEST'}
  | {scheduler: 'CLOUD_TASKS'; config: CloudTaskSchedulerConfig};

export interface Configuration {
  environment: NodeEnv;
  logger: Partial<LoggerOptions>;
  i18n: I18nConfig;
  shopify: ShopifyAppConfig;
  jobs: JobSchedulerConfig;
}
