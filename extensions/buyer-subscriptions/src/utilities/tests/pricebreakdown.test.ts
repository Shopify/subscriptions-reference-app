import {getContractPriceBreakdown} from 'utilities/pricebreakdown';

describe('getContractPriceBreakdown', () => {
  it('calculates the price breakdown for a contract from line prices', () => {
    const breakdown = getContractPriceBreakdown({
      currencyCode: 'CAD',
      lines: [
        {
          lineDiscountedPrice: {
            amount: 25,
          },
        },
        {
          lineDiscountedPrice: {
            amount: 10,
          },
        },
      ],
      deliveryPrice: {
        amount: 12,
      },
    });

    expect(breakdown).toEqual({
      subtotalPrice: {amount: '35', currencyCode: 'CAD'},
      totalShippingPrice: {amount: '12', currencyCode: 'CAD'},
      totalPrice: {amount: '47', currencyCode: 'CAD'},
    });
  });
});
