import {mockAdminApis} from 'tests/mocks/mockAdminApis';

import {mockAdminUiExtension} from 'tests/mocks/ui-extension-mocks';
import {beforeEach, describe, expect, it} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {within} from '@testing-library/dom';

import {AdminSubsAction} from '../ActionExtension';
import {EXTENSION_TARGET_PRODUCT} from '../consts';
import AdminExtensionContext from 'foundation/AdminExtensionContext';

const {adminGraphql, mockExtensionApi, mockAdminGraphql} = mockAdminApis();

describe('AdminSubsAction', () => {
  const component = (
    <AdminExtensionContext.Provider value={EXTENSION_TARGET_PRODUCT}>
      <AdminSubsAction />
    </AdminExtensionContext.Provider>
  );

  beforeEach(() => {
    mockExtensionApi();
    mockAdminUiExtension();
  });

  it('renders inputs for merchant code and plan name', async () => {
    render(component);

    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Internal description')).toBeInTheDocument();
  });

  it('renders one discount delivery option by default', () => {
    render(component);

    const deliveryOptions = within(screen.getByTestId('delivery-options'));

    expect(
      deliveryOptions.getByLabelText('Delivery frequency'),
    ).toBeInTheDocument();
    expect(
      deliveryOptions.getByLabelText('Delivery interval'),
    ).toBeInTheDocument();
    expect(
      deliveryOptions.getByLabelText('Percentage off'),
    ).toBeInTheDocument();
  });

  it('does not show remove option button when there is only one ', async () => {
    render(component);

    await userEvent.click(screen.getByText('Option'));
    await userEvent.click(
      screen.getAllByRole('button', {name: 'Remove option'})[0],
    );

    expect(screen.getByLabelText('Delivery frequency')).toBeInTheDocument();
  });

  it('clicking add option button adds another discount delivery option', async () => {
    render(component);

    await userEvent.click(screen.getByText('Option'));

    const deliveryOptions = within(screen.getByTestId('delivery-options'));

    expect(
      deliveryOptions.getAllByLabelText('Delivery frequency'),
    ).toHaveLength(2);
    expect(deliveryOptions.getAllByLabelText('Delivery interval')).toHaveLength(
      2,
    );
    expect(deliveryOptions.getAllByLabelText('Percentage off')).toHaveLength(2);
  });

  it('clicking remove option button removes the option', async () => {
    render(component);

    await userEvent.click(screen.getByText('Option'));
    await userEvent.click(
      screen.getAllByRole('button', {name: 'Remove option'})[0],
    );

    expect(screen.getByLabelText('Delivery frequency')).toBeInTheDocument();
  });

  it.todo(
    'removes the correct delivery option when clicking remove option button',
  );

  describe('discount type and value', () => {
    it('renders offer discount as checked and discount type choice list by default', async () => {
      render(component);

      expect(screen.getByLabelText('Offer discount')).toBeChecked();
      expect(screen.getByTestId('discount-type')).toBeInTheDocument();
    });

    it('does not render discount type and value when offer discount is unchecked', async () => {
      render(component);

      await userEvent.click(screen.getByLabelText('Offer discount'));

      expect(screen.queryByLabelText('Percentage off')).not.toBeInTheDocument();
    });

    it('renders Percentage off discount selected by default', async () => {
      render(component);

      const discountType = within(screen.getByTestId('discount-type'));
      expect(discountType.getByLabelText('Percentage off')).toBeChecked();

      const deliveryOptions = within(screen.getByTestId('delivery-options'));

      expect(
        deliveryOptions.getByLabelText('Percentage off'),
      ).toBeInTheDocument();
      expect(
        deliveryOptions.queryByLabelText('Amount off'),
      ).not.toBeInTheDocument();
      expect(
        deliveryOptions.queryByLabelText('Flat rate'),
      ).not.toBeInTheDocument();
    });
  });

  describe('create selling plan group', () => {
    it('calls the CreateSellingPlanGroup mutation with the correct properties', async () => {
      mockAdminGraphql({
        data: {
          SellingPlanGroupCreate: {
            sellingPlanGroup: {
              id: 'gid://shopify/SellingPlanGroup/2',
            },
          },
        },
      });

      const productId = 'gid://shopify/Product/123';
      mockExtensionApi({productId});

      render(component);

      await modifyTitles({});
      await modifyDeliveryOptions({});
      await saveSellingPlanGroup();

      const [createSellingPlanGroupMutationCall] = adminGraphql();

      expect(createSellingPlanGroupMutationCall).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          resources: {
            productIds: [productId],
          },
          input: expect.objectContaining({
            merchantCode: 'Test merchant code',
            name: 'Test title',
            sellingPlansToCreate: [
              expect.objectContaining({
                name: 'Deliver every 2 months, 10% off',
                billingPolicy: {
                  recurring: {
                    interval: 'MONTH',
                    intervalCount: 2,
                  },
                },
                deliveryPolicy: {
                  recurring: {
                    interval: 'MONTH',
                    intervalCount: 2,
                  },
                },
                pricingPolicies: [
                  {
                    fixed: {
                      adjustmentType: 'PERCENTAGE',
                      adjustmentValue: {
                        percentage: 10,
                      },
                    },
                  },
                ],
                category: 'SUBSCRIPTION',
              }),
            ],
          }),
        }),
      );
    });

    it.each(['FIXED_AMOUNT', 'PRICE'])(
      'creates a selling plan group with a %s discount type',
      async (discountType) => {
        mockAdminGraphql({
          data: {
            SellingPlanGroupCreate: {
              sellingPlanGroup: {
                id: 'gid://shopify/SellingPlanGroup/2',
              },
            },
          },
        });

        const productId = 'gid://shopify/Product/123';
        mockExtensionApi({productId});

        render(component);

        await modifyTitles({});
        await modifyDeliveryOptions({
          frequency: '1',
          interval: 'WEEK',
          discount: '10',
          discountType,
        });

        await saveSellingPlanGroup();

        const [createSellingPlanGroupMutationCall] = adminGraphql();
        expect(createSellingPlanGroupMutationCall).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            resources: {
              productIds: [productId],
            },
            input: expect.objectContaining({
              sellingPlansToCreate: [
                expect.objectContaining({
                  name: `Deliver every week, $10.00 ${discountType === 'FIXED_AMOUNT' ? 'off' : 'flat rate'}`,
                  pricingPolicies: [
                    {
                      fixed: {
                        adjustmentType: discountType,
                        adjustmentValue: {
                          fixedValue: 10,
                        },
                      },
                    },
                  ],
                  category: 'SUBSCRIPTION',
                }),
              ],
            }),
          }),
        );
      },
    );
  });
});

async function modifyTitles({
  merchantCode = 'Test merchant code',
  title = 'Test title',
}: {
  merchantCode?: string;
  title?: string;
}) {
  const titleInput = screen.getByRole('textbox', {name: 'Title'});
  const merchantCodeInput = screen.getByRole('textbox', {
    name: 'Internal description',
  });

  await userEvent.type(titleInput, title);
  await userEvent.type(merchantCodeInput, merchantCode);
}

async function modifyDeliveryOptions({
  frequency = '2',
  interval = 'MONTH',
  discount = '10',
  discountType = 'PERCENTAGE',
}: {
  frequency?: string;
  interval?: string;
  discount?: string;
  discountType?: string;
}) {
  const deliveryOptions = within(screen.getByTestId('delivery-options'));

  const discountTypeLabel = (() => {
    switch (discountType) {
      case 'PERCENTAGE':
        return 'Percentage off';
      case 'FIXED_AMOUNT':
        return 'Amount off';
      case 'PRICE':
        return 'Flat rate';
    }
  })();

  const discountTypeRadio = screen.getByRole('radio', {
    name: discountTypeLabel,
  });
  await userEvent.click(discountTypeRadio);

  const deliveryFrequencyTextBox = deliveryOptions.getByRole('spinbutton', {
    name: 'Delivery frequency',
  });

  const deliveryIntervalSelect = deliveryOptions.getByRole('combobox', {
    name: 'Delivery interval',
  });

  const discountTextBox = deliveryOptions.getByRole('spinbutton', {
    name: discountTypeLabel,
  });

  await userEvent.clear(deliveryFrequencyTextBox);
  await userEvent.type(deliveryFrequencyTextBox, frequency);

  await userEvent.selectOptions(deliveryIntervalSelect, interval);

  await userEvent.clear(discountTextBox);
  await userEvent.type(discountTextBox, discount);
}

async function saveSellingPlanGroup() {
  const saveButton = screen.getByRole('button', {name: 'Save'});
  await userEvent.click(saveButton);
}
