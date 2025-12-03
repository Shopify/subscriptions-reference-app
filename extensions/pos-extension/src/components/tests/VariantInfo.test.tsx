import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/preact';
import {mockUiExtensionComponents} from '../../../tests/mocks/components';

// Mock UI components before importing components that use them
mockUiExtensionComponents();

import {VariantInfo} from '../VariantInfo';

describe('VariantInfo', () => {
  const defaultProps = {
    productName: 'Test Product',
    variantName: 'Small / Red',
    image: 'https://example.com/image.jpg',
  };

  it('renders the component', () => {
    const {container} = render(<VariantInfo {...defaultProps} />);

    expect(container.querySelector('s-stack')).toBeInTheDocument();
  });

  it('renders the product name', () => {
    render(<VariantInfo {...defaultProps} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('renders the variant name when provided', () => {
    render(<VariantInfo {...defaultProps} />);

    expect(screen.getByText('Small / Red')).toBeInTheDocument();
  });

  it('does not render variant name when not provided', () => {
    render(<VariantInfo {...defaultProps} variantName={undefined} />);

    expect(screen.queryByText('Small / Red')).not.toBeInTheDocument();
  });

  it('does not render product name when empty string is provided', () => {
    render(<VariantInfo {...defaultProps} productName="" />);

    expect(screen.queryByText('Test Product')).not.toBeInTheDocument();
  });

  it('renders the image with correct src', () => {
    const {container} = render(<VariantInfo {...defaultProps} />);

    const image = container.querySelector('s-image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('renders the variant name with small type', () => {
    const {container} = render(<VariantInfo {...defaultProps} />);

    const textElements = Array.from(
      container.querySelectorAll('s-text'),
    ) as HTMLElement[];
    const variantText = textElements.find(
      (el) => el.textContent === 'Small / Red',
    );
    expect(variantText).toHaveAttribute('type', 'small');
  });

  it('handles missing image gracefully', () => {
    const {container} = render(
      <VariantInfo {...defaultProps} image={undefined} />,
    );

    const image = container.querySelector('s-image') as HTMLElement;
    expect(image).toBeInTheDocument();
    // When image is undefined, the src attribute might not be set or be undefined
    const srcAttr = image?.getAttribute('src');
    expect(srcAttr === null || srcAttr === undefined || srcAttr === '').toBe(
      true,
    );
  });

  it('renders all props together correctly', () => {
    const {container} = render(
      <VariantInfo
        productName="Complete Product"
        variantName="Large / Blue"
        image="https://example.com/complete.jpg"
      />,
    );

    expect(screen.getByText('Complete Product')).toBeInTheDocument();
    expect(screen.getByText('Large / Blue')).toBeInTheDocument();

    const image = container.querySelector('s-image');
    expect(image).toHaveAttribute('src', 'https://example.com/complete.jpg');
  });

  it('renders only product name when variant name is not provided', () => {
    const {container} = render(
      <VariantInfo
        productName="Product Only"
        variantName={undefined}
        image="https://example.com/product.jpg"
      />,
    );

    expect(screen.getByText('Product Only')).toBeInTheDocument();
    expect(screen.queryByText('Large / Blue')).not.toBeInTheDocument();

    const image = container.querySelector('s-image');
    expect(image).toHaveAttribute('src', 'https://example.com/product.jpg');
  });

  it('renders with minimal props', () => {
    const {container} = render(
      <VariantInfo
        productName="Minimal Product"
        variantName={undefined}
        image={undefined}
      />,
    );

    expect(screen.getByText('Minimal Product')).toBeInTheDocument();
    expect(screen.queryByText('Small / Red')).not.toBeInTheDocument();

    const image = container.querySelector('s-image');
    expect(image).toBeInTheDocument();
  });
});
