import {describe, it, expect, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/preact';
import {mockUiExtensionComponents} from '../../../tests/mocks/components';

// Mock UI components before importing components that use them
mockUiExtensionComponents();

import {PlanItem} from '../PlanItem';

describe('PlanItem', () => {
  const defaultProps = {
    title: 'Monthly Subscription',
    isSelected: false,
    onSelect: vi.fn(),
  };

  it('renders the title', () => {
    render(<PlanItem {...defaultProps} />);

    expect(screen.getByText('Monthly Subscription')).toBeInTheDocument();
  });

  it('renders the subtitle when provided', () => {
    render(<PlanItem {...defaultProps} subtitle="Delivered every month" />);

    expect(screen.getByText('Delivered every month')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    render(<PlanItem {...defaultProps} />);

    expect(screen.queryByText('Delivered every month')).not.toBeInTheDocument();
  });

  it('renders the price when provided', () => {
    render(<PlanItem {...defaultProps} price="$19.99/month" />);

    expect(screen.getByText('$19.99/month')).toBeInTheDocument();
  });

  it('does not render price when not provided', () => {
    render(<PlanItem {...defaultProps} />);

    expect(screen.queryByText('$19.99/month')).not.toBeInTheDocument();
  });

  it('shows circle icon when not selected', () => {
    const {container} = render(
      <PlanItem {...defaultProps} isSelected={false} />,
    );

    const icon = container.querySelector('s-icon');

    expect(icon).toHaveAttribute('type', 'circle');
  });

  it('shows check-circle-filled icon when selected', () => {
    const {container} = render(
      <PlanItem {...defaultProps} isSelected={true} />,
    );

    const icon = container.querySelector('s-icon');

    expect(icon).toHaveAttribute('type', 'check-circle-filled');
  });

  it('calls onSelect when clicked', () => {
    const onSelectMock = vi.fn();

    const {container} = render(
      <PlanItem {...defaultProps} onSelect={onSelectMock} />,
    );

    const clickable = container.querySelector('s-clickable') as HTMLElement;

    fireEvent.click(clickable);

    expect(onSelectMock).toHaveBeenCalledTimes(1);
  });

  it('renders all props together correctly', () => {
    const onSelectMock = vi.fn();
    const {container} = render(
      <PlanItem
        title="Weekly Plan"
        subtitle="Save 10%"
        price="$9.99/week"
        isSelected={true}
        onSelect={onSelectMock}
      />,
    );

    expect(screen.getByText('Weekly Plan')).toBeInTheDocument();
    expect(screen.getByText('Save 10%')).toBeInTheDocument();
    expect(screen.getByText('$9.99/week')).toBeInTheDocument();

    const icon = container.querySelector('s-icon');
    expect(icon).toHaveAttribute('type', 'check-circle-filled');

    const clickable = container.querySelector('s-clickable') as HTMLElement;
    fireEvent.click(clickable);
    expect(onSelectMock).toHaveBeenCalledTimes(1);
  });
});
