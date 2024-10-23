import type {Address as AddressType} from '@shopify/address';
import type {
  SubscriptionContractDraftAddLineMutation as SubscriptionContractDraftAddLineMutationData,
  SubscriptionDraftCommitMutation as SubscriptionDraftCommitMutationData,
  SubscriptionDraftLineRemoveMutation as SubscriptionDraftLineRemoveMutationData,
  SubscriptionDraftLineUpdateMutation as SubscriptionDraftLineUpdateMutationData,
  SubscriptionDraftUpdateMutation as SubscriptionDraftUpdateMutationData,
} from 'types/admin.generated';
import type {CountryCode} from 'types/admin.types';
import SubscriptionContractDraftAddLineMutation from '~/graphql/SubscriptionContractDraftAddLineMutation';
import SubscriptionContractDraftCommitMutation from '~/graphql/SubscriptionContractDraftCommitMutation';
import SubscriptionContractDraftRemoveLineMutation from '~/graphql/SubscriptionContractDraftRemoveLineMutation';
import SubscriptionContractDraftUpdateMutation from '~/graphql/SubscriptionContractDraftUpdateMutation';
import SubscriptionContractDraftUpdateLineMutation from '~/graphql/SubscriptionDraftUpdateLineMutation';
import SubscriptionContractDraftRemoveDiscountMutation from '~/graphql/SubscriptionContractDraftRemoveDiscountMutation';
import SubscriptionContractDraftDiscountsQuery from '~/graphql/SubscriptionContractDraftDiscountsQuery';
import type {GraphQLClient} from '~/types';
import type {
  SubscriptionContractDraftDiscount,
  SubscriptionDraftUpdateInput,
  SubscriptionLineInput,
  UpdateLineInput,
} from '~/types/contractEditing';
import {logger} from '~/utils/logger.server';
import {nodesFromEdges} from '@shopify/admin-graphql-api-utilities';
import {discountIsManualDiscount} from '~/utils/helpers/discounts';

function getDraftAddressUpdateInput(
  addressObject: AddressType,
  deliveryMethodName?: string,
): SubscriptionDraftUpdateInput | null {
  const {country, province, ...address} = addressObject;

  const addressInput = {
    ...address,
    countryCode: country as CountryCode,
    provinceCode: province,
  };

  if (deliveryMethodName == 'SubscriptionDeliveryMethodShipping') {
    return {
      deliveryMethod: {
        shipping: {
          address: addressInput,
        },
      },
    };
  } else if (deliveryMethodName == 'SubscriptionDeliveryMethodLocalDelivery') {
    return {
      deliveryMethod: {
        localDelivery: {
          address: addressInput,
        },
      },
    };
  }

  return null;
}

export class SubscriptionContractDraft {
  public get id() {
    return this.draftId;
  }

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private shopDomain: string,
    private contractId: string,
    private draftId: string,
    private graphql: GraphQLClient,
  ) {}

  public async addLine(lineToAdd: SubscriptionLineInput): Promise<boolean> {
    const response = await this.graphql(
      SubscriptionContractDraftAddLineMutation,
      {
        variables: {
          draftId: this.draftId,
          input: lineToAdd,
        },
      },
    );

    const {
      data: {subscriptionDraftLineAdd},
    } = (await response.json()) as {
      data: SubscriptionContractDraftAddLineMutationData;
    };

    if (
      !subscriptionDraftLineAdd ||
      subscriptionDraftLineAdd.userErrors.length > 0
    ) {
      logger.error(
        {
          shop: this.shopDomain,
          subscriptionContractId: this.contractId,
          draftId: this.draftId,
          userErrors: subscriptionDraftLineAdd?.userErrors || [],
          lineToAdd,
        },
        'Failed to add line to draft',
      );

      return false;
    }

    return Boolean(subscriptionDraftLineAdd.lineAdded);
  }

  public async updateAddress(address: AddressType, deliveryMethodName: string) {
    const draftUpdateInput = getDraftAddressUpdateInput(
      address,
      deliveryMethodName,
    );

    if (!draftUpdateInput) {
      return false;
    }

    const isDraftContractUpdated = await this.update(draftUpdateInput);

    return isDraftContractUpdated;
  }

  public async removeLine(lineId: string): Promise<boolean> {
    const response = await this.graphql(
      SubscriptionContractDraftRemoveLineMutation,
      {
        variables: {
          draftId: this.draftId,
          lineId,
        },
      },
    );

    const {
      data: {subscriptionDraftLineRemove},
    } = (await response.json()) as {
      data: SubscriptionDraftLineRemoveMutationData;
    };

    if (
      !subscriptionDraftLineRemove ||
      subscriptionDraftLineRemove.userErrors.length > 0
    ) {
      logger.error(
        {
          shop: this.shopDomain,
          subscriptionContractId: this.contractId,
          draftId: this.draftId,
          lineId,
          userErrors: subscriptionDraftLineRemove?.userErrors || [],
        },
        'Failed to remove line with id from draft',
      );

      return false;
    }

    return Boolean(subscriptionDraftLineRemove.lineRemoved);
  }

  public async updateLine(
    lineId: string,
    {quantity, currentPrice, pricingPolicy}: UpdateLineInput,
  ) {
    if (!quantity && !currentPrice) {
      throw new Error('one of quantity or price are required');
    }

    const input = {
      quantity,
      currentPrice,
      ...(pricingPolicy && {pricingPolicy}),
    };

    const response = await this.graphql(
      SubscriptionContractDraftUpdateLineMutation,
      {
        variables: {
          draftId: this.draftId,
          lineId,
          input,
        },
      },
    );

    const {
      data: {subscriptionDraftLineUpdate},
    } = (await response.json()) as {
      data: SubscriptionDraftLineUpdateMutationData;
    };

    if (
      !subscriptionDraftLineUpdate ||
      subscriptionDraftLineUpdate.userErrors.length > 0
    ) {
      logger.error(
        {
          shop: this.shopDomain,
          subscriptionContractId: this.contractId,
          draftId: this.draftId,
          input,
          userErrors: subscriptionDraftLineUpdate?.userErrors || [],
        },
        'Failed to update line in draft',
      );

      return false;
    }

    return Boolean(subscriptionDraftLineUpdate.lineUpdated);
  }

  public async update(input: SubscriptionDraftUpdateInput) {
    const response = await this.graphql(
      SubscriptionContractDraftUpdateMutation,
      {
        variables: {
          draftId: this.draftId,
          input,
        },
      },
    );

    const {
      data: {subscriptionDraftUpdate},
    } = (await response.json()) as {
      data: SubscriptionDraftUpdateMutationData;
    };

    if (
      !subscriptionDraftUpdate?.draft?.id ||
      subscriptionDraftUpdate.userErrors.length > 0
    ) {
      logger.error(
        {
          shop: this.shopDomain,
          subscriptionContractId: this.contractId,
          draftId: this.draftId,
          input,
          userErrors: subscriptionDraftUpdate?.userErrors || [],
        },
        'Failed to update draft',
      );

      return false;
    }

    return true;
  }

  public async getDiscounts(): Promise<SubscriptionContractDraftDiscount[]> {
    const response = await this.graphql(
      SubscriptionContractDraftDiscountsQuery,
      {
        variables: {id: this.draftId},
      },
    );

    const {data} = await response.json();

    if (!data || !data.subscriptionDraft) {
      logger.warn(
        {
          shop: this.shopDomain,
          draftId: this.draftId,
        },
        'Unable to query subscription draft discounts',
      );

      return [];
    }

    const {subscriptionDraft} = data;

    const discounts = nodesFromEdges(subscriptionDraft.discounts.edges);

    return discounts.reduce<SubscriptionContractDraftDiscount[]>(
      (acc, discount) => {
        if (discountIsManualDiscount(discount)) {
          const entitledLines = nodesFromEdges(
            discount.entitledLines.lines.edges,
          );

          return [
            ...acc,
            {
              id: discount.id,
              // if discount.entitledLines.all is true then entitledLines.lines is empty
              validForAllLines: discount.entitledLines.all,
              entitledLines,
            },
          ];
        }

        return acc;
      },
      [],
    );
  }

  public async commit(): Promise<boolean> {
    await this.removeInvalidDiscounts();

    const response = await this.graphql(
      SubscriptionContractDraftCommitMutation,
      {
        variables: {
          draftId: this.draftId,
        },
      },
    );

    const {
      data: {subscriptionDraftCommit},
    } = (await response.json()) as {
      data: SubscriptionDraftCommitMutationData;
    };

    if (
      !subscriptionDraftCommit ||
      subscriptionDraftCommit.userErrors.length > 0
    ) {
      logger.error(
        {
          shop: this.shopDomain,
          subscriptionContractId: this.contractId,
          draftId: this.draftId,
          userErrors: subscriptionDraftCommit?.userErrors || [],
        },
        'Failed to commit draft',
      );

      return false;
    }

    return Boolean(
      subscriptionDraftCommit &&
        subscriptionDraftCommit.userErrors.length === 0,
    );
  }

  private async removeDiscount(discountId: string): Promise<boolean> {
    const response = await this.graphql(
      SubscriptionContractDraftRemoveDiscountMutation,
      {
        variables: {
          draftId: this.draftId,
          discountId,
        },
      },
    );

    const {data} = await response.json();

    if (
      !data ||
      !data.subscriptionDraftDiscountRemove ||
      data.subscriptionDraftDiscountRemove.userErrors.length > 0
    ) {
      logger.error(
        {
          shop: this.shopDomain,
          subscriptionContractId: this.contractId,
          draftId: this.draftId,
          discountId,
          userErrors: data?.subscriptionDraftDiscountRemove?.userErrors || [],
        },
        'Failed to remove discount from draft',
      );

      return false;
    }

    return true;
  }

  private async removeInvalidDiscounts(): Promise<void> {
    const discounts = await this.getDiscounts();

    await Promise.all(
      discounts.map(async (discount) => {
        const isDiscountApplicable =
          discount.validForAllLines || discount.entitledLines.length > 0;

        if (!isDiscountApplicable) {
          const discountRemoved = await this.removeDiscount(discount.id);

          const logDetails = {
            shop: this.shopDomain,
            draftId: this.draftId,
            discountId: discount.id,
          };

          if (discountRemoved) {
            logger.debug(logDetails, 'Removed discount from draft');
          } else {
            logger.error(logDetails, 'Failed to remove discount from draft');
          }
        }
      }),
    );
  }
}
