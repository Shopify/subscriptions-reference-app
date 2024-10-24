import type {Logger} from 'pino';
import {HttpResponseError} from '@shopify/shopify-api';
import {SessionNotFoundError} from '@shopify/shopify-app-remix/server';
import {logger} from '~/utils/logger.server';

/**
 * Checks against a list of response codes from the Shopify GraphQL API.
 * @see https://shopify.dev/docs/api/admin-graphql#status_and_error_codes
 */
function isNonRetryable(error: HttpResponseError): boolean {
  return [402, 403, 404, 423].includes(error.response.code);
}

/**
 * Determines if the error should be considered terminal (ie. not to be retried).
 */
export function isTerminal(error: Error): boolean {
  return (
    error instanceof SessionNotFoundError ||
    (error instanceof HttpResponseError && isNonRetryable(error))
  );
}

export type JobContext = {
  traceId: string;
};

export abstract class Job<T = unknown> {
  parameters: T;

  public jobName: string;
  public queue: string = 'default';

  constructor(parameters: T) {
    this.jobName = this.constructor.name;
    this.parameters = parameters;
  }

  async run(): Promise<void> {
    this.logger.info(`Starting ${this.jobName}`);

    try {
      await this.perform();
      this.logger.info(`Completed ${this.jobName}`);
    } catch (err) {
      this.logger.error(err);

      const error = err instanceof Error ? err : new Error(String(err));

      if (isTerminal(error)) {
        this.logger.warn({error}, `Terminated ${this.jobName}`);

        return;
      }

      this.logger.warn({error}, `Failed ${this.jobName}`);

      throw error;
    }
  }

  get logger(): Logger {
    return logger.child({
      job: this.jobName,
      parameters: this.parameters,
    });
  }

  toJSON() {
    return {
      jobName: this.jobName,
      parameters: this.parameters,
    };
  }

  abstract perform(): Promise<void>;
}
