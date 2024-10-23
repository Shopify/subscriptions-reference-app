import {mockShopifyServer, mountRemixStubWithAppContext} from '#/test-utils';
import {faker} from '@faker-js/faker';
import {composeGid} from '@shopify/admin-graphql-api-utilities';
import {screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {type CurrencyCode, DiscountTargetType} from 'types/admin.types';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {createMockShopContext} from '~/routes/app.contracts.$id._index/tests/Fixtures';
import SubscriptionDetails, {action, loader} from '../../../route';
import {
  createMockGraphQLResponse,
  createMockSubscriptionContractEditDetails,
  createMockSubscriptionLine,
} from './Fixtures';
import {formatPrice} from '~/utils/helpers/money';
import {mockShopify} from '#/setup-app-bridge';

const mockShopContext = createMockShopContext();
const mockContractEditDetails = createMockSubscriptionContractEditDetails();

vi.stubGlobal('shopify', mockShopify);
const mockDraftId = composeGid('SubscriptionContractDraft', 1);

const {mockGraphQL} = mockShopifyServer();

const addLineMock = vi.hoisted(() => vi.fn().mockResolvedValue(true));
const removeLineMock = vi.hoisted(() => vi.fn().mockResolvedValue(true));
const updateLineMock = vi.hoisted(() => vi.fn().mockResolvedValue(true));
const updateMock = vi.hoisted(() => vi.fn().mockResolvedValue(true));
const commitMock = vi.hoisted(() => vi.fn().mockResolvedValue(true));

vi.mock('~/models/SubscriptionContractDraft/SubscriptionContractDraft', () => {
  return {
    SubscriptionContractDraft: vi.fn().mockImplementation(() => ({
      addLine: addLineMock,
      removeLine: removeLineMock,
      updateLine: updateLineMock,
      update: updateMock,
      commit: commitMock,
    })),
  };
});

const defaultGraphQLResponses = createMockGraphQLResponse({
  SubscriptionContractEditDetails: {
    data: {
      subscriptionContract: {
        ...mockContractEditDetails,
      },
    },
  },
  SubscriptionContractUpdate: {
    data: {
      subscriptionContractUpdate: {
        draft: {
          id: mockDraftId,
        },
        userErrors: [],
      },
    },
  },
});

async function mountEditSubscriptionDetails(
  graphqlResponses: object = defaultGraphQLResponses,
) {
  mockGraphQL(graphqlResponses);

  mountRemixStubWithAppContext({
    routes: [
      {
        path: `/app/contracts/:id/edit`,
        Component: () => <SubscriptionDetails />,
        loader,
        action,
      },
    ],
    remixStubProps: {
      initialEntries: [`/app/contracts/1/edit`],
    },
    shopContext: mockShopContext,
  });

  return await screen.findByText('Subscription details');
}

describe('EditSubscriptionDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockShopify.toast.show.mockClear();
  });

  describe('UI', () => {
    it('displays the subscription details', async () => {
      await mountEditSubscriptionDetails();

      const {lines} = mockContractEditDetails;
      const {title, variantTitle, variantImage, currentPrice, quantity} =
        lines.edges[0].node;

      const expectedCurrencyText = formatPrice({
        amount: currentPrice.amount,
        currency: currentPrice.currencyCode,
        locale: 'en',
      });

      expect(screen.getByText(title)).toBeInTheDocument();
      expect(screen.getByText(variantTitle!)).toBeInTheDocument();
      expect(screen.getByText(expectedCurrencyText)).toBeInTheDocument();
      expect(
        screen.getByRole('button', {name: 'Edit price'}),
      ).toBeInTheDocument();

      const lineImage = screen.getByRole('img');
      expect(lineImage).toHaveAttribute('src', variantImage!.url!);
      expect(lineImage).toHaveAttribute('alt', variantImage!.altText!);

      const quantityTextField = screen.getByRole('spinbutton', {
        name: /Quantity/i,
      });

      expect(quantityTextField).toBeInTheDocument();
      expect(quantityTextField).toHaveValue(quantity);
    });
  });

  describe('delivery frequency', () => {
    it('shows options for changing the delivery frequency', async () => {
      await mountEditSubscriptionDetails();

      expect(screen.getByText('Delivery frequency')).toBeInTheDocument();
      expect(
        screen.getByRole('spinbutton', {
          name: /Interval count/i,
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('combobox', {
          name: /Interval/i,
        }),
      ).toBeInTheDocument();
    });

    it('updates the delivery frequency', async () => {
      await mountEditSubscriptionDetails(
        createMockGraphQLResponse({
          SubscriptionContractEditDetails: {
            data: {
              subscriptionContract: {
                ...defaultGraphQLResponses.SubscriptionContractEditDetails.data
                  .subscriptionContract,
                deliveryPolicy: {
                  interval: 'WEEK',
                  intervalCount: 3,
                },
              },
            },
          },
        }),
      );

      const newInterval = 'MONTH';
      const newIntervalCount = 2;

      const intervalSelect = screen.getByRole('combobox', {
        name: /Interval/i,
      });
      const intervalCountInput = screen.getByRole('spinbutton', {
        name: /Interval count/i,
      });

      await userEvent.clear(intervalCountInput);
      await userEvent.type(intervalCountInput, newIntervalCount.toString());

      await userEvent.selectOptions(intervalSelect, [newInterval]);

      await userEvent.click(screen.getByRole('button', {name: 'Save'}));
      await waitFor(() => {
        expect(updateMock).toHaveBeenCalledWith({
          deliveryPolicy: {
            interval: newInterval,
            intervalCount: newIntervalCount,
          },
          billingPolicy: {
            interval: newInterval,
            intervalCount: newIntervalCount,
          },
        });
      });

      await waitFor(() => {
        expect(commitMock).toHaveBeenCalled();
      });
    });

    it('validates the delivery frequency', async () => {
      await mountEditSubscriptionDetails(
        createMockGraphQLResponse({
          SubscriptionContractEditDetails: {
            data: {
              subscriptionContract: {
                ...defaultGraphQLResponses.SubscriptionContractEditDetails.data
                  .subscriptionContract,
                deliveryPolicy: {
                  interval: 'WEEK',
                  intervalCount: 3,
                },
              },
            },
          },
        }),
      );

      const intervalCountInput = screen.getByRole('spinbutton', {
        name: /Interval count/i,
      });

      await userEvent.clear(intervalCountInput);
      await userEvent.type(intervalCountInput, '50000');
      await userEvent.click(screen.getByRole('button', {name: 'Save'}));
      expect(
        screen.getByText('Delivery frequency is too large'),
      ).toBeInTheDocument();

      await userEvent.clear(intervalCountInput);
      await userEvent.type(intervalCountInput, '-5');
      await userEvent.click(screen.getByRole('button', {name: 'Save'}));
      expect(
        screen.getByText('Number must be greater than or equal to 1'),
      ).toBeInTheDocument();

      await userEvent.clear(intervalCountInput);
      await userEvent.type(intervalCountInput, '2.2');
      await userEvent.click(screen.getByRole('button', {name: 'Save'}));
      expect(
        screen.getByText('Delivery frequency must be an integer'),
      ).toBeInTheDocument();
    });
  });

  describe('add lines', () => {
    it('adds products from the product picker (with no variant image)', async () => {
      await mountEditSubscriptionDetails();

      const mockSelectedProduct = {
        id: composeGid('Product', '1'),
        title: faker.commerce.productName(),
        totalVariants: 1,
        images: [
          {
            originalSrc: faker.image.url(),
            altText: faker.lorem.words(3),
          },
        ],
        variants: [
          {
            id: composeGid('ProductVariant', '1'),
            title: faker.commerce.productName(),
            price: faker.commerce.price({dec: 0}),
            image: {
              originalSrc: faker.image.url(),
              altText: faker.lorem.words(3),
            },
          },
        ],
      };

      mockShopify.resourcePicker.mockResolvedValueOnce([mockSelectedProduct]);

      await userEvent.click(screen.getByRole('button', {name: 'Browse'}));
      expect(screen.getByText(mockSelectedProduct.title)).toBeInTheDocument();
      expect(
        screen.getByText(mockSelectedProduct.variants[0].title),
      ).toBeInTheDocument();

      const expectedPriceAmount = Number(mockSelectedProduct.variants[0].price);
      const priceMoney = {
        amount: expectedPriceAmount,
        currencyCode: 'CAD' as CurrencyCode,
      };

      const mockLines = [
        ...mockContractEditDetails.lines.edges,
        {
          node: createMockSubscriptionLine({
            variantImage: {
              url: mockSelectedProduct.images[0].originalSrc,
              altText: mockSelectedProduct.images[0].altText,
            },
            currentPrice: priceMoney,
            pricingPolicy: {
              basePrice: priceMoney,
              cycleDiscounts: [
                {
                  afterCycle: 0,
                  adjustmentType: 'FIXED_AMOUNT' as any,
                  computedPrice: priceMoney,
                  adjustmentValue: priceMoney,
                },
              ],
            },
          }),
        },
      ];

      // Update the mocked GraphQL responses to match the new state
      mockGraphQL(
        createMockGraphQLResponse({
          SubscriptionContractEditDetails: {
            data: {
              subscriptionContract: {
                ...mockContractEditDetails,
                lines: {edges: mockLines},
              },
            },
          },
        }),
      );

      await userEvent.click(screen.getByRole('button', {name: 'Save'}));

      await waitFor(() => {
        expect(addLineMock).toHaveBeenCalledWith({
          quantity: 1,
          // the graphql input is a string but it gets coerced to number by zod first
          currentPrice: expectedPriceAmount,
          productVariantId: mockSelectedProduct.variants[0].id,
          pricingPolicy: {
            basePrice: expectedPriceAmount,
            cycleDiscounts: [
              {
                adjustmentType: 'PRICE',
                adjustmentValue: {
                  fixedValue: expectedPriceAmount,
                },
                afterCycle: 0,
                computedPrice: expectedPriceAmount,
              },
            ],
          },
        });
      });

      // Checking to see if correct image is being used
      await waitFor(() => {
        expect(screen.getAllByRole('img')[1]).toHaveAttribute(
          'src',
          mockSelectedProduct.images[0].originalSrc,
        );
      });

      await waitFor(() => {
        expect(commitMock).toHaveBeenCalled();
      });
    });

    it('uses variant image if totalVariants > 1', async () => {
      await mountEditSubscriptionDetails();

      const mockSelectedProduct = {
        id: composeGid('Product', '1'),
        title: faker.commerce.productName(),
        totalVariants: 2,
        images: [
          {
            originalSrc: faker.image.url(),
            altText: faker.lorem.words(3),
          },
        ],
        variants: [
          {
            id: composeGid('ProductVariant', '1'),
            title: faker.commerce.productName(),
            price: faker.commerce.price({dec: 0}),
            image: {
              originalSrc: faker.image.url(),
              altText: faker.lorem.words(3),
            },
          },
          {
            id: composeGid('ProductVariant', '2'),
            title: faker.commerce.productName(),
            price: faker.commerce.price({dec: 0}),
            image: {
              originalSrc: faker.image.url(),
              altText: faker.lorem.words(3),
            },
          },
        ],
      };

      mockShopify.resourcePicker.mockResolvedValueOnce([mockSelectedProduct]);

      await userEvent.click(screen.getByRole('button', {name: 'Browse'}));

      // Product title will be displayed twice, once for each variant
      expect(screen.getAllByText(mockSelectedProduct.title)).toHaveLength(2);
      mockSelectedProduct.variants.forEach((variant) => {
        expect(screen.getByText(variant.title)).toBeInTheDocument();
      });

      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(2);
      images.forEach((img, index) => {
        expect(img).toHaveAttribute(
          'src',
          mockSelectedProduct.variants[index].image.originalSrc,
        );
      });
    });

    it('shows an error when adding a line fails', async () => {
      addLineMock.mockResolvedValue(false);
      await mountEditSubscriptionDetails();

      const mockSelectedProduct = {
        id: composeGid('Product', '1'),
        title: faker.commerce.productName(),
        variants: [
          {
            id: composeGid('ProductVariant', '1'),
            title: faker.commerce.productName(),
            price: faker.commerce.price({dec: 0}),
          },
        ],
      };

      mockShopify.resourcePicker.mockResolvedValueOnce([mockSelectedProduct]);

      await userEvent.click(screen.getByRole('button', {name: 'Browse'}));
      expect(screen.getByText(mockSelectedProduct.title)).toBeInTheDocument();
      expect(
        screen.getByText(mockSelectedProduct.variants[0].title),
      ).toBeInTheDocument();

      const expectedPriceAmount = Number(mockSelectedProduct.variants[0].price);

      await userEvent.click(screen.getByRole('button', {name: 'Save'}));
      await waitFor(() => {
        expect(addLineMock).toHaveBeenCalledWith({
          quantity: 1,
          currentPrice: expectedPriceAmount,
          productVariantId: mockSelectedProduct.variants[0].id,
          pricingPolicy: {
            basePrice: expectedPriceAmount,
            cycleDiscounts: [
              {
                adjustmentType: 'PRICE',
                adjustmentValue: {
                  fixedValue: expectedPriceAmount,
                },
                afterCycle: 0,
                computedPrice: expectedPriceAmount,
              },
            ],
          },
        });
      });

      expect(mockShopify.toast.show).toHaveBeenCalledWith(
        'Unable to update subscription contract',
        {isError: true},
      );
    });
  });

  describe('remove lines', () => {
    it('removes existing lines by clicking the delete icon', async () => {
      const mockLines = [
        createMockSubscriptionLine({
          title: 'Line 1',
          variantTitle: 'Variant title 1',
          id: composeGid('SubscriptionLine', 1),
          quantity: 1,
        }),
        createMockSubscriptionLine({
          title: 'Line 2',
          variantTitle: 'Variant title 2',
          id: composeGid('SubscriptionLine', 2),
          quantity: 1,
        }),
        createMockSubscriptionLine({
          title: 'Line 3',
          variantTitle: 'Variant title 3',
          id: composeGid('SubscriptionLine', 3),
          quantity: 1,
        }),
      ];

      await mountEditSubscriptionDetails(
        createMockGraphQLResponse({
          SubscriptionContractEditDetails: {
            data: {
              subscriptionContract: {
                ...mockContractEditDetails,
                lines: {
                  edges: mockLines.map((line) => ({
                    node: line,
                  })),
                },
              },
            },
          },
        }),
      );

      expect(screen.getByText('Line 1')).toBeInTheDocument();
      expect(screen.getByText('Line 2')).toBeInTheDocument();
      expect(screen.getByText('Line 3')).toBeInTheDocument();

      const deleteButtons = screen.getAllByRole('button', {
        name: 'Remove subscription line',
      });

      expect(deleteButtons).toHaveLength(3);

      await userEvent.click(deleteButtons[2]);
      expect(screen.queryByText('Line 3')).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', {name: 'Save'}));
      await waitFor(() => {
        expect(removeLineMock).toHaveBeenCalledWith(
          composeGid('SubscriptionLine', 3),
        );
      });

      await waitFor(() => {
        expect(commitMock).toHaveBeenCalled();
      });
    });

    it('removes existing lines using the product picker', async () => {
      const mockLines = [
        createMockSubscriptionLine({
          id: composeGid('SubscriptionLine', 1),
          title: 'Line 1',
          variantTitle: 'Variant title 1',
          variantId: composeGid('ProductVariant', '1'),
          quantity: 1,
        }),
        createMockSubscriptionLine({
          id: composeGid('SubscriptionLine', 2),
          title: 'Line 2',
          variantTitle: 'Variant title 2',
          variantId: composeGid('ProductVariant', '2'),
          quantity: 1,
        }),
        createMockSubscriptionLine({
          id: composeGid('SubscriptionLine', 3),
          title: 'Line 3',
          variantTitle: 'Variant title 3',
          variantId: composeGid('ProductVariant', '3'),
          quantity: 1,
        }),
      ];

      await mountEditSubscriptionDetails(
        createMockGraphQLResponse({
          SubscriptionContractEditDetails: {
            data: {
              subscriptionContract: {
                ...mockContractEditDetails,
                lines: {
                  edges: mockLines.map((line) => ({
                    node: line,
                  })),
                },
              },
            },
          },
        }),
      );

      // only keep the first product variant selected
      const mockSelectedProduct = {
        id: mockLines[0].productId,
        title: mockLines[0].title,
        variants: [
          {
            id: mockLines[0].variantId,
            title: mockLines[0].variantTitle,
          },
        ],
      };

      mockShopify.resourcePicker.mockResolvedValueOnce([mockSelectedProduct]);

      await userEvent.click(screen.getByRole('button', {name: 'Browse'}));

      expect(screen.getByText('Line 1')).toBeInTheDocument();
      expect(screen.queryByText('Line 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Line 3')).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', {name: 'Save'}));
      await waitFor(() => {
        expect(removeLineMock).toHaveBeenCalledWith(
          composeGid('SubscriptionLine', 2),
        );
      });

      await waitFor(() => {
        expect(removeLineMock).toHaveBeenCalledWith(
          composeGid('SubscriptionLine', 3),
        );
      });

      await waitFor(() => {
        expect(commitMock).toHaveBeenCalled();
      });
    });

    it('prevents making the line count 0', async () => {
      const mockLines = [
        createMockSubscriptionLine({
          id: composeGid('SubscriptionLine', 1),
          title: 'Line 1',
          variantTitle: 'Variant title 1',
          variantId: composeGid('ProductVariant', '1'),
        }),
      ];

      await mountEditSubscriptionDetails(
        createMockGraphQLResponse({
          SubscriptionContractEditDetails: {
            data: {
              subscriptionContract: {
                ...mockContractEditDetails,
                lines: {
                  edges: mockLines.map((line) => ({
                    node: line,
                  })),
                },
              },
            },
          },
        }),
      );

      mockShopify.resourcePicker.mockResolvedValueOnce([]);

      await userEvent.click(screen.getByRole('button', {name: 'Browse'}));

      expect(mockShopify.toast.show).toHaveBeenCalledWith(
        'Subscription contracts must have at least 1 line item',
        {isError: true},
      );

      expect(screen.getByText('Line 1')).toBeInTheDocument();
    });

    it('shows an error if removing a line fails', async () => {
      removeLineMock.mockResolvedValue(false);

      const mockLines = [
        createMockSubscriptionLine({
          title: 'Line 1',
          variantTitle: 'Variant title 1',
          id: composeGid('SubscriptionLine', 1),
          quantity: 1,
        }),
        createMockSubscriptionLine({
          title: 'Line 2',
          variantTitle: 'Variant title 2',
          id: composeGid('SubscriptionLine', 2),
          quantity: 1,
        }),
      ];

      await mountEditSubscriptionDetails(
        createMockGraphQLResponse({
          SubscriptionContractEditDetails: {
            data: {
              subscriptionContract: {
                ...mockContractEditDetails,
                lines: {
                  edges: mockLines.map((line) => ({
                    node: line,
                  })),
                },
              },
            },
          },
        }),
      );

      const deleteButtons = screen.getAllByRole('button', {
        name: 'Remove subscription line',
      });

      await userEvent.click(deleteButtons[0]);
      expect(screen.queryByText('Line 1')).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', {name: 'Save'}));
      await waitFor(() => {
        expect(removeLineMock).toHaveBeenCalledWith(
          composeGid('SubscriptionLine', 1),
        );
      });

      expect(mockShopify.toast.show).toHaveBeenCalledWith(
        'Unable to update subscription contract',
        {isError: true},
      );
    });
  });

  describe('update line quantity', () => {
    it('updates the line quantity', async () => {
      const mockLines = [
        createMockSubscriptionLine({
          id: composeGid('SubscriptionLine', 1),
          title: 'Line 1',
          variantTitle: 'Variant title 1',
          variantId: composeGid('ProductVariant', '1'),
          quantity: 2,
        }),
      ];

      await mountEditSubscriptionDetails(
        createMockGraphQLResponse({
          SubscriptionContractEditDetails: {
            data: {
              subscriptionContract: {
                ...mockContractEditDetails,
                lines: {
                  edges: mockLines.map((line) => ({
                    node: line,
                  })),
                },
              },
            },
          },
        }),
      );

      const newQuantity = 5;

      const quantityChanger = screen.getByRole('spinbutton', {
        name: /Quantity/i,
      });

      expect(quantityChanger).toBeInTheDocument();

      await userEvent.clear(quantityChanger);
      await userEvent.type(quantityChanger, newQuantity.toString());

      await userEvent.click(screen.getByRole('button', {name: 'Save'}));
      await waitFor(() => {
        expect(updateLineMock).toHaveBeenCalledWith(mockLines[0].id, {
          currentPrice: Number(mockLines[0].currentPrice.amount),
          quantity: newQuantity,
        });
      });

      await waitFor(() => {
        expect(commitMock).toHaveBeenCalled();
      });
    });

    it('validates quantity', async () => {
      const mockLines = [
        createMockSubscriptionLine({
          id: composeGid('SubscriptionLine', 1),
          title: 'Line 1',
          variantTitle: 'Variant title 1',
          variantId: composeGid('ProductVariant', '1'),
          quantity: 1,
        }),
        createMockSubscriptionLine({
          id: composeGid('SubscriptionLine', 2),
          title: 'Line 2',
          variantTitle: 'Variant title 2',
          variantId: composeGid('ProductVariant', '2'),
          quantity: 1,
        }),
        createMockSubscriptionLine({
          id: composeGid('SubscriptionLine', 3),
          title: 'Line 3',
          variantTitle: 'Variant title 3',
          variantId: composeGid('ProductVariant', '3'),
          quantity: 1,
        }),
      ];

      await mountEditSubscriptionDetails(
        createMockGraphQLResponse({
          SubscriptionContractEditDetails: {
            data: {
              subscriptionContract: {
                ...mockContractEditDetails,
                lines: {
                  edges: mockLines.map((line) => ({
                    node: line,
                  })),
                },
              },
            },
          },
        }),
      );

      const quantityChangers = screen.getAllByRole('spinbutton', {
        name: /Quantity/i,
      });

      await userEvent.clear(quantityChangers[0]);
      await userEvent.type(quantityChangers[0], '999999999');

      await userEvent.clear(quantityChangers[1]);
      await userEvent.type(quantityChangers[1], '-1');

      await userEvent.clear(quantityChangers[2]);
      await userEvent.type(quantityChangers[2], '3.14');

      await userEvent.click(screen.getByRole('button', {name: 'Save'}));

      expect(screen.getByText('Quantity is too large')).toBeInTheDocument();
      expect(
        screen.getByText('Number must be greater than or equal to 1'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Expected integer, received float'),
      ).toBeInTheDocument();
    });
  });

  describe('update line price', () => {
    it('updates the line price through the edit price modal', async () => {
      const oneTimePurchasePrice = 120.0;
      const mockLines = [
        createMockSubscriptionLine({
          id: composeGid('SubscriptionLine', 1),
          title: 'Line 1',
          variantTitle: 'Variant title 1',
          variantId: composeGid('ProductVariant', '1'),
          currentPrice: {
            amount: 100,
            currencyCode: 'CAD' as CurrencyCode,
          },
          quantity: 1,
        }),
      ];

      await mountEditSubscriptionDetails(
        createMockGraphQLResponse({
          SubscriptionContractEditDetails: {
            data: {
              subscriptionContract: {
                ...mockContractEditDetails,
                lines: {
                  edges: mockLines.map((line) => ({
                    node: line,
                  })),
                },
              },
            },
          },
          ProductVariantPrice: {
            data: {
              productVariant: {
                id: composeGid('ProductVariant', 1),
                price: oneTimePurchasePrice,
              },
            },
          },
        }),
      );

      const newPrice = '120.67';

      const openPriceChangeModalButton = screen.getByRole('button', {
        name: 'Edit price',
      });
      expect(openPriceChangeModalButton).toBeInTheDocument();

      await userEvent.click(openPriceChangeModalButton);

      const priceInput = screen.getByRole('spinbutton', {
        name: /Subscription price/i,
      });
      expect(priceInput).toBeInTheDocument();

      const updateButton = screen.getByRole('button', {name: 'Update'});
      expect(updateButton).toBeInTheDocument();

      await userEvent.clear(priceInput);
      await userEvent.type(priceInput, newPrice);
      await userEvent.click(updateButton);

      expect(screen.getByText('CA$120.67')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', {name: 'Save'}));
      await waitFor(() => {
        expect(updateLineMock).toHaveBeenCalledWith(mockLines[0].id, {
          quantity: mockLines[0].quantity,
          currentPrice: Number(newPrice),
          pricingPolicy: {
            basePrice: oneTimePurchasePrice,
            cycleDiscounts: [
              {
                adjustmentType: 'PRICE',
                adjustmentValue: {
                  fixedValue: Number(newPrice),
                },
                afterCycle: 0,
                computedPrice: Number(newPrice),
              },
            ],
          },
        });
      });

      await waitFor(() => {
        expect(commitMock).toHaveBeenCalled();
      });
    });

    it('updates the price to the current one-time purchase price if the option to do so is clicked', async () => {
      const newOneTimePurchasePrice = 120.0;
      const mockLines = [
        createMockSubscriptionLine({
          id: composeGid('SubscriptionLine', 1),
          title: 'Line 1',
          variantTitle: 'Variant title 1',
          variantId: composeGid('ProductVariant', '1'),
          currentPrice: {
            amount: 100,
            currencyCode: 'CAD' as CurrencyCode,
          },
          pricingPolicy: {
            basePrice: {
              amount: 110,
              currencyCode: 'CAD' as CurrencyCode,
            },
            cycleDiscounts: [],
          },
          quantity: 1,
        }),
      ];

      await mountEditSubscriptionDetails(
        createMockGraphQLResponse({
          SubscriptionContractEditDetails: {
            data: {
              subscriptionContract: {
                ...mockContractEditDetails,
                lines: {
                  edges: mockLines.map((line) => ({
                    node: line,
                  })),
                },
              },
            },
          },
          ProductVariantPrice: {
            data: {
              productVariant: {
                id: composeGid('ProductVariant', 1),
                price: newOneTimePurchasePrice,
              },
            },
          },
        }),
      );

      await userEvent.click(
        screen.getByRole('button', {
          name: 'Edit price',
        }),
      );

      const updatePriceButton = screen.getByRole('button', {
        name: `Update subscription price of ${mockLines[0].title}`,
      });

      expect(updatePriceButton).toBeInTheDocument();

      await userEvent.click(updatePriceButton);

      expect(
        screen.getByRole('spinbutton', {
          name: /Subscription price/i,
        }),
      ).toHaveValue(newOneTimePurchasePrice);
    });

    it('shows a banner if the one-time purchase price has changed', async () => {
      const newOneTimePurchasePrice = 120.0;
      const mockLines = [
        createMockSubscriptionLine({
          id: composeGid('SubscriptionLine', 1),
          title: 'Line 1',
          variantTitle: 'Variant title 1',
          variantId: composeGid('ProductVariant', '1'),
          currentPrice: {
            amount: 100,
            currencyCode: 'CAD' as CurrencyCode,
          },
          pricingPolicy: {
            basePrice: {
              amount: 110,
              currencyCode: 'CAD' as CurrencyCode,
            },
            cycleDiscounts: [],
          },
          quantity: 1,
        }),
      ];

      await mountEditSubscriptionDetails(
        createMockGraphQLResponse({
          SubscriptionContractEditDetails: {
            data: {
              subscriptionContract: {
                ...mockContractEditDetails,
                lines: {
                  edges: mockLines.map((line) => ({
                    node: line,
                  })),
                },
              },
            },
          },
          ProductVariantPrice: {
            data: {
              productVariant: {
                id: composeGid('ProductVariant', 1),
                price: newOneTimePurchasePrice,
              },
            },
          },
        }),
      );

      await userEvent.click(
        screen.getByRole('button', {
          name: 'Edit price',
        }),
      );

      expect(
        screen.getByText(
          `The one-time purchase price of ${
            mockLines[0].title
          } has changed, and is now ${formatPrice({
            amount: newOneTimePurchasePrice,
            currency: 'CAD',
            locale: 'en',
          })}`,
        ),
      ).toBeInTheDocument();
    });
  });

  describe('price summary card', async () => {
    it('displays substotal price', async () => {
      const mockLines = [
        createMockSubscriptionLine({
          id: composeGid('SubscriptionLine', 1),
          lineDiscountedPrice: {
            amount: 13.45,
            currencyCode: 'CAD' as CurrencyCode,
          },
        }),
        createMockSubscriptionLine({
          id: composeGid('SubscriptionLine', 2),
          lineDiscountedPrice: {
            amount: 27.5,
            currencyCode: 'CAD' as CurrencyCode,
          },
        }),
      ];

      await mountEditSubscriptionDetails(
        createMockGraphQLResponse({
          SubscriptionContractEditDetails: {
            data: {
              subscriptionContract: {
                ...mockContractEditDetails,
                lines: {
                  edges: mockLines.map((line) => ({
                    node: line,
                  })),
                },
              },
            },
          },
        }),
      );

      const expectedCurrencyText = formatPrice({
        amount: 40.95,
        currency: 'CAD',
        locale: 'en',
      });

      expect(screen.getByText('Subtotal')).toBeInTheDocument();
      expect(screen.getByText(expectedCurrencyText)).toBeInTheDocument();
    });

    it('dislays shipping price', async () => {
      await mountEditSubscriptionDetails(
        createMockGraphQLResponse({
          SubscriptionContractEditDetails: {
            data: {
              subscriptionContract: {
                ...mockContractEditDetails,
                deliveryPrice: {
                  amount: 7.5,
                  currencyCode: 'CAD' as CurrencyCode,
                },
                deliveryMethod: {
                  shippingOption: {
                    title: 'Standard Shipping',
                  },
                },
              },
            },
          },
        }),
      );

      const expectedCurrencyText = formatPrice({
        amount: 7.5,
        currency: 'CAD',
        locale: 'en',
      });

      expect(screen.getByText('Shipping')).toBeInTheDocument();
      expect(screen.getByText(expectedCurrencyText)).toBeInTheDocument();
    });

    it('displays discounted shipping price', async () => {
      await mountEditSubscriptionDetails(
        createMockGraphQLResponse({
          SubscriptionContractEditDetails: {
            data: {
              subscriptionContract: {
                ...mockContractEditDetails,
                deliveryPrice: {
                  amount: 7.5,
                  currencyCode: 'CAD' as CurrencyCode,
                },
                deliveryMethod: {
                  shippingOption: {
                    title: 'Standard Shipping',
                  },
                },
                discounts: {
                  edges: [
                    {
                      node: {
                        id: '1',
                        title: 'Shipping Discount',
                        targetType: 'SHIPPING_LINE' as DiscountTargetType,
                      },
                    },
                  ],
                },
              },
            },
          },
        }),
      );

      const expectedCurrencyText = formatPrice({
        amount: 0,
        currency: 'CAD',
        locale: 'en',
      });

      expect(screen.getByText('Shipping')).toBeInTheDocument();
      expect(screen.getByText(expectedCurrencyText)).toBeInTheDocument();
    });
  });
});
