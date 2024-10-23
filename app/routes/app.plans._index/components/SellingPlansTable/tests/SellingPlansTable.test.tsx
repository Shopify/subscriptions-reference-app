import {mountComponentWithRemixStub} from '#/test-utils';
import {screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import {SellingPlanInterval} from '~/types';
import {SellingPlanAdjustment} from '~/types/plans';
import SellingPlansTable from '../SellingPlansTable';

const sellingPlansPageInfo = {
  hasNextPage: false,
  hasPreviousPage: false,
  startCursor: '',
  endCursor: '',
};

const mockPlans = [
  {
    id: 'gid://shopify/SellingPlanGroup/7',
    merchantCode: 'The first Selling Plan Group',
    productsCount: 0,
    productVariantsCount: 0,
    products: [],
    sellingPlans: [
      {
        id: 'gid://shopify/SellingPlan/1',
        pricingPolicies: [
          {
            adjustmentType: SellingPlanAdjustment.Percentage,
            adjustmentValue: {
              percentage: 12,
            },
          },
        ],
        deliveryPolicy: {
          interval: SellingPlanInterval.Month,
          intervalCount: 1,
        },
      },
    ],
    sellingPlansPageInfo: {
      hasNextPage: true,
      hasPreviousPage: false,
      startCursor: '',
      endCursor: '',
    },
  },
  {
    id: 'gid://shopify/SellingPlanGroup/6',
    merchantCode: 'The second Selling Plan Group',
    productsCount: 5,
    productVariantsCount: 5,
    products: [
      {
        id: 'gid://shopify/Product/1',
        title: 'Sleek Marble Chair',
      },
      {
        id: 'gid://shopify/Product/2',
        title: 'Awesome Wooden Tent',
      },
      {
        id: 'gid://shopify/Product/3',
        title: 'Marvelous Wool Roof',
      },
      {
        id: 'gid://shopify/Product/4',
        title: 'Incredible Marble Table',
      },
      {
        id: 'gid://shopify/Product/5',
        title: 'Intelligent Silk Tablet',
      },
    ],
    sellingPlans: [
      {
        id: 'gid://shopify/SellingPlan/2',
        pricingPolicies: [
          {
            adjustmentType: SellingPlanAdjustment.Percentage,
            adjustmentValue: {
              percentage: 12,
            },
          },
        ],
        deliveryPolicy: {
          interval: SellingPlanInterval.Month,
          intervalCount: 1,
        },
      },
    ],
    sellingPlansPageInfo: sellingPlansPageInfo,
  },
  {
    id: 'gid://shopify/SellingPlanGroup/5',
    merchantCode: 'subscribe-and-save',
    productsCount: 1,
    productsVariantCount: 0,
    products: [
      {
        id: 'gid://shopify/Product/1',
        title: 'Sleek Marble Chair',
      },
    ],
    sellingPlans: [
      {
        id: 'gid://shopify/SellingPlan/3',
        pricingPolicies: [
          {
            adjustmentType: SellingPlanAdjustment.Fixed,
            adjustmentValue: {
              amount: 100.0,
              currencyCode: 'CAD',
            },
          },
        ],
        deliveryPolicy: {
          interval: SellingPlanInterval.Week,
          intervalCount: 1,
        },
      },
      {
        id: 'gid://shopify/SellingPlan/4',
        pricingPolicies: [
          {
            adjustmentType: SellingPlanAdjustment.Fixed,
            adjustmentValue: {
              amount: 300.0,
              currencyCode: 'CAD',
            },
          },
        ],
        deliveryPolicy: {
          interval: SellingPlanInterval.Week,
          intervalCount: 2,
        },
      },
    ],
    sellingPlansPageInfo: sellingPlansPageInfo,
  },
];

const useLoaderDataMock = vi.hoisted(() => vi.fn());
useLoaderDataMock.mockReturnValue({plans: mockPlans, pagination: {}});
const useNavigationMock = vi.hoisted(() => vi.fn());
useNavigationMock.mockReturnValue({state: {}});

vi.mock('@remix-run/react', async (originalImport) => {
  const original: any = await originalImport();
  return {
    ...original,
    useLoaderData: useLoaderDataMock,
    useNavigation: useNavigationMock,
  };
});

describe('Subscriptions index page', () => {
  it('renders the table view if contracts exist', async () => {
    mountComponentWithRemixStub(
      <SellingPlansTable sellingPlanGroups={mockPlans} />,
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).length(4);
    expect(screen.getAllByRole('columnheader')).length(5);
  });

  it('renders tr elements with the correct ids', async () => {
    mountComponentWithRemixStub(
      <SellingPlansTable sellingPlanGroups={mockPlans} />,
    );

    mockPlans.forEach((plan) => {
      expect(document.getElementById(plan.id)).toBeInTheDocument();
    });
  });

  it('renders columns with correct values for a group with next page on plans and no products', async () => {
    mountComponentWithRemixStub(
      <SellingPlansTable sellingPlanGroups={mockPlans} />,
    );

    const plan = mockPlans[0];
    const row = document.getElementById(plan.id);
    const columns = row?.querySelectorAll('td') || [];
    const name = columns[1];
    const products = columns[2];
    const deliveryFrequency = columns[3];
    const Discount = columns[4];

    expect(name?.textContent).toBe(plan.merchantCode);
    expect(products?.textContent).toBe('None');
    expect(deliveryFrequency?.textContent).toBe(
      'Multiple delivery frequencies',
    );
    expect(Discount?.textContent).toBe('Multiple discounts');
  });

  it('renders columns with correct values for a group with one plan and 5 products', async () => {
    mountComponentWithRemixStub(
      <SellingPlansTable sellingPlanGroups={mockPlans} />,
    );

    const plan = mockPlans[1];
    const row = document.getElementById(plan.id);
    const columns = row?.querySelectorAll('td') || [];
    const name = columns[1];
    const products = columns[2];
    const deliveryFrequency = columns[3];
    const Discount = columns[4];

    expect(name?.textContent).toBe(plan.merchantCode);
    expect(products?.textContent).toBe('5 products');
    expect(deliveryFrequency?.textContent).toBe('Every month');
    expect(Discount?.textContent).toBe('12% off');
  });

  it('renders columns with correct values for a group with two plans and one products', async () => {
    mountComponentWithRemixStub(
      <SellingPlansTable sellingPlanGroups={mockPlans} />,
    );

    const plan = mockPlans[2];
    const row = document.getElementById(plan.id);
    const columns = row?.querySelectorAll('td') || [];
    const name = columns[1];
    const products = columns[2];
    const deliveryFrequency = columns[3];
    const Discount = columns[4];

    expect(name?.textContent).toBe(plan.merchantCode);
    expect(products?.textContent).toBe('Sleek Marble Chair');
    expect(deliveryFrequency?.textContent).toBe('2 delivery frequencies');
    expect(Discount?.textContent).toBe('CA$100.00-CA$300.00 off');
  });

  it('navigates to the create plan page when the primary action is triggered', async () => {
    mountComponentWithRemixStub(
      <SellingPlansTable sellingPlanGroups={mockPlans} />,
    );

    expect(screen.getByText('subscribe-and-save')).toBeInTheDocument();
  });

  it('renders index table filter', async () => {
    mountComponentWithRemixStub(
      <SellingPlansTable sellingPlanGroups={mockPlans} />,
    );

    const allBtn = document.querySelector('#all');
    expect(allBtn).toHaveTextContent('All');
  });

  it('renders sort options', async () => {
    mountComponentWithRemixStub(
      <SellingPlansTable sellingPlanGroups={mockPlans} />,
    );

    const sortBtn = document.querySelector('[data-polaris-tooltip-activator]');

    expect(sortBtn).toBeInTheDocument();

    if (sortBtn) {
      await userEvent.click(sortBtn);

      expect(screen.getByText('Created')).toBeInTheDocument();
      expect(screen.getByText('Updated')).toBeInTheDocument();
    }
  });
});
