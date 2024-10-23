import {mockShopifyServer} from '#/test-utils';
import type {MockInstance} from 'vitest';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {logger} from '~/utils/logger.server';
import * as bulkOperations from '../bulkOperations';
import {BulkOperationStatus} from '../bulkOperations';
import {performBulkMutation} from '../performBulkMutation';
import * as stagedUploads from '../stagedUploads';

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

describe('performBulkMutation', () => {
  let getCurrentBulkOperationSpy: MockInstance;
  let createStagedUploadTargetSpy: MockInstance;
  let uploadToStagedTargetSpy: MockInstance;
  let startBulkMutationSpy: MockInstance;
  let pollBulkOperationByIdSpy: MockInstance;
  let fetchBulkOperationResultSpy: MockInstance;
  let consoleErrorSpy: MockInstance;

  const stagedUploadTargetMock: stagedUploads.StagedUploadTarget = {
    url: 'https://example.com/upload',
    resourceUrl: 'https://example.com/upload',
    parameters: [{name: 'key', value: 'value'}],
  };
  const bulkOperationMock: bulkOperations.BulkOperation =
    generateBulkOperationResponse(BulkOperationStatus.Completed);

  const bulkOperationWithMetadataMock: bulkOperations.BulkOperationWithMetadata =
    {
      bulkOperation: bulkOperationMock,
      stagedUploadTargetUrl: stagedUploadTargetMock.url,
    };

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
  const inputs = [];
  const onSuccessMock = vi.fn();
  const onFailureMock = vi.fn();

  beforeEach(() => {
    getCurrentBulkOperationSpy = vi.spyOn(
      bulkOperations,
      'getCurrentBulkOperation',
    );
    createStagedUploadTargetSpy = vi.spyOn(
      stagedUploads,
      'createStagedUploadTarget',
    );
    uploadToStagedTargetSpy = vi.spyOn(stagedUploads, 'uploadToStagedTarget');
    startBulkMutationSpy = vi.spyOn(bulkOperations, 'startBulkMutation');
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

  it('should resolve with Bulk Operation and call onSuccess when Bulk Mutation completed successfully', async () => {
    getCurrentBulkOperationSpy.mockResolvedValue(
      generateBulkOperationResponse(BulkOperationStatus.Completed),
    );
    createStagedUploadTargetSpy.mockResolvedValue(stagedUploadTargetMock);
    uploadToStagedTargetSpy.mockResolvedValue(undefined);
    startBulkMutationSpy.mockResolvedValue(bulkOperationMock);
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
      performBulkMutation(
        graphQL,
        mutationString,
        inputs,
        onSuccessMock,
        onFailureMock,
      ),
    ).resolves.toEqual(bulkOperationWithMetadataMock);

    await onSuccessPromise;

    expect(createStagedUploadTargetSpy).toHaveBeenCalledWith(graphQL);
    expect(uploadToStagedTargetSpy).toHaveBeenCalledWith(
      stagedUploadTargetMock,
      inputs,
    );
    expect(startBulkMutationSpy).toHaveBeenCalledWith(
      graphQL,
      stagedUploadTargetMock,
      mutationString,
    );
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
      performBulkMutation(
        graphQL,
        mutationString,
        inputs,
        onSuccessMock,
        onFailureMock,
      ),
    ).rejects.toThrow(
      new bulkOperations.BulkOperationError(
        'Another bulk mutation is already in progress.',
      ),
    );

    expect(onSuccessMock).not.toHaveBeenCalled();
    expect(onFailureMock).toHaveBeenCalledWith(
      'Another bulk mutation is already in progress.',
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Another bulk mutation is already in progress.',
    );
  });

  it('should reject with an error and call onFailure when getCurrentBulkOperation raises', async () => {
    const expectedError = new Error('getCurrentBulkOperation Error');

    getCurrentBulkOperationSpy.mockRejectedValue(expectedError);

    await expect(
      performBulkMutation(
        graphQL,
        mutationString,
        inputs,
        onSuccessMock,
        onFailureMock,
      ),
    ).rejects.toThrow(expectedError);

    expect(onSuccessMock).not.toHaveBeenCalled();
    expect(onFailureMock).toHaveBeenCalledWith(expectedError.message);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expectedError.message);
  });

  it('should reject with an error and call onFailure when createStagedUploadTarget raises', async () => {
    getCurrentBulkOperationSpy.mockResolvedValue(
      generateBulkOperationResponse(BulkOperationStatus.Completed),
    );

    const expectedError = new Error('createStagedUploadTarget Error');
    createStagedUploadTargetSpy.mockRejectedValue(expectedError);

    await expect(
      performBulkMutation(
        graphQL,
        mutationString,
        inputs,
        onSuccessMock,
        onFailureMock,
      ),
    ).rejects.toThrow(expectedError);

    expect(onSuccessMock).not.toHaveBeenCalled();
    expect(onFailureMock).toHaveBeenCalledWith(expectedError.message);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expectedError.message);
  });

  it('should reject with an error and call onFailure when uploadToStagedTarget raises', async () => {
    getCurrentBulkOperationSpy.mockResolvedValue(
      generateBulkOperationResponse(BulkOperationStatus.Completed),
    );
    createStagedUploadTargetSpy.mockResolvedValue(stagedUploadTargetMock);

    const expectedError = new Error('uploadToStagedTarget Error');
    uploadToStagedTargetSpy.mockRejectedValue(expectedError);

    await expect(
      performBulkMutation(
        graphQL,
        mutationString,
        inputs,
        onSuccessMock,
        onFailureMock,
      ),
    ).rejects.toThrow(expectedError);

    expect(onSuccessMock).not.toHaveBeenCalled();
    expect(onFailureMock).toHaveBeenCalledWith(expectedError.message);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expectedError.message);
  });

  it('should reject with an error and call onFailure when startBulkMutation raises', async () => {
    getCurrentBulkOperationSpy.mockResolvedValue(
      generateBulkOperationResponse(BulkOperationStatus.Completed),
    );
    createStagedUploadTargetSpy.mockResolvedValue(stagedUploadTargetMock);
    uploadToStagedTargetSpy.mockResolvedValue(undefined);

    const expectedError = new Error('startBulkMutation Error');
    startBulkMutationSpy.mockRejectedValue(expectedError);

    await expect(
      performBulkMutation(
        graphQL,
        mutationString,
        inputs,
        onSuccessMock,
        onFailureMock,
      ),
    ).rejects.toThrow(expectedError);

    expect(onSuccessMock).not.toHaveBeenCalled();
    expect(onFailureMock).toHaveBeenCalledWith(expectedError.message);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expectedError.message);
  });

  it('should resolve with Bulk Operation and call onFailure when pollBulkOperationById promise was rejected', async () => {
    getCurrentBulkOperationSpy.mockResolvedValue(
      generateBulkOperationResponse(BulkOperationStatus.Completed),
    );
    createStagedUploadTargetSpy.mockResolvedValue(stagedUploadTargetMock);
    uploadToStagedTargetSpy.mockResolvedValue(undefined);
    startBulkMutationSpy.mockResolvedValue(bulkOperationMock);

    const expectedError = new Error('pollBulkOperationById Error');
    pollBulkOperationByIdSpy.mockRejectedValue(expectedError);

    await expect(
      performBulkMutation(
        graphQL,
        mutationString,
        inputs,
        onSuccessMock,
        onFailureMock,
      ),
    ).resolves.toEqual(bulkOperationWithMetadataMock);

    expect(onSuccessMock).not.toHaveBeenCalled();
    expect(onFailureMock).toHaveBeenCalledWith(expectedError.message);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expectedError.message);
  });

  it('should resolve with Bulk Operation and call onFailure when pollBulkOperationById promise was resolved but fetchBulkOperationResult raised', async () => {
    getCurrentBulkOperationSpy.mockResolvedValue(
      generateBulkOperationResponse(BulkOperationStatus.Completed),
    );
    createStagedUploadTargetSpy.mockResolvedValue(stagedUploadTargetMock);
    uploadToStagedTargetSpy.mockResolvedValue(undefined);
    startBulkMutationSpy.mockResolvedValue(bulkOperationMock);
    pollBulkOperationByIdSpy.mockResolvedValue(bulkOperationMock);

    const expectedError = new Error('fetchBulkOperationResultSpy Error');
    fetchBulkOperationResultSpy.mockRejectedValue(expectedError);

    await expect(
      performBulkMutation(
        graphQL,
        mutationString,
        inputs,
        onSuccessMock,
        onFailureMock,
      ),
    ).resolves.toEqual(bulkOperationWithMetadataMock);

    expect(onSuccessMock).not.toHaveBeenCalled();
    expect(onFailureMock).toHaveBeenCalledWith(expectedError.message);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expectedError.message);
  });
});
