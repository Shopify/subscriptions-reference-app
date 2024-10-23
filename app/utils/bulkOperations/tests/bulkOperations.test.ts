import {mockShopifyServer} from '#/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {
  BulkOperationError,
  BulkOperationStatus,
  fetchBulkOperationResult,
  getCurrentBulkOperation,
  isBulkOperationRunning,
  pollBulkOperationById,
  startBulkMutation,
} from '../bulkOperations';
import type {StagedUploadTarget} from '../stagedUploads';

import type {
  BulkOperation as BulkOperationAdminType,
  BulkOperationStatus as BulkOperationStatusAdminType,
  BulkOperationType,
} from 'types/admin.types';
import CurrentBulkOperationQuery from '../graphql/CurrentBulkOperationQuery';

const {graphQL, mockGraphQL} = mockShopifyServer();

function generateBulkOperationResponse(
  status?: BulkOperationStatus,
): BulkOperationAdminType {
  return {
    __typename: 'BulkOperation',
    id: '1',
    url: 'https://example.com/result',
    status: (status ??
      BulkOperationStatus.Completed) as BulkOperationStatusAdminType,
    createdAt: '',
    objectCount: '',
    query: '',
    rootObjectCount: 0,
    type: 'MUTATION' as BulkOperationType,
  };
}

describe('isBulkOperationRunning', () => {
  it('should return true for running states', () => {
    const runningStates = [
      BulkOperationStatus.Created,
      BulkOperationStatus.Running,
      BulkOperationStatus.Canceling,
    ];
    runningStates.forEach((state) => {
      const result = isBulkOperationRunning({
        id: '1',
        status: state,
      });
      expect(result).toBe(true);
    });
  });

  it('should return false for non-running states', () => {
    const nonRunningStates = [
      BulkOperationStatus.Completed,
      BulkOperationStatus.Failed,
    ];
    nonRunningStates.forEach((state) => {
      const result = isBulkOperationRunning({
        id: '1',
        status: state,
      });
      expect(result).toBe(false);
    });
  });
});

describe('fetchBulkOperationResult', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('should successfully parse a valid JSONL response', async () => {
    const response = new Response('{"data": "test1"}\n{"data": "test2"}\n');
    fetchMock.mockResolvedValue(response);

    const result = await fetchBulkOperationResult(
      generateBulkOperationResponse(),
    );

    expect(result).toEqual([{data: 'test1'}, {data: 'test2'}]);
  });

  it('should throw an error when fetch fails', async () => {
    fetchMock.mockRejectedValue(new Error('Fetch error'));

    await expect(
      fetchBulkOperationResult(generateBulkOperationResponse()),
    ).rejects.toThrow(new Error(`Fetch error`));
  });

  it('should throw an error when parsing an invalid JSONL response', async () => {
    const response = new Response('invalid json');
    fetchMock.mockResolvedValue(response);

    await expect(
      fetchBulkOperationResult(generateBulkOperationResponse()),
    ).rejects.toThrow(
      new BulkOperationError(
        `Parsing bulk operation results file from url 'https://example.com/result' failed with error: Unexpected token 'i', "invalid json" is not valid JSON`,
      ),
    );
  });
});

describe('getCurrentBulkOperation', () => {
  it('passes type as QUERY by default when no type is provided', async () => {
    const mockResponse = {
      data: {
        currentBulkOperation: generateBulkOperationResponse(),
      },
    };
    mockGraphQL({CurrentBulkOperation: mockResponse});

    await getCurrentBulkOperation(graphQL);

    expect(graphQL).toHavePerformedGraphQLOperation(CurrentBulkOperationQuery, {
      variables: {
        type: 'QUERY',
      },
    });
  });

  it('passes type as MUTATION when type is provided', async () => {
    const mockResponse = {
      data: {
        currentBulkOperation: generateBulkOperationResponse(),
      },
    };
    mockGraphQL({CurrentBulkOperation: mockResponse});

    await getCurrentBulkOperation(graphQL, 'MUTATION');

    expect(graphQL).toHavePerformedGraphQLOperation(CurrentBulkOperationQuery, {
      variables: {
        type: 'MUTATION',
      },
    });
  });

  it('should return the current bulk operation when the query is successful and a bulk operation is returned', async () => {
    const mockResponse = {
      data: {
        currentBulkOperation: generateBulkOperationResponse(),
      },
    };
    mockGraphQL({CurrentBulkOperation: mockResponse});

    const result = await getCurrentBulkOperation(graphQL);

    expect(result).toEqual(mockResponse.data.currentBulkOperation);
  });

  it('should return null when the query is successful but there is no current bulk operation', async () => {
    const mockResponse = {
      data: {
        currentBulkOperation: null,
      },
    };
    mockGraphQL({CurrentBulkOperation: mockResponse});

    const result = await getCurrentBulkOperation(graphQL);

    expect(result).toBeNull();
  });

  it('should throw an error when the query fails', async () => {
    mockGraphQL({CurrentBulkOperation: {data: null}});

    await expect(getCurrentBulkOperation(graphQL)).rejects.toThrow(
      new BulkOperationError(`CurrentBulkOperation query failed.`),
    );
  });
});

describe('startBulkMutation', () => {
  const mutationString = `
    mutation productUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          id
          vendor
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const stagedUploadTargetMock: StagedUploadTarget = {
    url: 'https://example.com/upload',
    resourceUrl: 'https://example.com/upload',
    parameters: [{name: 'key', value: 'value'}],
  };

  it('should return the bulk operation when a bulk mutation is started successfully', async () => {
    const mockResponse = {
      data: {
        bulkOperationRunMutation: {
          bulkOperation: generateBulkOperationResponse(),
          userErrors: [],
        },
      },
    };
    mockGraphQL({BulkMutationRun: mockResponse});

    const result = await startBulkMutation(
      graphQL,
      stagedUploadTargetMock,
      mutationString,
    );

    expect(result).toEqual(
      mockResponse.data.bulkOperationRunMutation.bulkOperation,
    );
  });

  it('should throw an error when the BulkOperationRunMutation mutation fails', async () => {
    mockGraphQL({BulkMutationRun: {data: null}});

    await expect(
      startBulkMutation(graphQL, stagedUploadTargetMock, mutationString),
    ).rejects.toThrow(
      new BulkOperationError(
        `BulkOperationRunMutation Mutation did not return bulkOperation.`,
      ),
    );
  });
});

describe('pollBulkOperationById', () => {
  it('should return the bulk operation when the bulk operation by ID fetched is no longer running', async () => {
    const mockResponse = {
      data: {
        bulkOperationById: generateBulkOperationResponse(),
      },
    };
    mockGraphQL({BulkOperationById: mockResponse});

    const result = await pollBulkOperationById(graphQL, '1');

    expect(result).toEqual(mockResponse.data.bulkOperationById);
  });

  it('should throw an error when the query fails', async () => {
    mockGraphQL({BulkOperationById: {data: null}});

    await expect(pollBulkOperationById(graphQL, '1')).rejects.toThrow(
      new BulkOperationError(`BulkOperationById query with id '1' failed.`),
    );
  });

  it('should throw an error when the bulk operation status is "Failed"', async () => {
    const mockResponse = {
      data: {
        bulkOperationById: generateBulkOperationResponse(
          BulkOperationStatus.Failed,
        ),
      },
    };
    mockGraphQL({BulkOperationById: mockResponse});

    await expect(pollBulkOperationById(graphQL, '1')).rejects.toThrow(
      new BulkOperationError(`BulkOperation '1' failed.`),
    );
  });

  it('should throw an error when the maximum number of polls is reached and the bulk operation status is not "Completed" or "Failed"', async () => {
    const mockResponse = {
      data: {
        bulkOperationById: generateBulkOperationResponse(
          BulkOperationStatus.Running,
        ),
      },
    };
    mockGraphQL({BulkOperationById: mockResponse});

    await expect(pollBulkOperationById(graphQL, '1', 1, 1)).rejects.toThrow(
      new BulkOperationError(`Maximum number of polls reached.`),
    );
  });

  it('should throw an error when the bulk operation status is an unexpected value', async () => {
    const mockResponse = {
      data: {
        bulkOperationById: {
          ...generateBulkOperationResponse(),
          status: 'UnexpectedStatus' as BulkOperationStatus,
        },
      },
    };
    mockGraphQL({BulkOperationById: mockResponse});

    await expect(pollBulkOperationById(graphQL, '1')).rejects.toThrow(
      new BulkOperationError(
        `Unexpected status for BulkOperation '1': UnexpectedStatus`,
      ),
    );
  });
});
