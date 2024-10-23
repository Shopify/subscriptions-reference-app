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
import MetaobjectRepository from '../MetaobjectRepository';

import type {
  MetaobjectByHandleQuery as MetaobjectByHandleQueryType,
  MetaobjectByHandleQueryVariables,
  MetaobjectByIdQuery as MetaobjectByIdQueryType,
  MetaobjectByIdQueryVariables,
  MetaobjectCreateMutation as MetaobjectCreateMutationType,
  MetaobjectCreateMutationVariables,
  MetaobjectDefinitionByTypeQuery as MetaobjectDefinitionByTypeQueryType,
  MetaobjectDefinitionByTypeQueryVariables,
  MetaobjectDefinitionCreateMutation as MetaobjectDefinitionCreateMutationType,
  MetaobjectDefinitionCreateMutationVariables,
  MetaobjectUpdateMutation as MetaobjectUpdateMutationType,
  MetaobjectUpdateMutationVariables,
  MetaobjectUpsertMutation as MetaobjectUpsertMutationType,
  MetaobjectUpsertMutationVariables,
  MetaobjectsQuery as MetaobjectsQueryType,
  MetaobjectsQueryVariables,
} from 'types/admin.generated';
import {type MetaobjectFieldDefinition} from 'types/admin.types';
import MetaobjectByHandleQuery from '~/graphql/MetaobjectByHandleQuery';
import MetaobjectByIdQuery from '~/graphql/MetaobjectByIdQuery';
import MetaobjectCreateMutation from '~/graphql/MetaobjectCreateMutation';
import MetaobjectDefinitionByTypeQuery from '~/graphql/MetaobjectDefinitionByTypeQuery';
import MetaobjectDefinitionCreateMutation from '~/graphql/MetaobjectDefinitionCreateMutation';
import MetaobjectUpdateMutation from '~/graphql/MetaobjectUpdateMutation';
import MetaobjectUpsertMutation from '~/graphql/MetaobjectUpsertMutation';
import MetaobjectsQuery from '~/graphql/MetaobjectsQuery';
import {
  MetafieldType,
  type MetaobjectField,
  type NonNullMetaobjectField,
} from '../MetaobjectField';

describe('MetaobjectRepository', () => {
  const {graphQL, mockGraphQL} = mockShopifyServer();
  let loggerSpy: MockInstance;

  const metaobjectId = 'gid://shopify/MetaObject/9';
  const metaobjectType = 'onboarding';
  const metaobjectHandle = 'test-shop';
  const metaobjectResponseFields = [
    {
      key: 'foo',
      value: 'Text Value',
      type: 'single_line_text_field',
    },
    {
      key: 'bar',
      value: 'true',
      type: 'boolean',
    },
  ];
  const metaobjectFields: NonNullMetaobjectField[] = [
    {
      valueType: MetafieldType.SINGLE_LINE_TEXT_FIELD,
      key: 'foo',
      value: 'Text Value',
    },
    {
      valueType: MetafieldType.BOOLEAN,
      key: 'bar',
      value: true,
    },
  ];

  const metaobjectDefinitionId = 'gid://shopify/MetaobjectDefinition/123';
  const metaobjectDefinitionType = metaobjectType;
  const metaobjectDefinitionName = 'Onboarding';
  const metaobjectDefinitionInput = {
    name: 'Metaobject Definition',
    description: 'Definition Description',
    type: 'definition-type',
    fieldDefinitions: [
      {
        description: 'Foo Description',
        key: 'foo',
        name: 'Foo',
        type: 'single_line_text_field',
        required: true,
        validations: [],
      },
      {
        description: 'Bar Description',
        key: 'bar',
        name: 'Bar',
        type: 'boolean',
        required: true,
        validations: [],
      },
    ],
  };

  beforeEach(() => {
    loggerSpy = vi.spyOn(logger, 'error');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchMetaobjectByHandle', () => {
    it('returns the metaobject for a given type and handle', async () => {
      const mockResponse: {
        data?: MetaobjectByHandleQueryType;
      } = {
        data: {
          metaobjectByHandle: {
            id: metaobjectId,
            fields: metaobjectResponseFields,
          },
        },
      };

      mockGraphQL({MetaobjectByHandle: mockResponse});

      const repository = new MetaobjectRepository(graphQL);
      const metaobject = await repository.fetchMetaobjectByHandle({
        type: metaobjectType,
        handle: metaobjectHandle,
      });

      expect(graphQL).toHavePerformedGraphQLOperation(MetaobjectByHandleQuery, {
        variables: {
          handle: {
            type: metaobjectType,
            handle: metaobjectHandle,
          },
        } as MetaobjectByHandleQueryVariables,
      });

      expect(metaobject?.id).toEqual(metaobjectId);
      expect(metaobject?.fields).toEqual(metaobjectFields);
    });

    it('returns undefined if the metaobject does not exist', async () => {
      const mockResponse: {
        data?: MetaobjectByHandleQueryType;
      } = {
        data: {
          metaobjectByHandle: null,
        },
      };

      mockGraphQL({MetaobjectByHandle: mockResponse});

      const repository = new MetaobjectRepository(graphQL);
      const metaobject = await repository.fetchMetaobjectByHandle({
        type: metaobjectType,
        handle: metaobjectHandle,
      });

      expect(metaobject).toBeUndefined();
      expect(loggerSpy).toHaveBeenCalledWith(
        mockResponse,
        `Metaobject not found for type '${metaobjectType}' and handle '${metaobjectHandle}'`,
      );
      expect(graphQL).toHavePerformedGraphQLOperation(MetaobjectByHandleQuery, {
        variables: {
          handle: {
            type: metaobjectType,
            handle: metaobjectHandle,
          },
        } as MetaobjectByHandleQueryVariables,
      });
    });
  });

  describe('fetchMetaobjectById', () => {
    it('returns the metaobject for a given id', async () => {
      const mockResponse: {
        data?: MetaobjectByIdQueryType;
      } = {
        data: {
          metaobject: {
            id: metaobjectId,
            fields: metaobjectResponseFields,
          },
        },
      };

      mockGraphQL({MetaobjectById: mockResponse});

      const repository = new MetaobjectRepository(graphQL);
      const metaobject = await repository.fetchMetaobjectById({
        id: metaobjectId,
      });

      expect(metaobject?.id).toEqual(metaobjectId);
      expect(metaobject?.fields).toEqual(metaobjectFields);
      expect(graphQL).toHavePerformedGraphQLOperation(MetaobjectByIdQuery, {
        variables: {id: metaobjectId} as MetaobjectByIdQueryVariables,
      });
    });

    it('returns undefined if the metaobject does not exist', async () => {
      const mockResponse: {
        data?: MetaobjectByIdQueryType;
      } = {
        data: {
          metaobject: null,
        },
      };

      mockGraphQL({MetaobjectById: mockResponse});

      const repository = new MetaobjectRepository(graphQL);
      const metaobject = await repository.fetchMetaobjectById({
        id: metaobjectId,
      });

      expect(metaobject).toBeUndefined();
      expect(loggerSpy).toHaveBeenCalledWith(
        mockResponse,
        `Metaobject not found for id '${metaobjectId}'`,
      );
      expect(graphQL).toHavePerformedGraphQLOperation(MetaobjectByIdQuery, {
        variables: {id: metaobjectId} as MetaobjectByIdQueryVariables,
      });
    });
  });

  describe('fetchMetaobjectDefinitionByType', () => {
    it('returns the metaobject definition for a given type', async () => {
      const mockResponse: {
        data?: MetaobjectDefinitionByTypeQueryType;
      } = {
        data: {
          metaobjectDefinitionByType: {
            id: metaobjectDefinitionId,
            type: metaobjectDefinitionType,
            name: metaobjectDefinitionName,
            fieldDefinitions: metaobjectDefinitionInput.fieldDefinitions,
          },
        },
      };

      mockGraphQL({MetaobjectDefinitionByType: mockResponse});

      const repository = new MetaobjectRepository(graphQL);
      const definition = await repository.fetchMetaobjectDefinitionByType({
        type: metaobjectType,
      });

      expect(definition?.id).toEqual(metaobjectDefinitionId);
      expect(graphQL).toHavePerformedGraphQLOperation(
        MetaobjectDefinitionByTypeQuery,
        {
          variables: {
            type: metaobjectType,
          } as MetaobjectDefinitionByTypeQueryVariables,
        },
      );
    });

    it('returns undefined if the metaobject definition does not exist', async () => {
      const mockResponse: {
        data?: MetaobjectDefinitionByTypeQueryType;
      } = {
        data: {
          metaobjectDefinitionByType: null,
        },
      };

      mockGraphQL({MetaobjectDefinitionByType: mockResponse});

      const repository = new MetaobjectRepository(graphQL);
      const definition = await repository.fetchMetaobjectDefinitionByType({
        type: metaobjectType,
      });

      expect(definition).toBeUndefined();
      expect(loggerSpy).toHaveBeenCalledWith(
        mockResponse,
        `Metaobject definition not found for type '${metaobjectType}'`,
      );
      expect(graphQL).toHavePerformedGraphQLOperation(
        MetaobjectDefinitionByTypeQuery,
        {
          variables: {
            type: metaobjectType,
          } as MetaobjectDefinitionByTypeQueryVariables,
        },
      );
    });
  });

  describe('fetchMetaobjects', () => {
    it('returns the metaobjects for a given type, first, and sortKey', async () => {
      const metaobjectId1 = 'gid://shopify/MetaObject/1';
      const metaobjectResponseFields1 = [
        {
          key: 'foo',
          value: 'Text Value 1',
          type: 'single_line_text_field',
        },
        {
          key: 'bar',
          value: 'true',
          type: 'boolean',
        },
      ];
      const metaobjectFields1: MetaobjectField[] = [
        {
          valueType: MetafieldType.SINGLE_LINE_TEXT_FIELD,
          key: 'foo',
          value: 'Text Value 1',
        },
        {
          valueType: MetafieldType.BOOLEAN,
          key: 'bar',
          value: true,
        },
      ];

      const metaobjectId2 = 'gid://shopify/MetaObject/2';
      const metaobjectResponseFields2 = [
        {
          key: 'foo',
          value: 'Text Value 2',
          type: 'single_line_text_field',
        },
        {
          key: 'bar',
          value: 'false',
          type: 'boolean',
        },
      ];
      const metaobjectFields2: MetaobjectField[] = [
        {
          valueType: MetafieldType.SINGLE_LINE_TEXT_FIELD,
          key: 'foo',
          value: 'Text Value 2',
        },
        {
          valueType: MetafieldType.BOOLEAN,
          key: 'bar',
          value: false,
        },
      ];

      const mockResponse: {
        data?: MetaobjectsQueryType;
      } = {
        data: {
          metaobjects: {
            edges: [
              {
                node: {
                  id: metaobjectId1,
                  fields: metaobjectResponseFields1,
                },
              },
              {
                node: {
                  id: metaobjectId2,
                  fields: metaobjectResponseFields2,
                },
              },
            ],
          },
        },
      };

      mockGraphQL({Metaobjects: mockResponse});

      const repository = new MetaobjectRepository(graphQL);
      const metaobjects = await repository.fetchMetaobjects({
        type: metaobjectType,
        first: 5,
        sortKey: 'id',
      });

      expect(metaobjects?.length).toEqual(2);
      expect(metaobjects?.[0].id).toEqual(metaobjectId1);
      expect(metaobjects?.[0].fields).toEqual(metaobjectFields1);
      expect(metaobjects?.[1].id).toEqual(metaobjectId2);
      expect(metaobjects?.[1].fields).toEqual(metaobjectFields2);
      expect(graphQL).toHavePerformedGraphQLOperation(MetaobjectsQuery, {
        variables: {
          type: metaobjectType,
          first: 5,
          sortKey: 'id',
        } as MetaobjectsQueryVariables,
      });
    });

    it('returns the metaobjects for a given type, with first 10 results, and undefined sortKey by default', async () => {
      const metaobjectId1 = 'gid://shopify/MetaObject/1';
      const metaobjectResponseFields1 = [
        {
          key: 'foo',
          value: 'Text Value 1',
          type: 'single_line_text_field',
        },
        {
          key: 'bar',
          value: 'true',
          type: 'boolean',
        },
      ];
      const metaobjectFields1: MetaobjectField[] = [
        {
          valueType: MetafieldType.SINGLE_LINE_TEXT_FIELD,
          key: 'foo',
          value: 'Text Value 1',
        },
        {
          valueType: MetafieldType.BOOLEAN,
          key: 'bar',
          value: true,
        },
      ];

      const metaobjectId2 = 'gid://shopify/MetaObject/2';
      const metaobjectResponseFields2 = [
        {
          key: 'foo',
          value: 'Text Value 2',
          type: 'single_line_text_field',
        },
        {
          key: 'bar',
          value: 'false',
          type: 'boolean',
        },
      ];
      const metaobjectFields2: MetaobjectField[] = [
        {
          valueType: MetafieldType.SINGLE_LINE_TEXT_FIELD,
          key: 'foo',
          value: 'Text Value 2',
        },
        {
          valueType: MetafieldType.BOOLEAN,
          key: 'bar',
          value: false,
        },
      ];

      const mockResponse: {
        data?: MetaobjectsQueryType;
      } = {
        data: {
          metaobjects: {
            edges: [
              {
                node: {
                  id: metaobjectId1,
                  fields: metaobjectResponseFields1,
                },
              },
              {
                node: {
                  id: metaobjectId2,
                  fields: metaobjectResponseFields2,
                },
              },
            ],
          },
        },
      };

      mockGraphQL({Metaobjects: mockResponse});

      const repository = new MetaobjectRepository(graphQL);
      const metaobjects = await repository.fetchMetaobjects({
        type: metaobjectType,
      });

      expect(metaobjects?.length).toEqual(2);
      expect(metaobjects?.[0].id).toEqual(metaobjectId1);
      expect(metaobjects?.[0].fields).toEqual(metaobjectFields1);
      expect(metaobjects?.[1].id).toEqual(metaobjectId2);
      expect(metaobjects?.[1].fields).toEqual(metaobjectFields2);
      expect(graphQL).toHavePerformedGraphQLOperation(MetaobjectsQuery, {
        variables: {
          type: metaobjectType,
          first: 10,
          sortKey: undefined,
        } as MetaobjectsQueryVariables,
      });
    });

    it('returns undefined if no metaobjects could be loaded', async () => {
      const mockResponse: {
        data?: MetaobjectsQueryType;
      } = {
        data: undefined,
      };

      mockGraphQL({Metaobjects: mockResponse});

      const repository = new MetaobjectRepository(graphQL);
      const metaobjects = await repository.fetchMetaobjects({
        type: metaobjectType,
        sortKey: 'id',
      });

      expect(metaobjects).toBeUndefined();
      expect(loggerSpy).toHaveBeenCalledWith(
        mockResponse,
        `Metaobjects not found for type '${metaobjectType}'`,
      );
      expect(graphQL).toHavePerformedGraphQLOperation(MetaobjectsQuery, {
        variables: {
          type: metaobjectType,
          sortKey: 'id',
        } as MetaobjectsQueryVariables,
      });
    });

    it('returns empty array if no metaobjects are found', async () => {
      const mockResponse: {
        data?: MetaobjectsQueryType;
      } = {
        data: {
          metaobjects: {
            edges: [],
          },
        },
      };

      mockGraphQL({Metaobjects: mockResponse});

      const repository = new MetaobjectRepository(graphQL);
      const metaobjects = await repository.fetchMetaobjects({
        type: metaobjectType,
        sortKey: 'id',
      });

      expect(metaobjects).toEqual([]);
      expect(graphQL).toHavePerformedGraphQLOperation(MetaobjectsQuery, {
        variables: {
          type: metaobjectType,
          sortKey: 'id',
        } as MetaobjectsQueryVariables,
      });
    });
  });

  describe('createMetaobjectDefinition', () => {
    it('creates a metaobject definition and returns it', async () => {
      const mockResponse: {
        data?: MetaobjectDefinitionCreateMutationType;
      } = {
        data: {
          metaobjectDefinitionCreate: {
            metaobjectDefinition: {
              id: metaobjectDefinitionId,
              type: metaobjectType,
              name: metaobjectDefinitionName,
              fieldDefinitions: [],
            },
            userErrors: [],
          },
        },
      };

      mockGraphQL({MetaobjectDefinitionCreate: mockResponse});

      const repository = new MetaobjectRepository(graphQL);
      const definition = await repository.createMetaobjectDefinition(
        metaobjectDefinitionInput,
      );

      expect(definition?.id).toEqual(metaobjectDefinitionId);
      expect(graphQL).toHavePerformedGraphQLOperation(
        MetaobjectDefinitionCreateMutation,
        {
          variables: {
            definition: metaobjectDefinitionInput,
          } as MetaobjectDefinitionCreateMutationVariables,
        },
      );
    });

    it('throws an error if the creation fails', async () => {
      const mockResponse: {
        data?: MetaobjectDefinitionCreateMutationType;
      } = {
        data: {
          metaobjectDefinitionCreate: null,
        },
      };

      mockGraphQL({MetaobjectDefinitionCreate: mockResponse});

      const repository = new MetaobjectRepository(graphQL);

      await expect(
        repository.createMetaobjectDefinition(metaobjectDefinitionInput),
      ).rejects.toThrow('MetaobjectDefinitionCreate Mutation failed.');
      expect(graphQL).toHavePerformedGraphQLOperation(
        MetaobjectDefinitionCreateMutation,
        {
          variables: {
            definition: metaobjectDefinitionInput,
          } as MetaobjectDefinitionCreateMutationVariables,
        },
      );
    });

    it('throws an error if there are user errors', async () => {
      const userErrors = [
        {
          message: 'Error message 1',
          field: ['foo'],
          code: 'INVALID' as any,
        },
        {
          message: 'Error message 2',
          field: ['bar'],
          code: 'BLANK' as any,
        },
      ];

      const mockResponse: {
        data?: MetaobjectDefinitionCreateMutationType;
      } = {
        data: {
          metaobjectDefinitionCreate: {
            userErrors,
          },
        },
      };

      mockGraphQL({MetaobjectDefinitionCreate: mockResponse});

      const repository = new MetaobjectRepository(graphQL);

      await expect(
        repository.createMetaobjectDefinition(metaobjectDefinitionInput),
      ).rejects.toThrow(
        `MetaobjectDefinitionCreate Mutation returned User Errors: ${JSON.stringify(
          userErrors,
        )}`,
      );
      expect(graphQL).toHavePerformedGraphQLOperation(
        MetaobjectDefinitionCreateMutation,
        {
          variables: {
            definition: metaobjectDefinitionInput,
          } as MetaobjectDefinitionCreateMutationVariables,
        },
      );
    });
  });

  describe('createMetaobject', () => {
    it('creates a metaobject and returns it', async () => {
      const mockResponse: {
        data?: MetaobjectCreateMutationType;
      } = {
        data: {
          metaobjectCreate: {
            metaobject: {
              id: metaobjectId,
              fields: metaobjectResponseFields,
            },
            userErrors: [],
          },
        },
      };

      mockGraphQL({MetaobjectCreate: mockResponse});

      const repository = new MetaobjectRepository(graphQL);
      const metaobject = await repository.createMetaobject({
        handle: {
          handle: metaobjectHandle,
          type: metaobjectType,
        },
        fields: metaobjectFields,
      });

      expect(metaobject?.id).toEqual(metaobjectId);
      expect(metaobject?.fields).toEqual(metaobjectFields);
      expect(graphQL).toHavePerformedGraphQLOperation(
        MetaobjectCreateMutation,
        {
          variables: {
            metaobject: {
              type: metaobjectType,
              fields: [
                {key: 'foo', value: 'Text Value'},
                {key: 'bar', value: 'true'},
              ],
            },
          } as MetaobjectCreateMutationVariables,
        },
      );
    });

    it('throws an error if the creation fails', async () => {
      const mockResponse: {
        data?: MetaobjectCreateMutationType;
      } = {
        data: {
          metaobjectCreate: null,
        },
      };

      mockGraphQL({MetaobjectCreate: mockResponse});

      const repository = new MetaobjectRepository(graphQL);

      await expect(
        repository.createMetaobject({
          handle: {
            handle: metaobjectHandle,
            type: metaobjectType,
          },
          fields: metaobjectFields,
        }),
      ).rejects.toThrow('MetaobjectCreate Mutation failed.');
      expect(graphQL).toHavePerformedGraphQLOperation(
        MetaobjectCreateMutation,
        {
          variables: {
            metaobject: {
              type: metaobjectType,
              fields: [
                {key: 'foo', value: 'Text Value'},
                {key: 'bar', value: 'true'},
              ],
            },
          } as MetaobjectCreateMutationVariables,
        },
      );
    });

    it('throws an error if there are user errors', async () => {
      const userErrors = [
        {
          message: 'Error message 1',
          field: ['foo'],
          code: 'INVALID' as any,
        },
        {
          message: 'Error message 2',
          field: ['bar'],
          code: 'BLANK' as any,
        },
      ];

      const mockResponse: {
        data?: MetaobjectCreateMutationType;
      } = {
        data: {
          metaobjectCreate: {
            userErrors,
          },
        },
      };

      mockGraphQL({MetaobjectCreate: mockResponse});

      const repository = new MetaobjectRepository(graphQL);

      await expect(
        repository.createMetaobject({
          handle: {
            handle: metaobjectHandle,
            type: metaobjectType,
          },
          fields: metaobjectFields,
        }),
      ).rejects.toThrow(
        `MetaobjectCreate Mutation returned User Errors: ${JSON.stringify(
          userErrors,
        )}`,
      );
      expect(graphQL).toHavePerformedGraphQLOperation(
        MetaobjectCreateMutation,
        {
          variables: {
            metaobject: {
              type: metaobjectType,
              fields: [
                {key: 'foo', value: 'Text Value'},
                {key: 'bar', value: 'true'},
              ],
            },
          } as MetaobjectCreateMutationVariables,
        },
      );
    });
  });

  describe('updateMetaobject', () => {
    it('updates a metaobject and returns it', async () => {
      const mockResponse: {
        data?: MetaobjectUpdateMutationType;
      } = {
        data: {
          metaobjectUpdate: {
            metaobject: {
              id: metaobjectId,
              fields: metaobjectResponseFields,
            },
            userErrors: [],
          },
        },
      };

      mockGraphQL({MetaobjectUpdate: mockResponse});

      const repository = new MetaobjectRepository(graphQL);
      const metaobject = await repository.updateMetaobject({
        id: metaobjectId,
        fields: metaobjectFields,
      });

      expect(metaobject?.id).toEqual(metaobjectId);
      expect(metaobject?.fields).toEqual(metaobjectFields);
      expect(graphQL).toHavePerformedGraphQLOperation(
        MetaobjectUpdateMutation,
        {
          variables: {
            id: metaobjectId,
            metaobject: {
              fields: [
                {key: 'foo', value: 'Text Value'},
                {key: 'bar', value: 'true'},
              ],
            },
          } as MetaobjectUpdateMutationVariables,
        },
      );
    });

    it('throws an error if the update fails', async () => {
      const mockResponse: {
        data?: MetaobjectUpdateMutationType;
      } = {
        data: {
          metaobjectUpdate: null,
        },
      };

      mockGraphQL({MetaobjectUpdate: mockResponse});

      const repository = new MetaobjectRepository(graphQL);

      await expect(
        repository.updateMetaobject({
          id: metaobjectId,
          fields: metaobjectFields,
        }),
      ).rejects.toThrow('MetaobjectUpsert Mutation failed.');
      expect(graphQL).toHavePerformedGraphQLOperation(
        MetaobjectUpdateMutation,
        {
          variables: {
            id: metaobjectId,
            metaobject: {
              fields: [
                {key: 'foo', value: 'Text Value'},
                {key: 'bar', value: 'true'},
              ],
            },
          } as MetaobjectUpdateMutationVariables,
        },
      );
    });

    it('throws an error if there are user errors', async () => {
      const userErrors = [
        {
          message: 'Error message 1',
          field: ['foo'],
          code: 'INVALID' as any,
        },
        {
          message: 'Error message 2',
          field: ['bar'],
          code: 'BLANK' as any,
        },
      ];
      const mockResponse: {
        data?: MetaobjectUpdateMutationType;
      } = {
        data: {
          metaobjectUpdate: {
            userErrors,
          },
        },
      };

      mockGraphQL({MetaobjectUpdate: mockResponse});

      const repository = new MetaobjectRepository(graphQL);

      await expect(
        repository.updateMetaobject({
          id: metaobjectId,
          fields: metaobjectFields,
        }),
      ).rejects.toThrow(
        `MetaobjectUpdate Mutation returned User Errors: ${JSON.stringify(
          userErrors,
        )}`,
      );
      expect(graphQL).toHavePerformedGraphQLOperation(
        MetaobjectUpdateMutation,
        {
          variables: {
            id: metaobjectId,
            metaobject: {
              fields: [
                {key: 'foo', value: 'Text Value'},
                {key: 'bar', value: 'true'},
              ],
            },
          } as MetaobjectUpdateMutationVariables,
        },
      );
    });
  });

  describe('upsertMetaobjectByHandle', () => {
    it('upserts a metaobject by handle and returns it', async () => {
      const handle = {
        handle: metaobjectHandle,
        type: metaobjectType,
      };

      const mockResponse: {
        data?: MetaobjectUpsertMutationType;
      } = {
        data: {
          metaobjectUpsert: {
            metaobject: {
              id: metaobjectId,
              fields: metaobjectResponseFields,
            },
            userErrors: [],
          },
        },
      };

      mockGraphQL({MetaobjectUpsert: mockResponse});

      const repository = new MetaobjectRepository(graphQL);
      const metaobject = await repository.upsertMetaobjectByHandle({
        handle: {
          handle: metaobjectHandle,
          type: metaobjectType,
        },
        fields: metaobjectFields,
      });

      expect(metaobject?.id).toEqual(metaobjectId);
      expect(metaobject?.fields).toEqual(metaobjectFields);
      expect(graphQL).toHavePerformedGraphQLOperation(
        MetaobjectUpsertMutation,
        {
          variables: {
            handle: handle,
            metaobject: {
              fields: [
                {key: 'foo', value: 'Text Value'},
                {key: 'bar', value: 'true'},
              ],
            },
          } as MetaobjectUpsertMutationVariables,
        },
      );
    });

    it('throws an error if the upsert operation fails', async () => {
      const mockResponse: {
        data?: MetaobjectUpsertMutationType;
      } = {
        data: {
          metaobjectUpsert: null,
        },
      };

      mockGraphQL({MetaobjectUpsert: mockResponse});

      const repository = new MetaobjectRepository(graphQL);

      await expect(
        repository.upsertMetaobjectByHandle({
          handle: {handle: metaobjectHandle, type: metaobjectType},
          fields: metaobjectFields,
        }),
      ).rejects.toThrow('MetaobjectUpsert Mutation failed.');
      expect(graphQL).toHavePerformedGraphQLOperation(
        MetaobjectUpsertMutation,
        {
          variables: {
            handle: {handle: metaobjectHandle, type: metaobjectType},
            metaobject: {
              fields: [
                {key: 'foo', value: 'Text Value'},
                {key: 'bar', value: 'true'},
              ],
            },
          } as MetaobjectUpsertMutationVariables,
        },
      );
    });

    it('throws an error if there are user errors', async () => {
      const userErrors = [
        {
          message: 'Error message 1',
          field: ['foo'],
          code: 'INVALID' as any,
        },
        {
          message: 'Error message 2',
          field: ['bar'],
          code: 'BLANK' as any,
        },
      ];
      const mockResponse: {
        data?: MetaobjectUpsertMutationType;
      } = {
        data: {
          metaobjectUpsert: {
            userErrors,
          },
        },
      };

      mockGraphQL({MetaobjectUpsert: mockResponse});

      const repository = new MetaobjectRepository(graphQL);

      await expect(
        repository.upsertMetaobjectByHandle({
          handle: {handle: metaobjectHandle, type: metaobjectType},
          fields: metaobjectFields,
        }),
      ).rejects.toThrow(
        `MetaobjectUpsert Mutation returned User Errors: ${JSON.stringify(
          userErrors,
        )}`,
      );
      expect(graphQL).toHavePerformedGraphQLOperation(
        MetaobjectUpsertMutation,
        {
          variables: {
            handle: {handle: metaobjectHandle, type: metaobjectType},
            metaobject: {
              fields: [
                {key: 'foo', value: 'Text Value'},
                {key: 'bar', value: 'true'},
              ],
            },
          } as MetaobjectUpsertMutationVariables,
        },
      );
    });
  });

  describe('createOrUpdateMetaobjectDefinition', () => {
    const metaobjectDefinition = {
      definition: {
        type: metaobjectType,
        name: 'Test Metaobject',
        fieldDefinitions: [
          {
            key: 'retryAttempts',
            type: 'number_integer',
            name: 'Retry attempts',
            description: 'Number of retry attempts',
            required: true,
            validations: [],
            adminFilterStatus: 'HIDDEN',
            visibleToStorefrontApi: false,
          },
          {
            key: 'daysBetweenRetryAttempts',
            type: 'number_integer',
            name: 'Days between',
            description: 'Days between payment retry attempts',
            required: true,
            validations: [],
            adminFilterStatus: 'HIDDEN',
            visibleToStorefrontApi: false,
          },
          {
            key: 'onFailure',
            type: 'single_line_text_field',
            name: 'On failure',
            description: 'Action when all retry attempts have failed',
            required: true,
            validations: [],
            adminFilterStatus: 'HIDDEN',
            visibleToStorefrontApi: false,
          },
        ],
      },
    };
    it('ensures that all field definitions are present in the metaobject definition', async () => {
      const mockResponse: {
        data?: MetaobjectDefinitionByTypeQueryType;
      } = {
        data: {
          metaobjectDefinitionByType: {
            id: metaobjectDefinitionId,
            type: metaobjectType,
            fieldDefinitions: metaobjectDefinition.definition.fieldDefinitions,
            name: 'Test Metaobject',
          },
        },
      };

      mockGraphQL({MetaobjectDefinitionByType: mockResponse});

      const repository = new MetaobjectRepository(graphQL);
      await repository.createOrUpdateMetaobjectDefinition({
        type: metaobjectDefinition.definition.type,
        name: metaobjectDefinition.definition.name,
        fieldDefinitions: metaobjectDefinition.definition.fieldDefinitions,
      });

      expect(graphQL).toHavePerformedGraphQLOperation(
        MetaobjectDefinitionByTypeQuery,
        {
          variables: {
            type: metaobjectType,
          } as MetaobjectDefinitionByTypeQueryVariables,
        },
      );
    });

    it('creates a metaobject definition if it is not found', async () => {
      const mockResponse: {
        data?: MetaobjectDefinitionByTypeQueryType;
      } = {
        data: {
          metaobjectDefinitionByType: null,
        },
      };

      const mockCreateResponse: {
        data?: MetaobjectDefinitionCreateMutationType;
      } = {
        data: {
          metaobjectDefinitionCreate: {
            metaobjectDefinition: {
              id: metaobjectDefinitionId,
              name: metaobjectDefinition.definition.name,
              type: metaobjectDefinition.definition.type,
              fieldDefinitions: metaobjectDefinition.definition
                .fieldDefinitions as unknown as MetaobjectFieldDefinition[],
            },
            userErrors: [],
          },
        },
      };

      mockGraphQL({
        MetaobjectDefinitionByType: mockResponse,
        MetaobjectDefinitionCreate: mockCreateResponse,
      });

      const repository = new MetaobjectRepository(graphQL);
      await repository.createOrUpdateMetaobjectDefinition({
        type: metaobjectDefinition.definition.type,
        name: metaobjectDefinition.definition.name,
        fieldDefinitions: metaobjectDefinition.definition.fieldDefinitions,
      });

      expect(graphQL).toHavePerformedGraphQLOperation(
        MetaobjectDefinitionByTypeQuery,
        {
          variables: {
            type: metaobjectType,
          } as MetaobjectDefinitionByTypeQueryVariables,
        },
      );
      expect(graphQL).toHavePerformedGraphQLOperation(
        MetaobjectDefinitionCreateMutation,
        {
          variables: {
            definition: metaobjectDefinition.definition,
          } as MetaobjectDefinitionCreateMutationVariables,
        },
      );
    });
  });

  describe('createOrUpdateMetaobjectFields', () => {
    const testMetaobjectFields: NonNullMetaobjectField[] = [
      {
        key: 'retryAttempts',
        value: 5,
        valueType: MetafieldType.NUMBER_INTEGER,
      },
      {
        key: 'daysBetweenRetryAttempts',
        value: 1,
        valueType: MetafieldType.NUMBER_INTEGER,
      },
      {
        key: 'onFailure',
        value: 'cancel',
        valueType: MetafieldType.SINGLE_LINE_TEXT_FIELD,
      },
    ];
    const testMetaobjectFieldsResponse = [
      {
        key: 'retryAttempts',
        type: 'number_integer',
        value: '5',
      },
      {
        key: 'daysBetweenRetryAttempts',
        type: 'number_integer',
        value: '1',
      },
      {
        key: 'onFailure',
        type: 'single_line_text_field',
        value: 'cancel',
      },
    ];
    it('ensures that all fields are present in the metaobject', async () => {
      const mockResponse: {
        data?: MetaobjectByHandleQueryType;
      } = {
        data: {
          metaobjectByHandle: {
            id: metaobjectId,
            fields: testMetaobjectFieldsResponse,
          },
        },
      };
      const mockUpdateResponse: {
        data?: MetaobjectUpdateMutationType;
      } = {
        data: {
          metaobjectUpdate: {
            metaobject: {
              id: metaobjectId,
              fields: testMetaobjectFieldsResponse,
            },
            userErrors: [],
          },
        },
      };

      mockGraphQL({
        MetaobjectByHandle: mockResponse,
        MetaobjectUpdate: mockUpdateResponse,
      });

      const repository = new MetaobjectRepository(graphQL);
      await repository.createOrUpdateMetaobjectFields({
        handle: {handle: metaobjectHandle, type: metaobjectType},
        fields: testMetaobjectFields,
      });

      expect(graphQL).toHavePerformedGraphQLOperation(MetaobjectByHandleQuery, {
        variables: {
          handle: {handle: metaobjectHandle, type: metaobjectType},
        } as MetaobjectByHandleQueryVariables,
      });
      expect(graphQL).toHavePerformedGraphQLOperation(
        MetaobjectUpdateMutation,
        {
          variables: {
            id: metaobjectId,
            metaobject: {
              fields: [
                {
                  key: 'retryAttempts',
                  value: '5',
                },
                {
                  key: 'daysBetweenRetryAttempts',
                  value: '1',
                },
                {
                  key: 'onFailure',
                  value: 'cancel',
                },
              ],
            },
          } as MetaobjectUpdateMutationVariables,
        },
      );
    });

    it('creates a metaobject if it is not found', async () => {
      const mockResponse: {
        data?: MetaobjectByHandleQueryType;
      } = {
        data: {
          metaobjectByHandle: null,
        },
      };

      const mockCreateResponse: {
        data?: MetaobjectCreateMutationType;
      } = {
        data: {
          metaobjectCreate: {
            metaobject: {
              id: metaobjectId,
              fields: testMetaobjectFieldsResponse,
            },
            userErrors: [],
          },
        },
      };

      mockGraphQL({
        MetaobjectByHandle: mockResponse,
        MetaobjectCreate: mockCreateResponse,
      });

      const repository = new MetaobjectRepository(graphQL);
      await repository.createOrUpdateMetaobjectFields({
        handle: {handle: metaobjectHandle, type: metaobjectType},
        fields: testMetaobjectFields,
      });

      expect(graphQL).toHavePerformedGraphQLOperation(MetaobjectByHandleQuery, {
        variables: {
          handle: {handle: metaobjectHandle, type: metaobjectType},
        } as MetaobjectByHandleQueryVariables,
      });
      expect(graphQL).toHavePerformedGraphQLOperation(
        MetaobjectCreateMutation,
        {
          variables: {
            metaobject: {
              type: metaobjectType,
              handle: metaobjectHandle,
              fields: [
                {
                  key: 'retryAttempts',
                  value: '5',
                },
                {
                  key: 'daysBetweenRetryAttempts',
                  value: '1',
                },
                {
                  key: 'onFailure',
                  value: 'cancel',
                },
              ],
            },
          } as MetaobjectCreateMutationVariables,
        },
      );
    });
  });
});
