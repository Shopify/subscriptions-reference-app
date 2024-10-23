import type {GraphQLClient} from '~/types';
import {logger} from '~/utils/logger.server';

import Metaobject from './Metaobject';
import {
  mapAdminResponseToMetaobjectField,
  mapMetaobjectFieldToAdminInput,
  isNullField,
  type MetaobjectField,
  type NonNullMetaobjectField,
} from './MetaobjectField';

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
  MetaobjectDefinitionUpdateMutationVariables,
  MetaobjectsQuery as MetaobjectsQueryType,
  MetaobjectsQueryVariables,
  MetaobjectUpdateMutation as MetaobjectUpdateMutationType,
  MetaobjectUpdateMutationVariables,
  MetaobjectUpsertMutation as MetaobjectUpsertMutationType,
  MetaobjectUpsertMutationVariables,
} from 'types/admin.generated';

import type {
  MetaobjectDefinitionCreateInput,
  MetaobjectFieldDefinition,
  MetaobjectFieldDefinitionCreateInput,
} from 'types/admin.types';

import MetaobjectByHandleQuery from '~/graphql/MetaobjectByHandleQuery';
import MetaobjectByIdQuery from '~/graphql/MetaobjectByIdQuery';
import MetaobjectCreateMutation from '~/graphql/MetaobjectCreateMutation';
import MetaobjectDefinitionByTypeQuery from '~/graphql/MetaobjectDefinitionByTypeQuery';
import MetaobjectDefinitionCreateMutation from '~/graphql/MetaobjectDefinitionCreateMutation';
import MetaobjectsQuery from '~/graphql/MetaobjectsQuery';
import MetaobjectUpdateMutation from '~/graphql/MetaobjectUpdateMutation';
import MetaobjectUpsertMutation from '~/graphql/MetaobjectUpsertMutation';
import MetaobjectDefinitionUpdateMutation from '~/graphql/MetaobjectDefinitionUpdateMutation';

const DEFAULT_FIRST = 10;

export type MetaobjectDefinition = {
  id: string;
  fieldDefinitions: MetaobjectFieldDefinition[];
};

export type MetaobjectHandleInput = {
  handle: string;
  type: string;
};

export type MetaobjectDefinitionTypeInput = {
  type: string;
};

export default class MetaobjectRepository {
  // eslint-disable-next-line no-useless-constructor
  constructor(private graphqlClient: GraphQLClient) {}

  public async fetchMetaobjectByHandle({
    type,
    handle,
  }: MetaobjectHandleInput): Promise<Metaobject | undefined> {
    const variables: MetaobjectByHandleQueryVariables = {
      handle: {
        type,
        handle,
      },
    };

    const response = await this.graphqlClient(MetaobjectByHandleQuery, {
      variables,
    });

    const {data} = (await response.json()) as {
      data?: MetaobjectByHandleQueryType;
    };

    if (!data?.metaobjectByHandle) {
      logger.error(
        {data},
        `Metaobject not found for type '${type}' and handle '${handle}'`,
      );
      return;
    }

    const metaobject = new Metaobject({
      id: data.metaobjectByHandle.id,
      fields: data.metaobjectByHandle.fields.map(
        mapAdminResponseToMetaobjectField,
      ),
    });

    return metaobject;
  }

  public async fetchMetaobjectById({
    id,
  }: {
    id: string;
  }): Promise<Metaobject | undefined> {
    const variables: MetaobjectByIdQueryVariables = {id};

    const response = await this.graphqlClient(MetaobjectByIdQuery, {
      variables,
    });

    const {data} = (await response.json()) as {
      data?: MetaobjectByIdQueryType;
    };

    if (!data?.metaobject) {
      logger.error({data}, `Metaobject not found for id '${id}'`);
      return;
    }

    const metaobject = new Metaobject({
      id: data.metaobject.id,
      fields: data.metaobject.fields.map(mapAdminResponseToMetaobjectField),
    });

    return metaobject;
  }

  public async fetchMetaobjectDefinitionByType({
    type,
  }: MetaobjectDefinitionTypeInput): Promise<MetaobjectDefinition | undefined> {
    const variables: MetaobjectDefinitionByTypeQueryVariables = {type};

    const response = await this.graphqlClient(MetaobjectDefinitionByTypeQuery, {
      variables,
    });

    const {data} = (await response.json()) as {
      data?: MetaobjectDefinitionByTypeQueryType;
    };

    if (!data?.metaobjectDefinitionByType) {
      logger.error(
        {data},
        `Metaobject definition not found for type '${type}'`,
      );
      return;
    }

    const metaobjectDefinition: MetaobjectDefinition = {
      id: data.metaobjectDefinitionByType.id,
      fieldDefinitions: data.metaobjectDefinitionByType
        .fieldDefinitions as MetaobjectFieldDefinition[],
    };

    return metaobjectDefinition;
  }

  public async fetchMetaobjects({
    type,
    sortKey,
    first = DEFAULT_FIRST,
  }: {
    type: string;
    sortKey?: 'id' | 'type' | 'updated_at' | 'display_name' | undefined;
    first?: number;
  }): Promise<Metaobject[] | undefined> {
    const variables: MetaobjectsQueryVariables = {
      type,
      first,
      sortKey,
    };

    const response = await this.graphqlClient(MetaobjectsQuery, {
      variables,
    });

    const {data} = (await response.json()) as {
      data?: MetaobjectsQueryType;
    };

    if (!data?.metaobjects?.edges) {
      logger.error({data}, `Metaobjects not found for type '${type}'`);
      return;
    }

    const metaobjects: Metaobject[] = data?.metaobjects.edges.map(({node}) => {
      return new Metaobject({
        id: node.id,
        fields: node.fields.map(mapAdminResponseToMetaobjectField),
      });
    });

    return metaobjects;
  }

  public async createMetaobjectDefinition(
    definition: MetaobjectDefinitionCreateInput,
  ): Promise<MetaobjectDefinition> {
    const variables: MetaobjectDefinitionCreateMutationVariables = {
      definition,
    };

    const response = await this.graphqlClient(
      MetaobjectDefinitionCreateMutation,
      {
        variables,
      },
    );

    const {data} = (await response.json()) as {
      data?: MetaobjectDefinitionCreateMutationType;
    };

    const metaobjectDefinitionCreateUserErrors =
      data?.metaobjectDefinitionCreate?.userErrors;

    if (
      metaobjectDefinitionCreateUserErrors &&
      metaobjectDefinitionCreateUserErrors.length > 0
    ) {
      throw new Error(
        'MetaobjectDefinitionCreate Mutation returned User Errors: ' +
          JSON.stringify(metaobjectDefinitionCreateUserErrors),
      );
    }

    if (!data?.metaobjectDefinitionCreate?.metaobjectDefinition) {
      throw new Error('MetaobjectDefinitionCreate Mutation failed.');
    }

    const metaobjectDefinition = {
      id: data.metaobjectDefinitionCreate.metaobjectDefinition.id,
      fieldDefinitions: data.metaobjectDefinitionCreate.metaobjectDefinition
        .fieldDefinitions as MetaobjectFieldDefinition[],
    };

    return metaobjectDefinition;
  }

  public async createMetaobject({
    handle,
    fields,
  }: {
    handle: MetaobjectHandleInput;
    fields: NonNullMetaobjectField[];
  }): Promise<Metaobject> {
    const variables: MetaobjectCreateMutationVariables = {
      metaobject: {
        type: handle.type,
        handle: handle.handle,
        fields: fields.map(mapMetaobjectFieldToAdminInput),
      },
    };

    const response = await this.graphqlClient(MetaobjectCreateMutation, {
      variables,
    });

    const {data} = (await response.json()) as {
      data?: MetaobjectCreateMutationType;
    };

    const metaobjectCreateUserErrors = data?.metaobjectCreate?.userErrors;

    if (metaobjectCreateUserErrors && metaobjectCreateUserErrors.length > 0) {
      throw new Error(
        'MetaobjectCreate Mutation returned User Errors: ' +
          JSON.stringify(metaobjectCreateUserErrors),
      );
    }

    if (!data?.metaobjectCreate?.metaobject) {
      throw new Error('MetaobjectCreate Mutation failed.');
    }
    const metaobject = new Metaobject({
      id: data.metaobjectCreate.metaobject.id,
      fields: data.metaobjectCreate.metaobject.fields.map(
        mapAdminResponseToMetaobjectField,
      ),
    });

    return metaobject;
  }

  public async updateMetaobject({
    id,
    fields,
  }: {
    id: string;
    fields: MetaobjectField[];
  }): Promise<Metaobject> {
    const variables: MetaobjectUpdateMutationVariables = {
      id,
      metaobject: {
        fields: fields.map(mapMetaobjectFieldToAdminInput),
      },
    };

    const response = await this.graphqlClient(MetaobjectUpdateMutation, {
      variables,
    });

    const {data} = (await response.json()) as {
      data?: MetaobjectUpdateMutationType;
    };

    const metaobjectUpdateUserErrors = data?.metaobjectUpdate?.userErrors;

    if (metaobjectUpdateUserErrors && metaobjectUpdateUserErrors.length > 0) {
      throw new Error(
        'MetaobjectUpdate Mutation returned User Errors: ' +
          JSON.stringify(metaobjectUpdateUserErrors),
      );
    }

    if (!data?.metaobjectUpdate?.metaobject) {
      throw new Error('MetaobjectUpsert Mutation failed.');
    }

    const metaobject = new Metaobject({
      id: data.metaobjectUpdate.metaobject.id,
      fields: data.metaobjectUpdate.metaobject.fields.map(
        mapAdminResponseToMetaobjectField,
      ),
    });

    return metaobject;
  }

  public async upsertMetaobjectByHandle({
    handle,
    fields,
  }: {
    handle: MetaobjectHandleInput;
    fields: MetaobjectField[];
  }): Promise<Metaobject> {
    const variables: MetaobjectUpsertMutationVariables = {
      handle,
      metaobject: {
        fields: fields.map(mapMetaobjectFieldToAdminInput),
      },
    };

    const response = await this.graphqlClient(MetaobjectUpsertMutation, {
      variables,
    });

    const {data} = (await response.json()) as {
      data?: MetaobjectUpsertMutationType;
    };

    const metaobjectUpsertUserErrors = data?.metaobjectUpsert?.userErrors;

    if (metaobjectUpsertUserErrors && metaobjectUpsertUserErrors.length > 0) {
      throw new Error(
        'MetaobjectUpsert Mutation returned User Errors: ' +
          JSON.stringify(metaobjectUpsertUserErrors),
      );
    }

    if (!data?.metaobjectUpsert?.metaobject) {
      throw new Error('MetaobjectUpsert Mutation failed.');
    }

    const metaobject = new Metaobject({
      id: data.metaobjectUpsert.metaobject.id,
      fields: data.metaobjectUpsert.metaobject.fields.map(
        mapAdminResponseToMetaobjectField,
      ),
    });

    return metaobject;
  }

  public async updateMetaobjectDefinition({
    id,
    fieldDefinitionsToCreate,
  }: {
    id: string;
    fieldDefinitionsToCreate: MetaobjectFieldDefinitionCreateInput[];
  }): Promise<MetaobjectDefinition> {
    const variables: MetaobjectDefinitionUpdateMutationVariables = {
      id,
      definition: {
        fieldDefinitions: fieldDefinitionsToCreate.map((fieldDefinition) => ({
          create: fieldDefinition,
        })),
      },
    };

    const response = await this.graphqlClient(
      MetaobjectDefinitionUpdateMutation,
      {
        variables,
      },
    );
    const {data} = await response.json();

    const userErrors = data?.metaobjectDefinitionUpdate?.userErrors;

    if (!data?.metaobjectDefinitionUpdate?.metaobjectDefinition) {
      throw new Error('MetaobjectDefinitionUpdate Mutation failed.');
    }

    if (userErrors && userErrors.length > 0) {
      throw new Error(
        'MetaobjectDefinitionUpdate Mutation returned User Errors: ' +
          JSON.stringify(userErrors),
      );
    }
    const metaobjectDefinition = {
      id: data.metaobjectDefinitionUpdate.metaobjectDefinition.id,
      fieldDefinitions: data.metaobjectDefinitionUpdate.metaobjectDefinition
        .fieldDefinitions as MetaobjectFieldDefinition[],
    };

    return metaobjectDefinition;
  }

  public async createOrUpdateMetaobjectDefinition(
    definition: MetaobjectDefinitionCreateInput,
  ): Promise<MetaobjectDefinition> {
    const metaobjectDefinition = await this.fetchMetaobjectDefinitionByType({
      type: definition.type,
    });
    if (!metaobjectDefinition) {
      return this.createMetaobjectDefinition(definition);
    }

    const missingFieldDefinitions = this.getMissingFieldDefinitions(
      metaobjectDefinition.fieldDefinitions || [],
      definition.fieldDefinitions || [],
    );

    if (missingFieldDefinitions.length > 0) {
      return this.updateMetaobjectDefinition({
        id: metaobjectDefinition.id,
        fieldDefinitionsToCreate: missingFieldDefinitions,
      });
    }

    return metaobjectDefinition;
  }

  public async createOrUpdateMetaobjectFields({
    handle,
    fields,
  }: {
    handle: MetaobjectHandleInput;
    fields: NonNullMetaobjectField[];
  }): Promise<Metaobject> {
    const metaobject = await this.fetchMetaobjectByHandle(handle);
    if (!metaobject) {
      return this.createMetaobject({
        handle,
        fields,
      });
    }

    const fieldsToUpdate = fields.map((field) => {
      const existingField = metaobject.fields?.find(
        (existingField) => existingField.key === field.key,
      );
      // if the existing field is null, return the new field
      // otherwise, return the existing field
      return existingField
        ? isNullField(existingField)
          ? field
          : existingField
        : field;
    });

    return this.updateMetaobject({
      id: metaobject.id,
      fields: fieldsToUpdate,
    });
  }

  private getMissingFieldDefinitions(
    existingFieldDefinitions: MetaobjectFieldDefinition[],
    requiredFieldDefinitions: MetaobjectFieldDefinitionCreateInput[],
  ): MetaobjectFieldDefinitionCreateInput[] {
    return requiredFieldDefinitions.filter(
      (fieldDefinition) =>
        !existingFieldDefinitions.some(
          (existingFieldDefinition) =>
            existingFieldDefinition.key === fieldDefinition.key,
        ),
    );
  }
}
