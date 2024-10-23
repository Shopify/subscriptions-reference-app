import type {PriceBreakdown} from 'types';

interface ContractPriceBreakdownArgs {
  currencyCode: string;
  lines: {
    lineDiscountedPrice: {
      amount: number | string;
    };
  }[];
  deliveryPrice?: {
    amount: number | string;
  };
}

export function getContractPriceBreakdown({
  currencyCode,
  lines,
  deliveryPrice = {amount: 0},
}: ContractPriceBreakdownArgs): PriceBreakdown {
  const subtotalAmount = lines.reduce(
    (acc, line) => acc + Number(line.lineDiscountedPrice.amount),
    0,
  );

  const subtotalPrice = {
    amount: subtotalAmount.toString(),
    currencyCode,
  };

  const totalShippingPrice = {
    amount: deliveryPrice.amount.toString(),
    currencyCode,
  };

  const totalPrice = {
    amount: (subtotalAmount + Number(deliveryPrice.amount)).toString(),
    currencyCode,
  };

  return {
    subtotalPrice,
    totalShippingPrice,
    totalPrice,
  };
}
