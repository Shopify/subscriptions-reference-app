import {describe, expect, it} from 'vitest';
import {formatPaymentBrandName} from '../paymentMethods';

describe('payment method helpers', () => {
  describe('formatPaymentBrandName', () => {
    it('removes non alphanumeric characters and converts to lowercase', () => {
      expect(formatPaymentBrandName('American_Express-&*!')).toBe(
        'americanexpress',
      );
    });
  });
});
