import {NodeOnDiskFile} from '@remix-run/node';
import {Method} from '@shopify/network';
import type {GraphQLClient} from '~/types';

import type {
  CreateStagedUploadMutation as CreateStagedUploadMutationType,
  CreateStagedUploadMutationVariables,
} from 'types/admin.generated';
import type {
  StagedUploadHttpMethodType,
  StagedUploadTargetGenerateUploadResource,
} from 'types/admin.types';
import CreateStagedUploadMutation from './graphql/CreateStagedUploadMutation';

interface UserErrors {
  field?: string[] | null | undefined;
  message: string;
  code?: string | null | undefined;
}

class StagedUploadError extends Error {
  userErrors: UserErrors[];

  constructor(message: string, userErrors?: UserErrors[]) {
    super(message);
    this.userErrors = userErrors || [];
    this.name = 'StagedUploadError';
  }
}

interface TargetParameter {
  name: string;
  value: string;
}

export interface StagedUploadTarget {
  parameters: TargetParameter[];
  resourceUrl: string;
  url: string;
}

// Helper function to check if the status code indicates a successful response
const isSuccessful = (status: number) => status >= 200 && status <= 299;

// Converts an array of inputs into a JSONL file
export const jsonlFileFromInputs = <T>(inputs: ReadonlyArray<T>): File => {
  const jsonlString = inputs
    .map((input: unknown) => JSON.stringify(input))
    .join('\n');

  return new File([`${jsonlString}`], 'bulkOperation.jsonl', {
    type: 'text/jsonl',
  });
};

// Uploads a File to a Target.
const uploadFile = async (
  file: File,
  stagedUploadTarget: StagedUploadTarget,
  abortController?: AbortController,
): Promise<number> => {
  const formData = new FormData();

  stagedUploadTarget.parameters.forEach(({name, value}) => {
    formData.append(name, value);
  });

  const fileName = file.name;
  formData.append('file', file, fileName);

  try {
    const response = await fetch(stagedUploadTarget.url, {
      method: Method.Post,
      body: formData,
      signal: abortController?.signal,
    });

    return response.status;
  } catch (error) {
    let errorMessage = `Upload file '${fileName}' to url '${stagedUploadTarget.url}' failed`;
    if (error instanceof Error) {
      errorMessage += ` with error: ${error.message}`;
    }
    throw new StagedUploadError(errorMessage);
  }
};

// Uploads a file or input array to a staged upload target.
export const uploadToStagedTarget = async <T>(
  stagedUploadTarget: StagedUploadTarget,
  inputs: ReadonlyArray<T> | File | NodeOnDiskFile,
): Promise<void> => {
  let file: File;

  if (inputs instanceof File || inputs instanceof NodeOnDiskFile) {
    file = inputs as File;
  } else {
    file = jsonlFileFromInputs(inputs as ReadonlyArray<T>);
  }

  const status = await uploadFile(file, stagedUploadTarget);
  if (!isSuccessful(status)) {
    throw new StagedUploadError(
      `Upload file '${file.name}' to url '${stagedUploadTarget.url}' failed with HTTP status: ${status}.`,
    );
  }
};

// Creates a staged upload target by calling the StagedUploadsCreate GraphQL mutation.
export const createStagedUploadTarget = async (
  graphql: GraphQLClient,
): Promise<StagedUploadTarget> => {
  const variables: CreateStagedUploadMutationVariables = {
    input: [
      {
        resource:
          'BULK_MUTATION_VARIABLES' as StagedUploadTargetGenerateUploadResource,
        filename: 'bulkMutation.jsonl',
        mimeType: 'text/jsonl',
        httpMethod: 'POST' as StagedUploadHttpMethodType,
      },
    ],
  };

  const response = await graphql(CreateStagedUploadMutation, {variables});

  const {data} = (await response.json()) as {
    data: CreateStagedUploadMutationType;
  };

  const stagedUploadUserErrors = data?.stagedUploadsCreate?.userErrors;

  if (stagedUploadUserErrors && stagedUploadUserErrors.length > 0) {
    const errorMessages = stagedUploadUserErrors.map(
      ({message}: {message: string}) => message,
    );
    throw new StagedUploadError(
      `StagedUploadCreate mutation returned user errors: [${errorMessages.join(
        ', ',
      )}]`,
      stagedUploadUserErrors,
    );
  }

  const stagedTarget = data?.stagedUploadsCreate?.stagedTargets?.[0];

  if (!stagedTarget) {
    throw new StagedUploadError(
      'StagedUploadCreate mutation did not return staged targets.',
    );
  }

  if (stagedTarget.url == null) {
    throw new StagedUploadError('StagedTarget created with a null url.');
  }

  return {
    url: stagedTarget.url,
    resourceUrl: stagedTarget.resourceUrl ?? '',
    parameters: stagedTarget.parameters.map(
      (parameter) =>
        ({
          name: parameter.name,
          value: parameter.value,
        }) as TargetParameter,
    ),
  };
};
