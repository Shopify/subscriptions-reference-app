import {describe, expect, it} from 'vitest';
import {hasInventoryError} from '../contracts';
import {SubscriptionContractListItem} from '~/types/contracts';
import {SellingPlanInterval} from '~/types';

const baseMockContract: SubscriptionContractListItem = {
  id: '45345361',
  customer: {
    displayName: 'John Doe',
  },
  billingAttempts: [],
  lines: [],
  lineCount: 0,
  totalPrice: {
    amount: 25,
    currencyCode: 'USD',
  },
  deliveryPolicy: {
    interval: SellingPlanInterval.Day,
    intervalCount: 1,
  },
  status: 'ACTIVE',
};

const mockContractInsufficientInventory: SubscriptionContractListItem = {
  ...baseMockContract,
  billingAttempts: [
    {
      id: '578839',
      errorCode: 'INSUFFICIENT_INVENTORY',
    },
  ],
};

const mockContractInventoryAllocationsNotFound: SubscriptionContractListItem = {
  ...baseMockContract,
  billingAttempts: [
    {
      id: '578839',
      errorCode: 'INVENTORY_ALLOCATIONS_NOT_FOUND',
    },
  ],
};

const mockContractNoBillingAttemptError: SubscriptionContractListItem = {
  ...baseMockContract,
  billingAttempts: [
    {
      id: '578839',
      errorCode: null,
    },
    {
      id: '578859',
    },
  ],
};

const mockContractNoBillingAttempt: SubscriptionContractListItem = {
  ...baseMockContract,
  billingAttempts: [],
};

const mockContractWithOldBillingAttemptError: SubscriptionContractListItem = {
  ...baseMockContract,
  billingAttempts: [
    {
      id: '578839',
      errorCode: null,
    },
    {
      id: '578859',
      errorCode: 'INVENTORY_ALLOCATIONS_NOT_FOUND',
    },
  ],
};

describe('contract method helpers', () => {
  describe('HasInventoryError', () => {
    it('returns true if the contract has an inventory error', () => {
      expect(hasInventoryError(mockContractInsufficientInventory)).toBe(true);
    });

    it('returns true if the contract has an inventory error', () => {
      expect(hasInventoryError(mockContractInventoryAllocationsNotFound)).toBe(
        true,
      );
    });

    it('returns false if the contract has no billing attempts', () => {
      expect(hasInventoryError(mockContractNoBillingAttempt)).toBe(false);
    });

    it('returns false if the contract has no billing attempt error', () => {
      expect(hasInventoryError(mockContractNoBillingAttemptError)).toBe(false);
    });

    it('returns false if the contract has an old billing attempt error', () => {
      expect(hasInventoryError(mockContractWithOldBillingAttemptError)).toBe(
        false,
      );
    });
  });
});
