import type {SellingPlanPricingPolicyAdjustmentType} from 'types/admin.types';
import type {
  PricingPolicy,
  PricingPolicyInput,
  SubscriptionLine,
  SubscriptionLineUpdateInput,
} from '~/routes/app.contracts.$id.edit/validator';
import type {
  SubscriptionContractEditLine,
  SubscriptionLineInput,
} from '~/types/contractEditing';

/**
 * Gets a list of lines that are in the current lines but not in initial lines
 * @param currentLines current state of all lines in the UI
 * @param initialVariantLineToIdMap map where each entry is [variantId, lineId] from the initial subscription lines
 */
export function getLinesToAdd(
  initialLines: SubscriptionContractEditLine[],
  currentLines: SubscriptionLine[],
): SubscriptionLineInput[] {
  const initialVariantLineToIdMap = new Map<string, string>(
    initialLines.flatMap(({variantId, id}) =>
      variantId ? [[variantId, id]] : [],
    ),
  );

  return currentLines
    .filter(
      (line) =>
        line.variantId && !initialVariantLineToIdMap.has(line.variantId),
    )
    .map((line) => ({
      productVariantId: line.variantId!,
      quantity: line.quantity,
      currentPrice: line.currentPrice.amount,
      ...(line.currentOneTimePurchasePrice && {
        pricingPolicy: createNewPricingPolicyInput(
          line.currentOneTimePurchasePrice,
          line.currentPrice.amount,
        ),
      }),
    }));
}

/**
 * gets line IDs that are in initial lines but not in currentLines
 * @param currentLineVariantIds set of variant IDs that are part of the current lines
 */
export function getLineIdsToRemove(
  initialLines: SubscriptionContractEditLine[],
  currentLines: SubscriptionLine[],
): string[] {
  const currentLineVariantIds = new Set<string>(
    currentLines.map((line) => line.variantId).filter(Boolean) as string[],
  );

  const linesToRemove = initialLines.filter((initialLine) => {
    // check by variant id since lines will lose their intial line IDs if they
    // are removed and added back in
    const variantIdNotInCurrentLines =
      initialLine.variantId &&
      !currentLineVariantIds.has(initialLine.variantId);

    // check if a line without a variant id is removed:
    // it's safe to check by line id since a line without an initial variant id
    // cannot be deleted and added back in
    const lineIdNotInCurrentLines =
      !initialLine.variantId &&
      !currentLines.some(
        (currentLine) => currentLine.id && currentLine.id === initialLine.id,
      );

    return variantIdNotInCurrentLines || lineIdNotInCurrentLines;
  });

  return linesToRemove.map((line) => line.id);
}

export function getLinesToUpdate(
  initialLines: SubscriptionContractEditLine[],
  currentLines: SubscriptionLine[],
): SubscriptionLineUpdateInput[] {
  const linesToUpdate: SubscriptionLineUpdateInput[] = [];
  currentLines.forEach((currentLine) => {
    const correspondingInitialLine = initialLines.find((initialLine) => {
      if (currentLine.id) {
        return currentLine.id === initialLine.id;
      }

      // handle the case where a variant is removed and then
      // added back and we lose its initial line ID
      return (
        currentLine.variantId && currentLine.variantId === initialLine.variantId
      );
    });

    if (correspondingInitialLine) {
      const initialPrice = Number(correspondingInitialLine.currentPrice.amount);
      const newPrice = Number(currentLine.currentPrice.amount);
      const {currentOneTimePurchasePrice} = currentLine;

      // currentLine.quantity is actually a string that's been coerced to a number by zod
      const quantityChanged =
        correspondingInitialLine.quantity !== Number(currentLine.quantity);

      const priceChanged = initialPrice !== newPrice;

      if (quantityChanged || priceChanged) {
        linesToUpdate.push({
          id: correspondingInitialLine.id,
          quantity: currentLine.quantity,
          price: newPrice,
          ...(priceChanged &&
            currentOneTimePurchasePrice && {
              pricingPolicy: createNewPricingPolicyInput(
                currentOneTimePurchasePrice,
                newPrice,
              ),
            }),
        });
      }
    }
  });
  return linesToUpdate;
}

export function createNewPricingPolicy(
  currencyCode: string,
  oneTimePurchasePrice: number,
  newPrice: number,
): PricingPolicy {
  return {
    basePrice: {amount: oneTimePurchasePrice, currencyCode},
    cycleDiscounts: [
      {
        afterCycle: 0,
        computedPrice: {amount: newPrice, currencyCode},
        adjustmentType: 'PRICE' as SellingPlanPricingPolicyAdjustmentType,
        adjustmentValue: {
          amount: newPrice,
          currencyCode,
        },
      },
    ],
  };
}

export function createNewPricingPolicyInput(
  oneTimePurchasePrice: number,
  newPrice: number,
): PricingPolicyInput {
  return {
    basePrice: oneTimePurchasePrice,
    cycleDiscounts: [
      {
        afterCycle: 0,
        computedPrice: newPrice,
        adjustmentType: 'PRICE' as SellingPlanPricingPolicyAdjustmentType,
        adjustmentValue: {
          fixedValue: newPrice,
        },
      },
    ],
  };
}
