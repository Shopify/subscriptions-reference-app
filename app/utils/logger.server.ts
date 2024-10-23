import {LogSeverity} from '@shopify/shopify-app-remix/server';
import {default as pino} from 'pino';
import {config} from '../../config';

export const logger = pino(config.logger);

/**
 * Maps log messages from @shopify/api to our logger
 *
 * @param level from the @shopify/api logger
 * @param message to send to our logger
 */
export function shopifyApiLoggerFn(level: LogSeverity, message: string): void {
  switch (level) {
    case LogSeverity.Debug:
      logger.debug(message);
      break;
    case LogSeverity.Info:
      logger.info(message);
      break;
    case LogSeverity.Warning:
      logger.warn(message);
      break;
    case LogSeverity.Error:
      logger.error(message);
      break;
  }
}
