import {screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {mountComponentWithRemixStub} from '#/test-utils';
import {afterEach, describe, expect, it, vi} from 'vitest';
import type {Product} from '~/types';
import {ProductPickerCard} from '..';
import type {ProductPickerCardProps} from '../ProductPickerCard';
import {mockShopify} from '#/setup-app-bridge';

const useLoaderDataMock = vi.fn(() => ({plan: null}));

const useFieldMock = vi.hoisted(() => vi.fn());

vi.mock('remix-validated-form', async (originalImport) => {
  const original: any = await originalImport();
  return {
    ...original,
    useControlField: vi.fn().mockReturnValue(['', vi.fn()]),
    useField: useFieldMock.mockReturnValue({error: '', getInputProps: vi.fn()}),
  };
});

vi.mock('@remix-run/react', async (originalImport) => {
  const original: any = await originalImport();
  return {
    ...original,
    useLoaderData: useLoaderDataMock,
  };
});

describe('ProductPickerCard', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockSelectedProducts: Product[] = [
    {
      id: 'gid://shopify/Product/1',
      title: 'some product',
      images: [
        {
          originalSrc: 'https://shopify.com/image.png',
          altText: 'this is an image',
        },
      ],
      variants: [],
    },
    {
      id: 'gid://shopify/Product/2',
      title: 'some other product',
      images: [
        {
          originalSrc: 'https://shopify.com/image2.png',
          altText: 'this is another image',
        },
      ],
      variants: [],
    },
  ];

  const mockProps: ProductPickerCardProps = {
    selectedProducts: mockSelectedProducts,
    setSelectedProducts: vi.fn(),
    initialSelectedProductIds: '',
    initialSelectedVariantIds: '',
  };

  it('displays the search box', async () => {
    mountComponentWithRemixStub(<ProductPickerCard {...mockProps} />);

    expect(screen.getByPlaceholderText('Search products')).toBeInTheDocument();
  });

  it('opens the resource picker when something is typed in the search box', async () => {
    mountComponentWithRemixStub(<ProductPickerCard {...mockProps} />);

    const searchBox = screen.getByPlaceholderText('Search products');

    await userEvent.type(searchBox, 'a');

    expect(mockShopify.resourcePicker).toHaveBeenCalledOnce();
  });

  it('opens the resource picker when the browse button is clicked', async () => {
    mountComponentWithRemixStub(<ProductPickerCard {...mockProps} />);

    const browseButton = screen.getByRole('button', {name: 'Browse'});

    await userEvent.click(browseButton);

    expect(mockShopify.resourcePicker).toHaveBeenCalledOnce();
  });

  it('opens the resource picker when the edit button is clicked for a selected product', async () => {
    mountComponentWithRemixStub(<ProductPickerCard {...mockProps} />);

    const editButtons = screen.getAllByRole('button', {name: 'Edit'});
    expect(editButtons[0]).toBeInTheDocument();

    await userEvent.click(editButtons[0]);

    expect(mockShopify.resourcePicker).toHaveBeenCalledOnce();
  });

  it('displays products that have been selected', async () => {
    mountComponentWithRemixStub(<ProductPickerCard {...mockProps} />);

    mockSelectedProducts.forEach(({title}) => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });

  it('displays the variant count selected', async () => {
    const newMockProps = {
      ...mockProps,
      selectedProducts: [
        {
          ...mockProps.selectedProducts[0],
          totalVariants: 3,
          variants: Array.from({length: 2}, (_, index) => ({
            id: `gid://shopify/ProductVariant/${index}`,
          })),
        },
        mockProps.selectedProducts[1],
      ],
    };

    mountComponentWithRemixStub(<ProductPickerCard {...newMockProps} />);

    expect(screen.getByText('(2 of 3 variants selected)')).toBeInTheDocument();
  });

  it('displays selected products form errors', async () => {
    const mockError = 'Selected product error';
    useFieldMock.mockReturnValueOnce({
      getInputProps: vi.fn(),
      error: mockError,
    });
    mountComponentWithRemixStub(<ProductPickerCard {...mockProps} />);

    expect(screen.getByText(mockError)).toBeInTheDocument();
  });

  describe('selected items banner', () => {
    it('displays the banner when more than 250 items are selected', async () => {
      const selectedProducts = Array.from({length: 251}, (_, index) => ({
        id: `gid://shopify/Product/${index + 1}`,
        title: `Product ${index + 1}`,
        images: [],
        variants: [],
      }));

      const props = {
        ...mockProps,
        selectedProducts,
      };

      mountComponentWithRemixStub(<ProductPickerCard {...props} />);

      expect(
        screen.getByText(
          'Only 250 items can be added at a time. If you have more than 250 items, you can add them after saving this plan.',
        ),
      ).toBeInTheDocument();
    });

    it('does not display the banner when less than 250 items are selected', async () => {
      const selectedProducts = Array.from({length: 249}, (_, index) => ({
        id: `gid://shopify/Product/${index + 1}`,
        title: `Product ${index + 1}`,
        images: [],
        variants: [],
      }));

      const props = {
        ...mockProps,
        selectedProducts,
      };

      mountComponentWithRemixStub(<ProductPickerCard {...props} />);

      expect(
        screen.queryByText(
          'Only 250 items can be added at a time. If you have more than 250 items, you can add them after saving this plan.',
        ),
      ).not.toBeInTheDocument();
    });
  });
});
