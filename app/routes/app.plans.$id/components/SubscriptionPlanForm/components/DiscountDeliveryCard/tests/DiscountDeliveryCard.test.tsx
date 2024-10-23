import {mountComponentWithRemixStub} from '#/test-utils';
import {screen, waitFor} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import userEvent from '@testing-library/user-event';
import {defaultDiscountDeliveryOption} from '~/routes/app.plans.$id/utils';
import {
  DiscountType,
  useSellingPlanFormValidator,
} from '~/routes/app.plans.$id/validator';
import {Form} from '~/components/Form';
import {DeliveryFrequencyInterval} from '~/utils/helpers/zod';
import {DiscountDeliveryCard} from '../DiscountDeliveryCard';

function WithForm({
  defaultValues,
  children,
}: {
  defaultValues: any;
  children: React.ReactNode;
}) {
  const validator = useSellingPlanFormValidator();

  return (
    <Form validator={validator} defaultValues={defaultValues}>
      {children}
    </Form>
  );
}

function mountWithForm(children: React.ReactNode, defaultValues: any = {}) {
  return mountComponentWithRemixStub(
    <WithForm defaultValues={defaultValues}>{children}</WithForm>,
  );
}

describe('DiscountDeliveryCard', () => {
  const defaultDeliveryOptions = [defaultDiscountDeliveryOption];

  describe('discount delivery option lines', () => {
    it('renders one line per discout delivery option', () => {
      const discountDeliveryOptions = [
        defaultDiscountDeliveryOption,
        defaultDiscountDeliveryOption,
        defaultDiscountDeliveryOption,
      ];
      mountWithForm(
        <DiscountDeliveryCard
          discountDeliveryOptions={discountDeliveryOptions}
        />,
        {offerDiscount: true, discountDeliveryOptions},
      );

      expect(screen.getAllByLabelText('Delivery frequency').length).toBe(3);
    });

    it('Clicking Add option adds a new line', async () => {
      mountWithForm(
        <DiscountDeliveryCard
          discountDeliveryOptions={defaultDeliveryOptions}
        />,
        {
          offerDiscount: true,
          discountDeliveryOptions: defaultDeliveryOptions,
        },
      );

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
      const discountDeliveryOptions = [
        {
          id: 'existing-option-0',
          deliveryFrequency: 2,
          deliveryInterval: DeliveryFrequencyInterval.Month,
          discountValue: 10,
        },
        {
          id: 'existing-option-1',
          deliveryFrequency: 1,
          deliveryInterval: DeliveryFrequencyInterval.Week,
          discountValue: 20,
        },
      ];
      mountWithForm(
        <DiscountDeliveryCard
          discountDeliveryOptions={discountDeliveryOptions}
        />,
        {
          offerDiscount: true,
          discountDeliveryOptions,
        },
      );

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
      mountWithForm(
        <DiscountDeliveryCard
          discountDeliveryOptions={defaultDeliveryOptions}
        />,
        {
          offerDiscount: true,
          discountDeliveryOptions: defaultDeliveryOptions,
        },
      );

      expect(
        screen.queryByRole('button', {name: 'Remove option'}),
      ).not.toBeInTheDocument();
    });
  });

  describe('frequency input', () => {
    it('renders when offering a discount', () => {
      mountWithForm(
        <DiscountDeliveryCard
          discountDeliveryOptions={defaultDeliveryOptions}
        />,
        {
          offerDiscount: true,
          discountDeliveryOptions: defaultDeliveryOptions,
        },
      );

      expect(screen.getByLabelText('Delivery frequency')).toBeInTheDocument();
    });

    it('renders renders once for each line when not offering a discount', () => {
      mountWithForm(
        <DiscountDeliveryCard
          discountDeliveryOptions={defaultDeliveryOptions}
        />,
        {
          offerDiscount: false,
          discountDeliveryOptions: defaultDeliveryOptions,
        },
      );

      expect(screen.getByLabelText('Delivery frequency')).toBeInTheDocument();
    });
  });

  describe('delivery interval input', () => {
    it('renders renders once for each line when offering a discount', () => {
      mountWithForm(
        <DiscountDeliveryCard
          discountDeliveryOptions={defaultDeliveryOptions}
        />,
        {
          offerDiscount: true,
          discountDeliveryOptions: defaultDeliveryOptions,
        },
      );

      expect(screen.getByLabelText('Delivery interval')).toBeInTheDocument();
    });

    it('renders renders once for each line when not offering a discount', () => {
      mountWithForm(
        <DiscountDeliveryCard
          discountDeliveryOptions={defaultDeliveryOptions}
        />,
        {
          offerDiscount: false,
          discountDeliveryOptions: defaultDeliveryOptions,
        },
      );

      expect(screen.getByLabelText('Delivery interval')).toBeInTheDocument();
    });
  });

  describe('discount amount input', () => {
    it('renders with percentage off label and no helptext when discountType is percentage', () => {
      mountWithForm(
        <DiscountDeliveryCard
          discountDeliveryOptions={defaultDeliveryOptions}
        />,
        {
          offerDiscount: true,
          discountType: DiscountType.PERCENTAGE,
          discountDeliveryOptions: defaultDeliveryOptions,
        },
      );

      const discountAmountInputs = screen.getAllByLabelText('Percentage off');

      // even though there is only one discountDeliveryOption, we expect two inputs because
      // the radio button for discount type is also rendered
      expect(discountAmountInputs.length).toBe(2);
      expect(
        screen.queryByText('This will be the price displayed to customers'),
      ).not.toBeInTheDocument();
    });

    it('renders with percentage off label and no helptext when discountType is amount off', () => {
      mountWithForm(
        <DiscountDeliveryCard
          discountDeliveryOptions={defaultDeliveryOptions}
        />,
        {
          offerDiscount: true,
          discountType: DiscountType.FIXED_AMOUNT,
          discountDeliveryOptions: defaultDeliveryOptions,
        },
      );

      const discountAmountInputs = screen.getAllByLabelText('Amount off');

      // even though there is only one discountDeliveryOption, we expect two inputs because
      // the radio button for discount type is also rendered
      expect(discountAmountInputs.length).toBe(2);
      expect(
        screen.queryByText('This will be the price displayed to customers'),
      ).not.toBeInTheDocument();
    });

    it('renders with percentage off label and helptext when discountType is fixed price', () => {
      mountWithForm(
        <DiscountDeliveryCard
          discountDeliveryOptions={defaultDeliveryOptions}
        />,
        {
          offerDiscount: true,
          discountType: DiscountType.PRICE,
          discountDeliveryOptions: defaultDeliveryOptions,
        },
      );

      const discountAmountInputs = screen.getAllByLabelText('Fixed price');

      // even though there is only one discountDeliveryOption, we expect two inputs because
      // the radio button for discount type is also rendered
      expect(discountAmountInputs.length).toBe(2);
      expect(
        screen.getByText('This will be the price displayed to customers'),
      ).toBeInTheDocument();
    });

    it('does not render when not offering a discount', () => {
      mountWithForm(
        <DiscountDeliveryCard
          discountDeliveryOptions={defaultDeliveryOptions}
        />,
        {
          offerDiscount: false,
          discountType: DiscountType.PERCENTAGE,
          discountDeliveryOptions: defaultDeliveryOptions,
        },
      );

      expect(screen.queryByLabelText('Percentage off')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Amount off')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Fixed price')).not.toBeInTheDocument();
    });
  });
});
