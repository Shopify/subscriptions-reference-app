import {describe, it, expect, vi, beforeEach} from 'vitest';
import '@testing-library/jest-dom/vitest';
import {render} from '@testing-library/preact';
import {SubscriptionScreen} from '../SubscriptionScreen';
import {
  CartApiContent,
  LineItem,
  ProductSearchApiContent,
  SessionApiContent,
} from '@shopify/ui-extensions/point-of-sale';
import useSubscriptionScreen from '../../hooks/useSubscriptionScreen';
import {SellingPlan} from '../../types';
import i18nForTests from '../../../tests/mocks/i18n';

// Mock the useSubscriptionScreen hook
vi.mock('../../hooks/useSubscriptionScreen', () => ({
  default: vi.fn(),
}));

// Mock the usePerformanceMeasure hook
vi.mock('../../hooks/usePerformanceMeasure', () => ({
  usePerformanceMeasure: vi.fn(),
}));

// Mock POS UI components as custom elements
vi.mock('@shopify/ui-extensions/preact', () => ({}));

const mockedUseSubscriptionScreen = useSubscriptionScreen as ReturnType<
  typeof vi.fn
>;

// Mock API objects
const mockCartApi = {
  addLineItemSellingPlan: vi.fn(),
  removeLineItemSellingPlan: vi.fn(),
} as any as CartApiContent;

const mockProductSearch: ProductSearchApiContent = {
  fetchProductVariantWithId: vi.fn(),
} as any;

const mockSession: SessionApiContent = {
  currentSession: {
    currency: 'USD',
  },
} as any;

const mockWindow = {
  close: vi.fn(),
};
(globalThis as any).window = mockWindow;

// Mock data
const mockLineItem = {
  uuid: 'line-item-123',
  variantId: 12345,
  price: 29.99,
  quantity: 1,
  productId: 1,
  title: 'Test Product',
  imageUrl: 'https://example.com/image.jpg',
  requiresSellingPlan: false,
} as unknown as LineItem;

const mockSellingPlan: SellingPlan = {
  id: 123,
  name: 'Weekly Subscription',
  pricingPolicy: {
    type: 'PERCENTAGE' as any,
    value: {percentage: 10},
  },
};

describe('SubscriptionScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render empty view when selling plans count is zero', () => {
    mockedUseSubscriptionScreen.mockReturnValue({
      sellingPlansState: {
        status: 'success',
        data: [],
      },
      variantState: {
        status: 'success',
        data: {
          id: 12345,
          title: 'Test Product - Large',
          price: '29.99',
          product: {
            id: 1,
            title: 'Test Product',
          },
        },
      },
      selectedPlan: undefined,
      setSelectedPlan: vi.fn(),
      handleApplyPress: vi.fn(),
      oneTimePurchasePrice: 'USD 29.99',
      fetchSellingPlans: vi.fn(),
    });

    const {container} = render(
      <SubscriptionScreen
        lineItem={mockLineItem}
        cartApi={mockCartApi}
        productSearch={mockProductSearch}
        session={mockSession}
        i18n={i18nForTests as any}
        source="test"
      />,
    );

    // Component should render without errors
    expect(container).toBeTruthy();
    // Should render the empty view with text content
    expect(container).toHaveTextContent('No purchase options available');
    expect(container).toHaveTextContent(
      'Try a different app for purchase options',
    );
    expect(container).toHaveTextContent('Go back');
  });

  it('should render error view when fetching selling plans fails', () => {
    const mockFetchSellingPlans = vi.fn();
    mockedUseSubscriptionScreen.mockReturnValue({
      sellingPlansState: {
        status: 'error',
        error: 'Failed to fetch selling plans',
      },
      variantState: {
        status: 'idle',
      },
      selectedPlan: undefined,
      setSelectedPlan: vi.fn(),
      handleApplyPress: vi.fn(),
      oneTimePurchasePrice: undefined,
      fetchSellingPlans: mockFetchSellingPlans,
    });

    const {container} = render(
      <SubscriptionScreen
        lineItem={mockLineItem}
        cartApi={mockCartApi}
        productSearch={mockProductSearch}
        session={mockSession}
        i18n={i18nForTests as any}
        source="test"
      />,
    );

    // Check that the error view is rendered
    expect(container).toHaveTextContent('load purchase plans');
    expect(container).toHaveTextContent('Check your connection and try again');
    expect(container).toHaveTextContent('Retry');
  });

  it('should render nothing when loading', () => {
    mockedUseSubscriptionScreen.mockReturnValue({
      sellingPlansState: {
        status: 'loading',
      },
      variantState: {
        status: 'loading',
      },
      selectedPlan: undefined,
      setSelectedPlan: vi.fn(),
      handleApplyPress: vi.fn(),
      oneTimePurchasePrice: undefined,
      fetchSellingPlans: vi.fn(),
    });

    const {container} = render(
      <SubscriptionScreen
        lineItem={mockLineItem}
        cartApi={mockCartApi}
        productSearch={mockProductSearch}
        session={mockSession}
        i18n={i18nForTests as any}
        source="test"
      />,
    );

    // Should not render the empty view or error view during loading
    expect(container).not.toHaveTextContent('No purchase options available');
    expect(container).not.toHaveTextContent("Can't load purchase plans");
  });

  it('should render content when selling plans are available', () => {
    mockedUseSubscriptionScreen.mockReturnValue({
      sellingPlansState: {
        status: 'success',
        data: [
          {
            name: 'Subscription Group',
            plans: [mockSellingPlan],
          },
        ],
      },
      variantState: {
        status: 'success',
        data: {
          id: 12345,
          title: 'Test Product - Large',
          price: '29.99',
          product: {
            id: 1,
            title: 'Test Product',
          },
        },
      },
      selectedPlan: undefined,
      setSelectedPlan: vi.fn(),
      handleApplyPress: vi.fn(),
      oneTimePurchasePrice: 'USD 29.99',
      fetchSellingPlans: vi.fn(),
    });

    const {container} = render(
      <SubscriptionScreen
        lineItem={mockLineItem}
        cartApi={mockCartApi}
        productSearch={mockProductSearch}
        session={mockSession}
        i18n={i18nForTests as any}
        source="test"
      />,
    );

    // Should render the selling plan
    expect(container).toHaveTextContent('Weekly Subscription');
    expect(container).toHaveTextContent('One-time purchase');
  });

  it('should not render one-time purchase when lineItem requires selling plan', () => {
    const lineItemRequiringPlan = {
      ...mockLineItem,
      requiresSellingPlan: true,
    } as LineItem;

    mockedUseSubscriptionScreen.mockReturnValue({
      sellingPlansState: {
        status: 'success',
        data: [
          {
            name: 'Subscription Group',
            plans: [mockSellingPlan],
          },
        ],
      },
      variantState: {
        status: 'success',
        data: {
          id: 12345,
          title: 'Test Product - Large',
          price: '29.99',
          product: {
            id: 1,
            title: 'Test Product',
          },
        },
      },
      selectedPlan: undefined,
      setSelectedPlan: vi.fn(),
      handleApplyPress: vi.fn(),
      oneTimePurchasePrice: 'USD 29.99',
      fetchSellingPlans: vi.fn(),
    });

    const {container} = render(
      <SubscriptionScreen
        lineItem={lineItemRequiringPlan}
        cartApi={mockCartApi}
        productSearch={mockProductSearch}
        session={mockSession}
        i18n={i18nForTests as any}
        source="test"
      />,
    );

    // Should NOT render one-time purchase option
    expect(container).not.toHaveTextContent('One-time purchase');
    expect(container).toHaveTextContent('Weekly Subscription');
  });

  it('should disable save button when selling plans are not loaded', () => {
    mockedUseSubscriptionScreen.mockReturnValue({
      sellingPlansState: {
        status: 'loading',
      },
      variantState: {
        status: 'idle',
      },
      selectedPlan: undefined,
      setSelectedPlan: vi.fn(),
      handleApplyPress: vi.fn(),
      oneTimePurchasePrice: undefined,
      fetchSellingPlans: vi.fn(),
    });

    const {container} = render(
      <SubscriptionScreen
        lineItem={mockLineItem}
        cartApi={mockCartApi}
        productSearch={mockProductSearch}
        session={mockSession}
        i18n={i18nForTests as any}
        source="test"
      />,
    );

    // Save button should be present but disabled
    expect(container).toHaveTextContent('Save');
  });

  it('should render multiple selling plan groups', () => {
    const multiplePlans: SellingPlan[] = [
      {
        id: 1,
        name: 'Weekly Plan',
        pricingPolicy: {
          type: 'PERCENTAGE' as any,
          value: {percentage: 10},
        },
      },
      {
        id: 2,
        name: 'Monthly Plan',
        pricingPolicy: {
          type: 'PERCENTAGE' as any,
          value: {percentage: 20},
        },
      },
    ];

    mockedUseSubscriptionScreen.mockReturnValue({
      sellingPlansState: {
        status: 'success',
        data: [
          {
            name: 'Group 1',
            plans: [multiplePlans[0]],
          },
          {
            name: 'Group 2',
            plans: [multiplePlans[1]],
          },
        ],
      },
      variantState: {
        status: 'success',
        data: {
          id: 12345,
          title: 'Test Product',
          price: '29.99',
          product: {
            id: 1,
            title: 'Test Product',
          },
        },
      },
      selectedPlan: undefined,
      setSelectedPlan: vi.fn(),
      handleApplyPress: vi.fn(),
      oneTimePurchasePrice: 'USD 29.99',
      fetchSellingPlans: vi.fn(),
    });

    const {container} = render(
      <SubscriptionScreen
        lineItem={mockLineItem}
        cartApi={mockCartApi}
        productSearch={mockProductSearch}
        session={mockSession}
        i18n={i18nForTests as any}
        source="test"
      />,
    );

    // Should render both plans from different groups
    expect(container).toHaveTextContent('Weekly Plan');
    expect(container).toHaveTextContent('Monthly Plan');
  });
});
