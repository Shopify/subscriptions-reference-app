import {screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {mountComponentWithRemixStub} from '#/test-utils';
import {afterEach, describe, expect, it, vi} from 'vitest';
import type {Product} from '~/types';
import {useSellingPlanFormValidator} from '~/routes/app.plans.$id/validator';
import {Form} from '~/components/Form';
import {ProductPickerCard} from '..';
import type {ProductPickerCardProps} from '../ProductPickerCard';
import {mockShopify} from '#/setup-app-bridge';

const formErrorMock = vi.hoisted(() => vi.fn());
const useLoaderDataMock = vi.hoisted(() => vi.fn(() => ({plan: null})));

vi.mock('@remix-run/react', async (originalImport) => {
  const original: any = await originalImport();
  return {
    ...original,
    useLoaderData: useLoaderDataMock,
  };
});

vi.mock('@rvf/remix', async (originalImport) => {
  const original: any = await originalImport();
  return {
    ...original,
    useFormContext: () => {
      const form = original.useFormContext();
      form.error = formErrorMock;
      return form;
    },
  };
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

function mountWithForm(
  children: React.ReactNode,
  defaultValues: any = {products: mockSelectedProducts},
) {
  return mountComponentWithRemixStub(
    <WithForm defaultValues={defaultValues}>{children}</WithForm>,
  );
}

describe('ProductPickerCard', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockProps: ProductPickerCardProps = {
    initialSelectedProductIds: '',
    initialSelectedVariantIds: '',
  };

  it('displays the search box', async () => {
    mountWithForm(<ProductPickerCard {...mockProps} />);

    expect(screen.getByPlaceholderText('Search products')).toBeInTheDocument();
  });

  it('opens the resource picker when something is typed in the search box', async () => {
    mountWithForm(<ProductPickerCard {...mockProps} />);

    const searchBox = screen.getByPlaceholderText('Search products');

    await userEvent.type(searchBox, 'a');

    expect(mockShopify.resourcePicker).toHaveBeenCalledOnce();
  });

  it('opens the resource picker when the browse button is clicked', async () => {
    mountWithForm(<ProductPickerCard {...mockProps} />);

    const browseButton = screen.getByRole('button', {name: 'Browse'});

    await userEvent.click(browseButton);

    expect(mockShopify.resourcePicker).toHaveBeenCalledOnce();
  });

  it('opens the resource picker when the edit button is clicked for a selected product', async () => {
    mountWithForm(<ProductPickerCard {...mockProps} />);

    const editButtons = screen.getAllByRole('button', {name: 'Edit'});
    expect(editButtons[0]).toBeInTheDocument();

    await userEvent.click(editButtons[0]);

    expect(mockShopify.resourcePicker).toHaveBeenCalledOnce();
  });

  it('displays products that have been selected', async () => {
    mountWithForm(<ProductPickerCard {...mockProps} />);

    mockSelectedProducts.forEach(({title}) => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });

  it('displays the variant count selected', async () => {
    mountWithForm(<ProductPickerCard {...mockProps} />, {
      products: [
        {
          ...mockSelectedProducts[0],
          totalVariants: 3,
          variants: Array.from({length: 2}, (_, index) => ({
            id: `gid://shopify/ProductVariant/${index}`,
          })),
        },
        mockSelectedProducts[1],
      ],
    });

    expect(screen.getByText('(2 of 3 variants selected)')).toBeInTheDocument();
  });

  it('displays selected products form errors', async () => {
    const mockError = 'Selected product error';
    formErrorMock.mockImplementation((field) => {
      switch (field) {
        case 'selectedProductIds':
          return mockError;
        default:
          return '';
      }
    });

    mountWithForm(<ProductPickerCard {...mockProps} />);

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

      mountWithForm(<ProductPickerCard {...mockProps} />, {
        products: selectedProducts,
      });

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

      mountWithForm(<ProductPickerCard {...props} />);

      expect(
        screen.queryByText(
          'Only 250 items can be added at a time. If you have more than 250 items, you can add them after saving this plan.',
        ),
      ).not.toBeInTheDocument();
    });
  });
});
