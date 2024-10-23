import {mockShopifyServer} from '#/test-utils';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';

import {logger} from '~/utils/logger.server';
import * as bulkOperations from '../bulkOperations';
import {BulkOperationStatus} from '../bulkOperations';
import {performBulkQuery} from '../performBulkQuery';

const {graphQL} = mockShopifyServer();

function generateBulkOperationResponse(
  status?: BulkOperationStatus,
): bulkOperations.BulkOperation {
  return {
    id: '1',
    url: 'https://example.com/result',
    status: status ?? BulkOperationStatus.Completed,
  };
}

describe('performBulkQuery', () => {
  let getCurrentBulkOperationSpy: MockInstance;
  let startBulkQuerySpy: MockInstance;
  let pollBulkOperationByIdSpy: MockInstance;
  let fetchBulkOperationResultSpy: MockInstance;
  let consoleErrorSpy: MockInstance;

  const bulkOperationMock: bulkOperations.BulkOperation =
    generateBulkOperationResponse(BulkOperationStatus.Completed);
  const queryString = `
    query SubscriptionsContractCsvQuery {
      subscriptionContracts(first: 1) {
        edges {
          node {
            id
            status
            nextBillingDate
            customer {
              id
            }
          }
          lines(first: 10) {
            edges {
              node {
                variantId
                quantity
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  const onSuccessMock = vi.fn();
  const onFailureMock = vi.fn();

  beforeEach(() => {
    getCurrentBulkOperationSpy = vi.spyOn(
      bulkOperations,
      'getCurrentBulkOperation',
    );
    startBulkQuerySpy = vi.spyOn(bulkOperations, 'startBulkQuery');
    pollBulkOperationByIdSpy = vi.spyOn(
      bulkOperations,
      'pollBulkOperationById',
    );
    fetchBulkOperationResultSpy = vi.spyOn(
      bulkOperations,
      'fetchBulkOperationResult',
    );
    consoleErrorSpy = vi.spyOn(logger, 'error');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should resolve with Bulk Operation and call onSuccess when Bulk Query completed successfully', async () => {
    getCurrentBulkOperationSpy.mockResolvedValue(
      generateBulkOperationResponse(BulkOperationStatus.Completed),
    );
    startBulkQuerySpy.mockResolvedValue(bulkOperationMock);
    pollBulkOperationByIdSpy.mockResolvedValue(bulkOperationMock);

    const bulkMutationResult = [
      {
        __lineNumber: 0,
        data: {
          someMutation: {
            userErrors: [{message: 'refreshed error message from result file'}],
          },
        },
      },
    ];
    fetchBulkOperationResultSpy.mockResolvedValue(bulkMutationResult);

    const onSuccessPromise = new Promise((resolve) => {
      onSuccessMock.mockImplementation(() => {
        resolve(null);
      });
    });

    await expect(
      performBulkQuery(graphQL, queryString, onSuccessMock, onFailureMock),
    ).resolves.toEqual(bulkOperationMock);

    await onSuccessPromise;

    expect(startBulkQuerySpy).toHaveBeenCalledWith(graphQL, queryString);
    expect(pollBulkOperationByIdSpy).toHaveBeenCalledWith(
      graphQL,
      bulkOperationMock.id,
    );
    expect(fetchBulkOperationResultSpy).toHaveBeenCalledWith(bulkOperationMock);

    expect(onSuccessMock).toHaveBeenCalledWith(bulkMutationResult);
    expect(onFailureMock).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should reject with an error and call onFailure when another bulk operation is in progress', async () => {
    getCurrentBulkOperationSpy.mockResolvedValue(
      generateBulkOperationResponse(BulkOperationStatus.Running),
    );

    await expect(
      performBulkQuery(graphQL, queryString, onSuccessMock, onFailureMock),
    ).rejects.toThrow(
      new bulkOperations.BulkOperationError(
        'Another bulk operation is already in progress.',
      ),
    );

    expect(onSuccessMock).not.toHaveBeenCalled();
    expect(onFailureMock).toHaveBeenCalledWith(
      'Another bulk operation is already in progress.',
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Another bulk operation is already in progress.',
    );
  });

  it('should reject with an error and call onFailure when getCurrentBulkOperation raises', async () => {
    const expectedError = new Error('getCurrentBulkOperation Error');

    getCurrentBulkOperationSpy.mockRejectedValue(expectedError);

    await expect(
      performBulkQuery(graphQL, queryString, onSuccessMock, onFailureMock),
    ).rejects.toThrow(expectedError);

    expect(onSuccessMock).not.toHaveBeenCalled();
    expect(onFailureMock).toHaveBeenCalledWith(expectedError.message);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expectedError.message);
  });

  it('should reject with an error and call onFailure when startBulkQuery raises', async () => {
    getCurrentBulkOperationSpy.mockResolvedValue(
      generateBulkOperationResponse(BulkOperationStatus.Completed),
    );

    const expectedError = new Error('startBulkMutation Error');
    startBulkQuerySpy.mockRejectedValue(expectedError);

    await expect(
      performBulkQuery(graphQL, queryString, onSuccessMock, onFailureMock),
    ).rejects.toThrow(expectedError);

    expect(onSuccessMock).not.toHaveBeenCalled();
    expect(onFailureMock).toHaveBeenCalledWith(expectedError.message);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expectedError.message);
  });

  it('should resolve with Bulk Operation and call onFailure when pollBulkOperationById promise was rejected', async () => {
    getCurrentBulkOperationSpy.mockResolvedValue(
      generateBulkOperationResponse(BulkOperationStatus.Completed),
    );
    startBulkQuerySpy.mockResolvedValue(bulkOperationMock);

    const expectedError = new Error('pollBulkOperationById Error');
    pollBulkOperationByIdSpy.mockRejectedValue(expectedError);

    await expect(
      performBulkQuery(graphQL, queryString, onSuccessMock, onFailureMock),
    ).resolves.toEqual(bulkOperationMock);

    expect(onSuccessMock).not.toHaveBeenCalled();
    expect(onFailureMock).toHaveBeenCalledWith(expectedError.message);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expectedError.message);
  });

  it('should resolve with Bulk Operation and call onFailure when pollBulkOperationById promise was resolved but fetchBulkOperationResult raised', async () => {
    getCurrentBulkOperationSpy.mockResolvedValue(
      generateBulkOperationResponse(BulkOperationStatus.Completed),
    );
    startBulkQuerySpy.mockResolvedValue(bulkOperationMock);
    pollBulkOperationByIdSpy.mockResolvedValue(bulkOperationMock);

    const expectedError = new Error('fetchBulkOperationResultSpy Error');
    fetchBulkOperationResultSpy.mockRejectedValue(expectedError);

    await expect(
      performBulkQuery(graphQL, queryString, onSuccessMock, onFailureMock),
    ).resolves.toEqual(bulkOperationMock);

    expect(onSuccessMock).not.toHaveBeenCalled();
    expect(onFailureMock).toHaveBeenCalledWith(expectedError.message);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expectedError.message);
  });
});
