import {faker} from '@faker-js/faker';
import {composeGid} from '@shopify/admin-graphql-api-utilities';
import {describe, expect, it} from 'vitest';
import {createMockSubscriptionLine} from '~/routes/app.contracts.$id.edit/components/EditSubscriptionDetailsCard/tests/Fixtures';
import type {SubscriptionLine} from '~/routes/app.contracts.$id.edit/validator';
import {
  getLineIdsToRemove,
  getLinesToAdd,
  getLinesToUpdate,
} from '../subscriptionLines';

function createMockZodSubscriptionLine(
  line?: Partial<SubscriptionLine>,
): SubscriptionLine {
  return {
    quantity: faker.number.int({min: 1, max: 20}),
    currentPrice: {
      amount: Number(faker.finance.amount({min: 1, max: 100})),
      currencyCode: 'CAD',
    },
    variantId: composeGid('ProductVariant', 1),
    productId: composeGid('productId', 1),
    title: faker.commerce.productName(),
    variantTitle: faker.commerce.productName(),
    variantImage: null,
    ...line,
  };
}

const mockInitialLines = [
  createMockSubscriptionLine(),
  createMockSubscriptionLine(),
];

const mockCurrentLines = [
  createMockZodSubscriptionLine(),
  createMockZodSubscriptionLine(),
  createMockZodSubscriptionLine(),
];

describe('subscriptionLines', () => {
  describe('add', () => {
    it('adds lines that are in current lines but not in initial lines', async () => {
      const linesToAdd = getLinesToAdd(mockInitialLines, mockCurrentLines);

      expect(linesToAdd).toEqual(
        mockCurrentLines.map(({variantId, quantity, currentPrice}) => ({
          productVariantId: variantId!,
          quantity,
          currentPrice: currentPrice.amount,
        })),
      );
    });

    it('adds no lines if there are no additional lines', async () => {
      const linesToAdd = getLinesToAdd(mockInitialLines, mockInitialLines);

      expect(linesToAdd).toEqual([]);
    });

    it('does not add a line if it contains the same variant id as an existing line', async () => {
      const newLines = [
        createMockZodSubscriptionLine({
          variantId: mockInitialLines[0].variantId!,
        }),
      ];

      const linesToAdd = getLinesToAdd(mockInitialLines, newLines);

      expect(linesToAdd).toEqual([]);
    });
  });

  describe('remove', () => {
    it('removes lines that are in initial lines but not in current lines', async () => {
      // remove mockInitialLines[1]
      const currentLines = [
        createMockZodSubscriptionLine({
          id: mockInitialLines[0].id,
          variantId: mockInitialLines[0].variantId!,
        }),
      ];

      const lineIdsToRemove = getLineIdsToRemove(
        mockInitialLines,
        currentLines,
      );

      expect(lineIdsToRemove).toEqual([mockInitialLines[1].id!]);
    });

    it('is able to remove lines that contain deleted variants', async () => {
      const initialLines = [
        createMockSubscriptionLine({
          variantId: null,
        }),
      ];

      const currentLines = [];

      const lineIdsToRemove = getLineIdsToRemove(initialLines, currentLines);

      expect(lineIdsToRemove).toEqual([initialLines[0].id]);
    });

    // handles the case where a line is removed and a new line
    // with the same variant is added back in
    it('does not remove lines that have no line id but have the same variant id as an existing line', async () => {
      const initialLines = [createMockSubscriptionLine()];

      const currentLines = [
        createMockZodSubscriptionLine({
          id: undefined,
          variantId: initialLines[0].variantId!,
        }),
      ];

      const lineIdsToRemove = getLineIdsToRemove(initialLines, currentLines);

      expect(lineIdsToRemove).toEqual([]);
    });
  });

  describe('update', () => {
    it('updates lines whose quantities have changed', async () => {
      const currentLines = [
        createMockZodSubscriptionLine({
          id: mockInitialLines[0].id,
          variantId: mockInitialLines[0].variantId,
          quantity: mockInitialLines[0].quantity + 1,
          currentPrice: mockInitialLines[0].currentPrice,
        }),
        createMockZodSubscriptionLine({
          id: mockInitialLines[1].id,
          variantId: mockInitialLines[1].variantId,
          quantity: mockInitialLines[1].quantity,
          currentPrice: mockInitialLines[1].currentPrice,
        }),
      ];

      const linesToUpdate = getLinesToUpdate(mockInitialLines, currentLines);

      expect(linesToUpdate).toEqual([
        {
          id: mockInitialLines[0].id,
          quantity: currentLines[0].quantity,
          price: Number(mockInitialLines[0].currentPrice.amount),
        },
      ]);
    });

    it('updates lines whose prices have changed', async () => {
      const currentLines = [
        createMockZodSubscriptionLine({
          id: mockInitialLines[0].id,
          variantId: mockInitialLines[0].variantId,
          quantity: mockInitialLines[0].quantity,
          currentPrice: {
            ...mockInitialLines[0].currentPrice,
            amount: mockInitialLines[0].currentPrice.amount + 1,
          },
        }),
        createMockZodSubscriptionLine({
          id: mockInitialLines[1].id,
          variantId: mockInitialLines[1].variantId,
          quantity: mockInitialLines[1].quantity,
          currentPrice: mockInitialLines[1].currentPrice,
        }),
      ];

      const linesToUpdate = getLinesToUpdate(mockInitialLines, currentLines);

      expect(linesToUpdate).toEqual([
        {
          id: mockInitialLines[0].id,
          quantity: mockInitialLines[0].quantity,
          price: Number(currentLines[0].currentPrice.amount),
        },
      ]);
    });

    it('updates lines whose prices and quantities have changed', async () => {
      const currentLines = [
        createMockZodSubscriptionLine({
          id: mockInitialLines[0].id,
          variantId: mockInitialLines[0].variantId,
          quantity: mockInitialLines[0].quantity + 2,
          currentPrice: {
            ...mockInitialLines[0].currentPrice,
            amount: mockInitialLines[0].currentPrice.amount + 2,
          },
        }),
        createMockZodSubscriptionLine({
          id: mockInitialLines[1].id,
          variantId: mockInitialLines[1].variantId,
          quantity: mockInitialLines[1].quantity,
          currentPrice: mockInitialLines[1].currentPrice,
        }),
      ];

      const linesToUpdate = getLinesToUpdate(mockInitialLines, currentLines);

      expect(linesToUpdate).toEqual([
        {
          id: mockInitialLines[0].id,
          quantity: currentLines[0].quantity,
          price: Number(currentLines[0].currentPrice.amount),
        },
      ]);
    });

    it('exclues lines whose quantities or prices have not changed', async () => {
      const currentLines = [
        createMockZodSubscriptionLine({
          id: mockInitialLines[0].id,
          variantId: mockInitialLines[0].variantId,
          quantity: mockInitialLines[0].quantity,
          currentPrice: mockInitialLines[0].currentPrice,
        }),
        createMockZodSubscriptionLine({
          id: mockInitialLines[1].id,
          variantId: mockInitialLines[1].variantId,
          quantity: mockInitialLines[1].quantity,
          currentPrice: mockInitialLines[1].currentPrice,
        }),
      ];

      const linesToUpdate = getLinesToUpdate(mockInitialLines, currentLines);

      expect(linesToUpdate).toEqual([]);
    });

    // line is removed and (same variant) added back in
    it('updates lines without initial IDs', async () => {
      const currentLines = [
        createMockZodSubscriptionLine({
          id: undefined,
          variantId: mockInitialLines[0].variantId,
          quantity: mockInitialLines[0].quantity + 1,
          currentPrice: mockInitialLines[0].currentPrice,
        }),
        createMockZodSubscriptionLine({
          id: mockInitialLines[1].id,
          variantId: mockInitialLines[1].variantId,
          quantity: mockInitialLines[1].quantity,
          currentPrice: mockInitialLines[1].currentPrice,
        }),
      ];

      const linesToUpdate = getLinesToUpdate(mockInitialLines, currentLines);

      expect(linesToUpdate).toEqual([
        {
          id: mockInitialLines[0].id,
          quantity: currentLines[0].quantity,
          price: Number(mockInitialLines[0].currentPrice.amount),
        },
      ]);
    });
  });
});
