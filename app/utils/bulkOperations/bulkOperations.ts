import type {GraphQLClient} from '~/types';

import type {StagedUploadTarget} from './stagedUploads';

import BulkMutationRunMutation from './graphql/BulkMutationRunMutation';
import BulkOperationByIdQuery from './graphql/BulkOperationByIdQuery';
import BulkOperationRunQueryMutation from './graphql/BulkOperationRunQueryMutation';
import CurrentBulkOperationQuery from './graphql/CurrentBulkOperationQuery';

import type {ObjectValues} from 'config/types';
import type {
  BulkMutationRunMutation as BulkMutationRunMutationType,
  BulkMutationRunMutationVariables,
  BulkOperationByIdQuery as BulkOperationByIdQueryType,
  BulkOperationByIdQueryVariables,
  CurrentBulkOperationQuery as CurrentBulkOperationQueryType,
} from 'types/admin.generated';
import {logger} from '~/utils/logger.server';
import type {BulkOperationType} from 'types/admin.types';

const POLL_INTERVAL_DURATION = 5000;
const MAX_POLL_COUNT = 100;

interface UserErrors {
  field?: string[] | null | undefined;
  message: string;
  code?: string | null | undefined;
}

export const BulkOperationStatus = {
  Canceled: 'CANCELED',
  Canceling: 'CANCELING',
  Completed: 'COMPLETED',
  Created: 'CREATED',
  Expired: 'EXPIRED',
  Failed: 'FAILED',
  Running: 'RUNNING',
} as const;
export type BulkOperationStatus = ObjectValues<typeof BulkOperationStatus>;

export interface BulkOperation {
  id: string;
  url?: string | null;
  status: BulkOperationStatus;
}

export interface BulkOperationWithMetadata {
  bulkOperation: BulkOperation;
  stagedUploadTargetUrl: string;
}

export class BulkOperationError extends Error {
  userErrors: UserErrors[];

  constructor(message: string, userErrors?: UserErrors[]) {
    super(message);
    this.userErrors = userErrors || [];
    this.name = 'BulkOperationError';
  }
}

// Checks if a bulk operation is running
export const isBulkOperationRunning = (
  bulkOperation: BulkOperation,
): boolean => {
  const runningBulkOperationStates = [
    BulkOperationStatus.Created,
    BulkOperationStatus.Running,
    BulkOperationStatus.Canceling,
  ];
  return runningBulkOperationStates.some(
    (runningState) => runningState === bulkOperation.status,
  );
};

// Fetches the results of a bulk operation
export const fetchBulkOperationResult = async (
  bulkOperation: BulkOperation,
): Promise<ReadonlyArray<any>> => {
  if (!bulkOperation.url) {
    throw new BulkOperationError(
      `BulkOperation '${bulkOperation.id}' did not contain result url.`,
    );
  }

  const response = await fetch(bulkOperation.url);
  const rawResults = await response.text();

  try {
    const resultObjects = rawResults
      .split(/\r?\n/)
      .filter((line) => line)
      .map((jsonString) => JSON.parse(jsonString)) as ReadonlyArray<any>;

    return resultObjects;
  } catch (error) {
    let errorMessage = `Parsing bulk operation results file from url '${bulkOperation.url}' failed`;
    if (error instanceof Error) {
      errorMessage += ` with error: ${error.message}`;
    }
    throw new BulkOperationError(errorMessage);
  }
};

export interface CurrentBulkOperation extends BulkOperation {
  query: string;
}

// Gets the current bulk operation
export const getCurrentBulkOperation = async (
  graphql: GraphQLClient,
  type: 'MUTATION' | 'QUERY' = 'QUERY',
): Promise<CurrentBulkOperation | null> => {
  const response = await graphql(CurrentBulkOperationQuery, {
    variables: {
      type: type as BulkOperationType,
    },
  });
  const {data} = (await response.json()) as {
    data: CurrentBulkOperationQueryType;
  };

  const currentBulkOperation = data?.currentBulkOperation;

  if (currentBulkOperation === undefined) {
    throw new BulkOperationError('CurrentBulkOperation query failed.');
  }

  return currentBulkOperation;
};

// Starts a bulk mutation operation
export const startBulkMutation = async (
  graphql: GraphQLClient,
  stagedUploadTarget: StagedUploadTarget,
  mutationString: string,
): Promise<BulkOperation> => {
  const stagedUploadTargetKey = stagedUploadTarget.parameters.find(
    ({name}) => name === 'key',
  )?.value;
  if (!stagedUploadTargetKey) {
    throw new BulkOperationError(
      'StagedUploadTarget does not contain "key" parameter.',
    );
  }

  const variables: BulkMutationRunMutationVariables = {
    mutationString,
    path: stagedUploadTargetKey,
  };

  const response = await graphql(BulkMutationRunMutation, {variables});

  const {data} = (await response.json()) as {data: BulkMutationRunMutationType};

  const bulkOperation = data?.bulkOperationRunMutation?.bulkOperation;
  const bulkOperationUserErrors = data?.bulkOperationRunMutation?.userErrors;

  if (bulkOperationUserErrors?.length) {
    const errorMessages = bulkOperationUserErrors?.map(
      ({message}: {message: string}) => message,
    );
    throw new BulkOperationError(
      `BulkOperationRunMutation mutation returned user errors: ${errorMessages.join(
        ' ',
      )}`,
      bulkOperationUserErrors,
    );
  }

  if (!bulkOperation) {
    throw new BulkOperationError(
      'BulkOperationRunMutation Mutation did not return bulkOperation.',
    );
  }

  return bulkOperation;
};

export const startBulkQuery = async (
  graphql: GraphQLClient,
  queryString: string,
): Promise<BulkOperation> => {
  const response = await graphql(BulkOperationRunQueryMutation, {
    variables: {
      queryString,
    },
  });
  const {data} = await response.json();

  const bulkOperation = data?.bulkOperationRunQuery?.bulkOperation;
  const bulkOperationUserErrors = data?.bulkOperationRunQuery?.userErrors;

  if (bulkOperationUserErrors?.length) {
    const errorMessages = bulkOperationUserErrors?.map(
      ({message}: {message: string}) => message,
    );
    throw new BulkOperationError(
      `BulkOperationRunQuery mutation returned user errors: ${errorMessages.join(
        ' ',
      )}`,
      bulkOperationUserErrors,
    );
  }

  if (!bulkOperation) {
    throw new BulkOperationError(
      'BulkOperationRunQuery Mutation did not return bulkOperation.',
    );
  }

  return bulkOperation;
};

// Polls a bulk operation until it's no longer running
export const pollBulkOperationById = async (
  graphql: GraphQLClient,
  bulkOperationId: string,
  pollInterval: number = POLL_INTERVAL_DURATION,
  maxPolls: number = MAX_POLL_COUNT,
): Promise<BulkOperation> => {
  let pollCount = 0;
  let bulkOperation: BulkOperation | null = null;

  do {
    logger.info('Polling...');
    await new Promise((resolve) => setTimeout(resolve, pollInterval));

    const variables: BulkOperationByIdQueryVariables = {
      id: bulkOperationId,
    };

    const response = await graphql(BulkOperationByIdQuery, {variables});
    const {data} = (await response.json()) as {
      data: BulkOperationByIdQueryType;
    };

    const bulkOperationByIdData = data?.bulkOperationById;
    if (!bulkOperationByIdData) {
      throw new BulkOperationError(
        `BulkOperationById query with id '${bulkOperationId}' failed.`,
      );
    }

    if (bulkOperationByIdData.__typename !== 'BulkOperation') {
      throw new BulkOperationError(
        'BulkOperationById query received data other than BulkOperation.',
      );
    }

    bulkOperation = bulkOperationByIdData;

    pollCount++;
    if (pollCount >= maxPolls) {
      break;
    }
  } while (isBulkOperationRunning(bulkOperation));

  switch (bulkOperation.status) {
    case BulkOperationStatus.Completed:
      return bulkOperation;
    case BulkOperationStatus.Failed:
      throw new BulkOperationError(
        `BulkOperation '${bulkOperationId}' failed.`,
      );
    case BulkOperationStatus.Created:
    case BulkOperationStatus.Running:
      throw new BulkOperationError('Maximum number of polls reached.');
    default:
      throw new BulkOperationError(
        `Unexpected status for BulkOperation '${bulkOperationId}': ${bulkOperation.status}`,
      );
  }
};
