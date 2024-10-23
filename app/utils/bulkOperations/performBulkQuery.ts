import type {GraphQLClient} from '~/types';

import {logger} from '~/utils/logger.server';
import {
  BulkOperationError,
  fetchBulkOperationResult,
  getCurrentBulkOperation,
  isBulkOperationRunning,
  pollBulkOperationById,
  startBulkQuery,
  type BulkOperation,
} from './bulkOperations';

export interface BulkQueryResult {}

function handleError(error: any, onFailure?: (error: string) => void) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  if (onFailure) onFailure(errorMessage);
  logger.error(errorMessage);
}

export async function performBulkQuery(
  graphql: GraphQLClient,
  queryString: string,
  onSuccess?: (results: ReadonlyArray<BulkQueryResult>) => void,
  onFailure?: (error: string) => void,
): Promise<BulkOperation> {
  try {
    const existingBulkOperation = await getCurrentBulkOperation(graphql);
    if (
      existingBulkOperation &&
      isBulkOperationRunning(existingBulkOperation)
    ) {
      throw new BulkOperationError(
        'Another bulk operation is already in progress.',
      );
    }
    const startedBulkQuery = await startBulkQuery(graphql, queryString);
    logger.info(`Started Bulk Query with ID:`, startedBulkQuery.id);

    pollBulkOperationById(graphql, startedBulkQuery.id)
      .then(async (completedBulkQuery) => {
        logger.info('Bulk Query Completed');

        try {
          const results = await fetchBulkOperationResult(completedBulkQuery);
          if (onSuccess) onSuccess(results);
        } catch (error) {
          handleError(error, onFailure);
        }
      })
      .catch((error) => {
        handleError(error, onFailure);
      });

    return startedBulkQuery;
  } catch (error) {
    handleError(error, onFailure);
    throw error;
  }
}
