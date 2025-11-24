import {describe, it, expect, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/preact';
import {mockUiExtensionComponents} from '../../../tests/mocks/components';

// Mock UI components before importing components that use them
mockUiExtensionComponents();

import {EligibleLineItem} from '../EligibleLineItem';
import {EligibleLineItem as EligibleLineItemType} from '../../hooks/useEligibleLineItems';

describe('EligibleLineItem', () => {
  const mockLineItem: EligibleLineItemType = {
    productName: 'Test Product',
    variantName: 'Small / Red',
    subtitle: {
      text: 'Available for subscription',
      focused: false,
    },
    image: 'https://example.com/image.jpg',
    hasSellingPlan: false,
    data: {} as any,
  };

  const defaultProps = {
    lineItem: mockLineItem,
    onSelect: vi.fn(),
  };

  it('renders the product name', () => {
    render(<EligibleLineItem {...defaultProps} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('renders the variant name when provided', () => {
    render(<EligibleLineItem {...defaultProps} />);

    expect(screen.getByText('Small / Red')).toBeInTheDocument();
  });

  it('does not render variant name when not provided', () => {
    const lineItemWithoutVariant: EligibleLineItemType = {
      ...mockLineItem,
      variantName: undefined,
    };

    render(
      <EligibleLineItem {...defaultProps} lineItem={lineItemWithoutVariant} />,
    );

    expect(screen.queryByText('Small / Red')).not.toBeInTheDocument();
  });

  it('does not render product name when not provided', () => {
    const lineItemWithoutProduct: EligibleLineItemType = {
      ...mockLineItem,
      productName: '',
    };

    render(
      <EligibleLineItem {...defaultProps} lineItem={lineItemWithoutProduct} />,
    );

    expect(screen.queryByText('Test Product')).not.toBeInTheDocument();
  });

  it('renders the subtitle text', () => {
    render(<EligibleLineItem {...defaultProps} />);

    expect(screen.getByText('Available for subscription')).toBeInTheDocument();
  });

  it('renders the image with correct src', () => {
    const {container} = render(<EligibleLineItem {...defaultProps} />);

    const image = container.querySelector('s-image');
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('shows chevron-right icon when hasSellingPlan is false', () => {
    const {container} = render(<EligibleLineItem {...defaultProps} />);

    const icon = container.querySelector('s-icon');
    expect(icon).toHaveAttribute('type', 'chevron-right');
    expect(icon).toHaveAttribute('tone', 'auto');
  });

  it('shows check-circle-filled icon when hasSellingPlan is true', () => {
    const lineItemWithPlan: EligibleLineItemType = {
      ...mockLineItem,
      hasSellingPlan: true,
    };

    const {container} = render(
      <EligibleLineItem {...defaultProps} lineItem={lineItemWithPlan} />,
    );

    const icon = container.querySelector('s-icon');
    expect(icon).toHaveAttribute('type', 'check-circle-filled');
    expect(icon).toHaveAttribute('tone', 'success');
  });

  it('renders focused subtitle with warning tone', () => {
    const lineItemWithFocusedSubtitle: EligibleLineItemType = {
      ...mockLineItem,
      subtitle: {
        text: 'Purchase plan required',
        focused: true,
      },
    };

    const {container} = render(
      <EligibleLineItem
        {...defaultProps}
        lineItem={lineItemWithFocusedSubtitle}
      />,
    );

    expect(screen.getByText('Purchase plan required')).toBeInTheDocument();

    const subtitleElements = Array.from(
      container.querySelectorAll('s-text[type="small"]'),
    ) as HTMLElement[];
    const subtitle = subtitleElements.find(
      (el) => el.textContent === 'Purchase plan required',
    );
    expect(subtitle).toBeTruthy();
    expect(subtitle).toHaveAttribute('tone', 'warning');
  });

  it('renders non-focused subtitle with subdued color', () => {
    const {container} = render(<EligibleLineItem {...defaultProps} />);

    expect(screen.getByText('Available for subscription')).toBeInTheDocument();

    const subtitleElements = Array.from(
      container.querySelectorAll('s-text[type="small"]'),
    ) as HTMLElement[];
    const subtitle = subtitleElements.find(
      (el) => el.textContent === 'Available for subscription',
    );
    expect(subtitle).toBeTruthy();
    expect(subtitle).toHaveAttribute('color', 'subdued');
  });

  it('calls onSelect when clicked', () => {
    const onSelectMock = vi.fn();

    const {container} = render(
      <EligibleLineItem {...defaultProps} onSelect={onSelectMock} />,
    );

    const clickable = container.querySelector('s-clickable') as HTMLElement;
    fireEvent.click(clickable);

    expect(onSelectMock).toHaveBeenCalledTimes(1);
  });

  it('renders all props together correctly', () => {
    const onSelectMock = vi.fn();
    const completeLineItem: EligibleLineItemType = {
      productName: 'Complete Product',
      variantName: 'Large / Blue',
      subtitle: {
        text: 'Monthly subscription',
        focused: false,
      },
      image: 'https://example.com/complete.jpg',
      hasSellingPlan: true,
      data: {} as any,
    };

    const {container} = render(
      <EligibleLineItem lineItem={completeLineItem} onSelect={onSelectMock} />,
    );

    expect(screen.getByText('Complete Product')).toBeInTheDocument();
    expect(screen.getByText('Large / Blue')).toBeInTheDocument();
    expect(screen.getByText('Monthly subscription')).toBeInTheDocument();

    const image = container.querySelector('s-image');
    expect(image).toHaveAttribute('src', 'https://example.com/complete.jpg');

    const icon = container.querySelector('s-icon');
    expect(icon).toHaveAttribute('type', 'check-circle-filled');
    expect(icon).toHaveAttribute('tone', 'success');

    const clickable = container.querySelector('s-clickable') as HTMLElement;
    fireEvent.click(clickable);
    expect(onSelectMock).toHaveBeenCalledTimes(1);
  });

  it('handles missing image gracefully', () => {
    const lineItemWithoutImage: EligibleLineItemType = {
      ...mockLineItem,
      image: undefined,
    };

    const {container} = render(
      <EligibleLineItem {...defaultProps} lineItem={lineItemWithoutImage} />,
    );

    const image = container.querySelector('s-image') as HTMLElement;
    expect(image).toBeInTheDocument();
    // When image is undefined, the src attribute might not be set or be undefined
    const srcAttr = image?.getAttribute('src');
    expect(srcAttr === null || srcAttr === undefined || srcAttr === '').toBe(
      true,
    );
  });
});
