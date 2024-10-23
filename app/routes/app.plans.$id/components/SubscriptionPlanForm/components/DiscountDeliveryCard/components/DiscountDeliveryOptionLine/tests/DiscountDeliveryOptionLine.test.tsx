import {mountComponentWithRemixStub} from '#/test-utils';
import {screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {
  DiscountType,
  useSellingPlanFormValidator,
} from '~/routes/app.plans.$id/validator';
import {Form} from '~/components/Form';
import {DiscountDeliveryOptionLine} from '../DiscountDeliveryOptionLine';

function WithForm({children}: {children: React.ReactNode}) {
  const validator = useSellingPlanFormValidator();

  return <Form validator={validator}>{children}</Form>;
}

function mountWithForm(children: React.ReactNode) {
  return mountComponentWithRemixStub(<WithForm>{children}</WithForm>);
}

describe('DiscountDeliveryOptionLine', () => {
  describe('frequency input', () => {
    it('renders when offering a discount', () => {
      mountWithForm(
        <DiscountDeliveryOptionLine
          index={0}
          discountType={DiscountType.PERCENTAGE}
          offerDiscount={true}
          shopCurrencyCode="USD"
        />,
      );

      expect(screen.getByLabelText('Delivery frequency')).toBeInTheDocument();
    });

    it('renders when not offering a discount', () => {
      mountWithForm(
        <DiscountDeliveryOptionLine
          index={0}
          discountType={DiscountType.PERCENTAGE}
          offerDiscount={false}
          shopCurrencyCode="USD"
        />,
      );

      expect(screen.getByLabelText('Delivery frequency')).toBeInTheDocument();
    });
  });

  describe('delivery interval input', () => {
    it('renders when offering a discount', () => {
      mountWithForm(
        <DiscountDeliveryOptionLine
          index={0}
          discountType={DiscountType.PERCENTAGE}
          offerDiscount={true}
          shopCurrencyCode="USD"
        />,
      );

      expect(screen.getByLabelText('Delivery interval')).toBeInTheDocument();
    });

    it('renders when not offering a discount', () => {
      mountWithForm(
        <DiscountDeliveryOptionLine
          index={0}
          discountType={DiscountType.PERCENTAGE}
          offerDiscount={false}
          shopCurrencyCode="USD"
        />,
      );

      expect(screen.getByLabelText('Delivery interval')).toBeInTheDocument();
    });
  });

  describe('discount amount input', () => {
    it('renders with percentage off label and no helptext when discountType is percentage', () => {
      mountWithForm(
        <DiscountDeliveryOptionLine
          index={0}
          discountType={DiscountType.PERCENTAGE}
          offerDiscount={true}
          shopCurrencyCode="USD"
        />,
      );

      expect(screen.getByLabelText('Percentage off')).toBeInTheDocument();
      expect(
        screen.queryByText('This will be the price displayed to customers'),
      ).not.toBeInTheDocument();
    });

    it('renders with percentage off label and no helptext when discountType is amount off', () => {
      mountWithForm(
        <DiscountDeliveryOptionLine
          index={0}
          discountType={DiscountType.FIXED_AMOUNT}
          offerDiscount={true}
          shopCurrencyCode="USD"
        />,
      );

      expect(screen.getByLabelText('Amount off')).toBeInTheDocument();
      expect(screen.queryByText('$')).toBeInTheDocument();
      expect(
        screen.queryByText('This will be the price displayed to customers'),
      ).not.toBeInTheDocument();
    });

    it('renders with the correct currency label', () => {
      mountWithForm(
        <DiscountDeliveryOptionLine
          index={0}
          discountType={DiscountType.FIXED_AMOUNT}
          offerDiscount={true}
          shopCurrencyCode="JPY"
        />,
      );

      expect(screen.queryByText('¥')).toBeInTheDocument();
    });

    it('renders with percentage off label and helptext when discountType is fixed price', () => {
      mountWithForm(
        <DiscountDeliveryOptionLine
          index={0}
          discountType={DiscountType.PRICE}
          offerDiscount={true}
          shopCurrencyCode="USD"
        />,
      );

      expect(screen.getByLabelText('Fixed price')).toBeInTheDocument();
      expect(
        screen.getByText('This will be the price displayed to customers'),
      ).toBeInTheDocument();
    });

    it('does not render when not offering a discount', () => {
      mountWithForm(
        <DiscountDeliveryOptionLine
          index={0}
          discountType={DiscountType.PERCENTAGE}
          offerDiscount={false}
          shopCurrencyCode="USD"
        />,
      );

      expect(screen.queryByText('Percentage off')).not.toBeInTheDocument();
      expect(screen.queryByText('Amount off')).not.toBeInTheDocument();
      expect(screen.queryByText('Fixed price')).not.toBeInTheDocument();
    });
  });
});
