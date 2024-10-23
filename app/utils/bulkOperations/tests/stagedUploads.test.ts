import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import CreateStagedUploadMutation from '~/utils/bulkOperations/graphql/CreateStagedUploadMutation';

import {mockShopifyServer} from '#/test-utils';
import {
  createStagedUploadTarget,
  jsonlFileFromInputs,
  uploadToStagedTarget,
  type StagedUploadTarget,
} from '../stagedUploads';

const {graphQL, mockGraphQL} = mockShopifyServer();

describe('jsonlFileFromInputs', () => {
  it('should convert an array to a JSONL file', () => {
    const inputs = [
      {id: 1, name: 'Item 1'},
      {id: 2, name: 'Item 2'},
    ];
    const file = jsonlFileFromInputs(inputs);

    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('bulkOperation.jsonl');
    expect(file.type).toBe('text/jsonl');
  });

  it('should create a JSONL file with the correct contents', (done) => {
    const inputs = [
      {
        id: 1,
        name: 'Item 1',
        details: {
          color: 'red',
          sizes: ['S', 'M', 'L'],
        },
      },
      {
        id: 2,
        name: 'Item 2',
        details: {
          color: 'blue',
          sizes: ['M', 'L', 'XL'],
        },
      },
    ];
    const file = jsonlFileFromInputs(inputs);

    const reader = new FileReader();

    return new Promise<void>((resolve, reject) => {
      reader.onloadend = () => {
        try {
          expect(reader.result).toBe(
            '{"id":1,"name":"Item 1","details":{"color":"red","sizes":["S","M","L"]}}\n' +
              '{"id":2,"name":"Item 2","details":{"color":"blue","sizes":["M","L","XL"]}}',
          );
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  });
});

describe('uploadToStagedTarget', () => {
  let originalFormData: typeof FormData;
  let formDataMock: {append: any};

  beforeEach(() => {
    originalFormData = global.FormData;
    formDataMock = {append: vi.fn()};
    global.FormData = vi.fn(() => formDataMock) as any;
  });

  afterEach(() => {
    global.FormData = originalFormData;
    vi.restoreAllMocks();
  });

  it('should upload a file to a staged upload target from array input', async () => {
    const stagedUploadTarget: StagedUploadTarget = {
      url: 'https://example.com/upload',
      resourceUrl: 'https://example.com/upload',
      parameters: [
        {name: 'param1', value: 'value1'},
        {name: 'param2', value: 'value2'},
      ],
    };
    const inputs = [
      {id: 1, name: 'Item 1'},
      {id: 2, name: 'Item 2'},
    ];

    const mockFetch = vi.fn().mockResolvedValue({status: 200});
    global.fetch = mockFetch;

    await uploadToStagedTarget(stagedUploadTarget, inputs);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(stagedUploadTarget.url, {
      method: 'POST',
      body: formDataMock,
    });

    expect(formDataMock.append).toHaveBeenCalledWith(
      'file',
      expect.any(File),
      'bulkOperation.jsonl',
    );
  });

  it('should upload a file to a staged upload target from File input', async () => {
    const stagedUploadTarget: StagedUploadTarget = {
      url: 'https://example.com/upload',
      resourceUrl: 'https://example.com/upload',
      parameters: [
        {name: 'param1', value: 'value1'},
        {name: 'param2', value: 'value2'},
      ],
    };
    const file = new File(['file contents'], 'file.txt');

    const mockFetch = vi.fn().mockResolvedValue({status: 200});
    global.fetch = mockFetch;

    await uploadToStagedTarget(stagedUploadTarget, file);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(stagedUploadTarget.url, {
      method: 'POST',
      body: formDataMock,
    });
    expect(formDataMock.append).toHaveBeenCalledWith(
      'file',
      expect.any(File),
      'file.txt',
    );
  });

  it('should throw an error if the file upload fails', async () => {
    const stagedUploadTarget: StagedUploadTarget = {
      url: 'https://example.com/upload',
      resourceUrl: 'https://example.com/upload',
      parameters: [
        {name: 'param1', value: 'value1'},
        {name: 'param2', value: 'value2'},
      ],
    };
    const inputs = [
      {id: 1, name: 'Item 1'},
      {id: 2, name: 'Item 2'},
    ];

    const mockFetch = vi.fn().mockRejectedValue(new Error('Upload failed'));
    global.fetch = mockFetch;

    await expect(
      uploadToStagedTarget(stagedUploadTarget, inputs),
    ).rejects.toThrow(
      "Upload file 'bulkOperation.jsonl' to url 'https://example.com/upload' failed with error: Upload failed",
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(stagedUploadTarget.url, {
      method: 'POST',
      body: formDataMock,
    });
    expect(formDataMock.append).toHaveBeenCalledWith(
      'file',
      expect.any(File),
      'bulkOperation.jsonl',
    );
  });

  it('should throw an error if the HTTP status code indicates a non-successful response', async () => {
    const stagedUploadTarget: StagedUploadTarget = {
      url: 'https://example.com/upload',
      resourceUrl: 'https://example.com/upload',
      parameters: [
        {name: 'param1', value: 'value1'},
        {name: 'param2', value: 'value2'},
      ],
    };
    const inputs = [
      {id: 1, name: 'Item 1'},
      {id: 2, name: 'Item 2'},
    ];

    const mockFetch = vi.fn().mockResolvedValue({status: 400});
    global.fetch = mockFetch;

    await expect(
      uploadToStagedTarget(stagedUploadTarget, inputs),
    ).rejects.toThrow(
      "Upload file 'bulkOperation.jsonl' to url 'https://example.com/upload' failed with HTTP status: 400.",
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(stagedUploadTarget.url, {
      method: 'POST',
      body: formDataMock,
    });
    expect(formDataMock.append).toHaveBeenCalledWith(
      'file',
      expect.any(File),
      'bulkOperation.jsonl',
    );
  });
});

describe('createStagedUploadTarget', () => {
  const createStagedUploadMutationGraphQLResponse = (
    errorStrings?: string[],
  ) => {
    return {
      data: {
        stagedUploadsCreate: {
          stagedTargets: errorStrings
            ? []
            : [
                {
                  url: 'https://example.com/staged-upload-location',
                  resourceUrl: 'https://example.com/staged-upload-location',
                  parameters: [
                    {
                      name: 'key',
                      value: 'tmp/1/collections/metafields.jsonl',
                    },
                  ],
                },
              ],
          userErrors: errorStrings
            ? errorStrings.map((message) => ({message}))
            : [],
        },
      },
    };
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create a staged upload target', async () => {
    mockGraphQL({
      CreateStagedUpload: createStagedUploadMutationGraphQLResponse(),
    });

    const stagedUploadTarget = await createStagedUploadTarget(graphQL);

    expect(graphQL).toHavePerformedGraphQLOperation(
      CreateStagedUploadMutation,
      {
        variables: {
          input: [
            {
              resource: 'BULK_MUTATION_VARIABLES',
              filename: 'bulkMutation.jsonl',
              mimeType: 'text/jsonl',
              httpMethod: 'POST',
            },
          ],
        },
      },
    );

    expect(stagedUploadTarget.url).toBe(
      'https://example.com/staged-upload-location',
    );
  });

  it('should throw an error if the createStagedUploadTarget mutation returns user errors', async () => {
    mockGraphQL({
      CreateStagedUpload: createStagedUploadMutationGraphQLResponse([
        'Error 1',
        'Error 2',
      ]),
    });

    await expect(createStagedUploadTarget(graphQL)).rejects.toThrow(
      'StagedUploadCreate mutation returned user errors: [Error 1, Error 2]',
    );

    expect(graphQL).toHavePerformedGraphQLOperation(
      CreateStagedUploadMutation,
      {
        variables: {
          input: [
            {
              resource: 'BULK_MUTATION_VARIABLES',
              filename: 'bulkMutation.jsonl',
              mimeType: 'text/jsonl',
              httpMethod: 'POST',
            },
          ],
        },
      },
    );
  });

  it('should throw an error if the createStagedUploadTarget mutation does not return staged targets', async () => {
    mockGraphQL({
      CreateStagedUpload: {
        data: {
          stagedUploadsCreate: {
            stagedTargets: [],
            userErrors: [],
          },
        },
      },
    });

    await expect(createStagedUploadTarget(graphQL)).rejects.toThrow(
      'StagedUploadCreate mutation did not return staged targets.',
    );

    expect(graphQL).toHavePerformedGraphQLOperation(
      CreateStagedUploadMutation,
      {
        variables: {
          input: [
            {
              resource: 'BULK_MUTATION_VARIABLES',
              filename: 'bulkMutation.jsonl',
              mimeType: 'text/jsonl',
              httpMethod: 'POST',
            },
          ],
        },
      },
    );
  });

  it('should throw an error if the created staged target has a null url', async () => {
    mockGraphQL({
      CreateStagedUpload: {
        data: {
          stagedUploadsCreate: {
            stagedTargets: [
              {
                url: null,
                resourceUrl: '',
                parameters: [],
              },
            ],
            userErrors: [],
          },
        },
      },
    });

    await expect(createStagedUploadTarget(graphQL)).rejects.toThrow(
      'StagedTarget created with a null url.',
    );

    expect(graphQL).toHavePerformedGraphQLOperation(
      CreateStagedUploadMutation,
      {
        variables: {
          input: [
            {
              resource: 'BULK_MUTATION_VARIABLES',
              filename: 'bulkMutation.jsonl',
              mimeType: 'text/jsonl',
              httpMethod: 'POST',
            },
          ],
        },
      },
    );
  });
});
