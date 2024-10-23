import {mountComponentWithRemixStub} from '#/test-utils';
import {screen, waitFor} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import userEvent from '@testing-library/user-event';
import {ValidatedForm} from 'remix-validated-form';
import {defaultDiscountDeliveryOption} from '~/routes/app.plans.$id/utils';
import {
  DiscountType,
  useSellingPlanFormValidator,
} from '~/routes/app.plans.$id/validator';
import {DeliveryFrequencyInterval} from '~/utils/helpers/zod';
import {DiscountDeliveryCard} from '../DiscountDeliveryCard';

function WithFormValidator({
  defaultValues,
  children,
}: {
  defaultValues: any;
  children: React.ReactNode;
}) {
  const validator = useSellingPlanFormValidator();

  return (
    <ValidatedForm validator={validator} defaultValues={defaultValues}>
      {children}
    </ValidatedForm>
  );
}

function mountWithValidatedForm(
  children: React.ReactNode,
  defaultValues: any = {},
) {
  return mountComponentWithRemixStub(
    <WithFormValidator defaultValues={defaultValues}>
      {children}
    </WithFormValidator>,
  );
}

describe('DiscountDeliveryCard', () => {
  describe('discount delivery option lines', () => {
    it('renders one line per discout delivery option', () => {
      mountWithValidatedForm(<DiscountDeliveryCard />, {
        offerDiscount: true,
        discountDeliveryOptions: [
          defaultDiscountDeliveryOption,
          defaultDiscountDeliveryOption,
          defaultDiscountDeliveryOption,
        ],
      });

      expect(screen.getAllByLabelText('Delivery frequency').length).toBe(3);
    });

    it('Clicking Add option adds a new line', async () => {
      mountWithValidatedForm(<DiscountDeliveryCard />, {
        offerDiscount: true,
        discountDeliveryOptions: [defaultDiscountDeliveryOption],
      });

      expect(screen.getByLabelText('Delivery frequency')).toBeInTheDocument();

      userEvent.click(screen.getByRole('button', {name: 'Add option'}));

      await waitFor(() => {
        const deliveryFrequencyInputs =
          screen.queryAllByLabelText('Delivery frequency');

        // Wait for the second input to be rendered
        if (deliveryFrequencyInputs.length !== 2) {
          throw new Error();
        }
      });

      userEvent.click(screen.getByRole('button', {name: 'Add option'}));

      await waitFor(() => {
        const deliveryFrequencyInputs =
          screen.queryAllByLabelText('Delivery frequency');

        // Wait for the third input to be rendered
        if (deliveryFrequencyInputs.length !== 3) {
          throw new Error();
        }
      });
    });

    it('Clicking Remove option removes the correct line if there is more than one line', async () => {
      mountWithValidatedForm(<DiscountDeliveryCard />, {
        offerDiscount: true,
        discountDeliveryOptions: [
          {
            deliveryFrequency: '2',
            deliveryInterval: DeliveryFrequencyInterval.Month,
            discountValue: '10',
          },
          {
            deliveryFrequency: '1',
            deliveryInterval: DeliveryFrequencyInterval.Week,
            discountValue: '20',
          },
        ],
      });

      expect(screen.getAllByLabelText('Delivery frequency').length).toBe(2);

      userEvent.click(
        screen.getAllByRole('button', {name: 'Remove option'})[0],
      );

      await waitFor(() => {
        const deliveryFrequencyInputs =
          screen.queryAllByLabelText('Delivery frequency');

        if (deliveryFrequencyInputs.length !== 1) {
          throw new Error();
        }
      });

      // check that the correct line was removed by finding all fields
      expect(screen.getByLabelText('Delivery frequency')).toHaveValue(1);
      expect(screen.getByLabelText('Delivery interval')).toHaveValue(
        DeliveryFrequencyInterval.Week,
      );
      expect(screen.getAllByLabelText('Percentage off')[1]).toHaveValue(20);
    });

    // test that the remove option button does not appear when there is only one line
    it('does not render remove option button when there is only one line', () => {
      mountWithValidatedForm(<DiscountDeliveryCard />, {
        offerDiscount: true,
        discountDeliveryOptions: [defaultDiscountDeliveryOption],
      });

      expect(
        screen.queryByRole('button', {name: 'Remove option'}),
      ).not.toBeInTheDocument();
    });
  });

  describe('frequency input', () => {
    it('renders when offering a discount', () => {
      mountWithValidatedForm(<DiscountDeliveryCard />, {
        offerDiscount: true,
        discountDeliveryOptions: [defaultDiscountDeliveryOption],
      });

      expect(screen.getByLabelText('Delivery frequency')).toBeInTheDocument();
    });

    it('renders renders once for each line when not offering a discount', () => {
      mountWithValidatedForm(<DiscountDeliveryCard />, {
        offerDiscount: false,
        discountDeliveryOptions: [defaultDiscountDeliveryOption],
      });

      expect(screen.getByLabelText('Delivery frequency')).toBeInTheDocument();
    });
  });

  describe('delivery interval input', () => {
    it('renders renders once for each line when offering a discount', () => {
      mountWithValidatedForm(<DiscountDeliveryCard />, {
        offerDiscount: true,
        discountDeliveryOptions: [defaultDiscountDeliveryOption],
      });

      expect(screen.getByLabelText('Delivery interval')).toBeInTheDocument();
    });

    it('renders renders once for each line when not offering a discount', () => {
      mountWithValidatedForm(<DiscountDeliveryCard />, {
        offerDiscount: false,
        discountDeliveryOptions: [defaultDiscountDeliveryOption],
      });

      expect(screen.getByLabelText('Delivery interval')).toBeInTheDocument();
    });
  });

  describe('discount amount input', () => {
    it('renders with percentage off label and no helptext when discountType is percentage', () => {
      mountWithValidatedForm(<DiscountDeliveryCard />, {
        offerDiscount: true,
        discountType: DiscountType.PERCENTAGE,
        discountDeliveryOptions: [defaultDiscountDeliveryOption],
      });

      const discountAmountInputs = screen.getAllByLabelText('Percentage off');

      // even though there is only one discountDeliveryOption, we expect two inputs because
      // the radio button for discount type is also rendered
      expect(discountAmountInputs.length).toBe(2);
      expect(
        screen.queryByText('This will be the price displayed to customers'),
      ).not.toBeInTheDocument();
    });

    it('renders with percentage off label and no helptext when discountType is amount off', () => {
      mountWithValidatedForm(<DiscountDeliveryCard />, {
        offerDiscount: true,
        discountType: DiscountType.FIXED_AMOUNT,
        discountDeliveryOptions: [defaultDiscountDeliveryOption],
      });

      const discountAmountInputs = screen.getAllByLabelText('Amount off');

      // even though there is only one discountDeliveryOption, we expect two inputs because
      // the radio button for discount type is also rendered
      expect(discountAmountInputs.length).toBe(2);
      expect(
        screen.queryByText('This will be the price displayed to customers'),
      ).not.toBeInTheDocument();
    });

    it('renders with percentage off label and helptext when discountType is flat rate', () => {
      mountWithValidatedForm(<DiscountDeliveryCard />, {
        offerDiscount: true,
        discountType: DiscountType.PRICE,
        discountDeliveryOptions: [defaultDiscountDeliveryOption],
      });

      const discountAmountInputs = screen.getAllByLabelText('Flat rate');

      // even though there is only one discountDeliveryOption, we expect two inputs because
      // the radio button for discount type is also rendered
      expect(discountAmountInputs.length).toBe(2);
      expect(
        screen.getByText('This will be the price displayed to customers'),
      ).toBeInTheDocument();
    });

    it('does not render when not offering a discount', () => {
      mountWithValidatedForm(<DiscountDeliveryCard />, {
        offerDiscount: false,
        discountType: DiscountType.PERCENTAGE,
        discountDeliveryOptions: [defaultDiscountDeliveryOption],
      });

      expect(screen.queryByLabelText('Percentage off')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Amount off')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Flat rate')).not.toBeInTheDocument();
    });
  });
});
