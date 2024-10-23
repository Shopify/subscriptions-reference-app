import type {NodeOnDiskFile} from '@remix-run/node';
import type {GraphQLClient} from '~/types';

import {logger} from '~/utils/logger.server';
import {
  BulkOperationError,
  fetchBulkOperationResult,
  getCurrentBulkOperation,
  isBulkOperationRunning,
  pollBulkOperationById,
  startBulkMutation,
  type BulkOperationWithMetadata,
} from './bulkOperations';
import {createStagedUploadTarget, uploadToStagedTarget} from './stagedUploads';

export interface BulkMutationResult {
  data?: any;
  errors?: any;
  __lineNumber: number;
}

function handleError(error: any, onFailure?: (error: string) => void) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  if (onFailure) onFailure(errorMessage);
  logger.error(errorMessage);
}

// Performs a bulk mutation operation
export async function performBulkMutation<T>(
  graphql: GraphQLClient,
  mutationString: string,
  input: File | NodeOnDiskFile | ReadonlyArray<T>,
  onSuccess?: (results: ReadonlyArray<BulkMutationResult>) => void,
  onFailure?: (error: string) => void,
): Promise<BulkOperationWithMetadata> {
  try {
    const existingBulkOperation = await getCurrentBulkOperation(graphql);
    if (
      existingBulkOperation &&
      isBulkOperationRunning(existingBulkOperation)
    ) {
      throw new BulkOperationError(
        'Another bulk mutation is already in progress.',
      );
    }

    const stagedUploadTarget = await createStagedUploadTarget(graphql);
    await uploadToStagedTarget(stagedUploadTarget, input);
    logger.info(
      `Uploaded bulk mutation input to Staged Target with url: ${stagedUploadTarget.url}`,
    );

    const startedBulkMutation = await startBulkMutation(
      graphql,
      stagedUploadTarget,
      mutationString,
    );
    logger.info(`Started Bulk Mutation with ID:`, startedBulkMutation.id);

    pollBulkOperationById(graphql, startedBulkMutation.id)
      .then(async (completedBulkMutation) => {
        logger.info('Bulk Mutation Completed');

        try {
          const results = (await fetchBulkOperationResult(
            completedBulkMutation,
          )) as ReadonlyArray<BulkMutationResult>;
          if (onSuccess) onSuccess(results);
        } catch (error) {
          handleError(error, onFailure);
        }
      })
      .catch((error) => {
        handleError(error, onFailure);
      });

    return {
      bulkOperation: startedBulkMutation,
      stagedUploadTargetUrl: stagedUploadTarget.url,
    };
  } catch (error) {
    handleError(error, onFailure);
    throw error;
  }
}
