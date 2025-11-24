import {describe, it, expect} from 'vitest';
import {isLoading, isError, isSuccess} from '../useSellingPlans';
import type {UseSellingPlansState} from '../useSellingPlans';

describe('Type Guards', () => {
  describe('isLoading', () => {
    it('returns true for loading state', () => {
      const state: UseSellingPlansState = {status: 'loading'};
      expect(isLoading(state)).toBe(true);
    });

    it('returns false for idle state', () => {
      const state: UseSellingPlansState = {status: 'idle'};
      expect(isLoading(state)).toBe(false);
    });

    it('returns false for error state', () => {
      const state: UseSellingPlansState = {status: 'error', error: 'Error'};
      expect(isLoading(state)).toBe(false);
    });

    it('returns false for success state', () => {
      const state: UseSellingPlansState = {status: 'success', data: []};
      expect(isLoading(state)).toBe(false);
    });
  });

  describe('isError', () => {
    it('returns true for error state', () => {
      const state: UseSellingPlansState = {
        status: 'error',
        error: 'Something went wrong',
      };
      expect(isError(state)).toBe(true);
    });

    it('returns false for idle state', () => {
      const state: UseSellingPlansState = {status: 'idle'};
      expect(isError(state)).toBe(false);
    });

    it('returns false for loading state', () => {
      const state: UseSellingPlansState = {status: 'loading'};
      expect(isError(state)).toBe(false);
    });

    it('returns false for success state', () => {
      const state: UseSellingPlansState = {status: 'success', data: []};
      expect(isError(state)).toBe(false);
    });

    it('provides access to error property when true', () => {
      const state: UseSellingPlansState = {
        status: 'error',
        error: 'Test error',
      };

      if (isError(state)) {
        expect(state.error).toBe('Test error');
      }
    });
  });

  describe('isSuccess', () => {
    it('returns true for success state', () => {
      const state: UseSellingPlansState = {status: 'success', data: []};
      expect(isSuccess(state)).toBe(true);
    });

    it('returns false for idle state', () => {
      const state: UseSellingPlansState = {status: 'idle'};
      expect(isSuccess(state)).toBe(false);
    });

    it('returns false for loading state', () => {
      const state: UseSellingPlansState = {status: 'loading'};
      expect(isSuccess(state)).toBe(false);
    });

    it('returns false for error state', () => {
      const state: UseSellingPlansState = {status: 'error', error: 'Error'};
      expect(isSuccess(state)).toBe(false);
    });

    it('provides access to data property when true', () => {
      const mockData = [
        {
          name: 'Test Group',
          plans: [{id: 1, name: 'Test Plan'}],
        },
      ];
      const state: UseSellingPlansState = {status: 'success', data: mockData};

      if (isSuccess(state)) {
        expect(state.data).toEqual(mockData);
        expect(state.data.length).toBe(1);
        expect(state.data[0].name).toBe('Test Group');
      }
    });
  });

  describe('Type narrowing', () => {
    it('works correctly with switch statements', () => {
      const testState = (state: UseSellingPlansState): string => {
        switch (state.status) {
          case 'idle':
            return 'idle';
          case 'loading':
            return 'loading';
          case 'error':
            return `error: ${state.error}`;
          case 'success':
            return `success: ${state.data.length} groups`;
          default:
            const _exhaustive: never = state;
            return _exhaustive;
        }
      };

      expect(testState({status: 'idle'})).toBe('idle');
      expect(testState({status: 'loading'})).toBe('loading');
      expect(testState({status: 'error', error: 'Test'})).toBe('error: Test');
      expect(
        testState({status: 'success', data: [{name: 'Group', plans: []}]}),
      ).toBe('success: 1 groups');
    });
  });
});
