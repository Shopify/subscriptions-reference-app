import {mountRemixStubWithAppContext} from '#/test-utils';
import {screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import {SubscriptionContractStatus} from '~/types';
import type {SubscriptionContractListItem} from '~/types/contracts';
import type {ContractsTableProps} from '../ContractsTable';
import {ContractsTable} from '../ContractsTable';
import { fail } from 'assert';

const useNavigationMock = vi.hoisted(() => vi.fn());
useNavigationMock.mockReturnValue({state: {}});

vi.mock('@remix-run/react', async (originalImport) => {
  const original: any = await originalImport();
  return {
    ...original,
    useNavigation: useNavigationMock,
  };
});

async function mountContractsTable({
  props,
  searchParams,
}: {
  props: ContractsTableProps;
  searchParams?: string;
}) {
  mountRemixStubWithAppContext({
    routes: [
      {
                path: '/app',        Component: () => <ContractsTable {...props} />,
      },
    ],
    remixStubProps: {
            initialEntries: [`/app?${searchParams || ''}`],    },
  });

  expect(
    await document.querySelector('.Polaris-IndexTable'),
  ).toBeInTheDocument();
}

const mockContracts = [
  {
    id: 'gid://shopify/SubscriptionContract/5',
    customer: {
      displayName: 'John Doe',
    },
    status: SubscriptionContractStatus.Active,
    deliveryPolicy: {
      interval: 'DAY',
      intervalCount: 1,
    },
    lineCount: 1,
    lines: [
      {
        title: 'Incredible Concrete Pants',
      },
    ],
    totalPrice: {
      amount: 9.99,
      currencyCode: 'CAD',
    },
  },
  {
    id: 'gid://shopify/SubscriptionContract/3',
    customer: {
      displayName: 'John Doe',
    },
    status: SubscriptionContractStatus.Cancelled,
    deliveryPolicy: {
      interval: 'DAY',
      intervalCount: 1,
    },
    lineCount: 1,
    lines: [
      {
        productId: 'gid://shopify/Product/2',
        title: 'Incredible Concrete Pants',
      },
    ],
    totalPrice: {
      amount: 9.99,
      currencyCode: 'CAD',
    },
  },
  {
    id: 'gid://shopify/SubscriptionContract/2',
    customer: {
      displayName: 'John Doe',
    },
    status: SubscriptionContractStatus.Paused,
    deliveryPolicy: {
      interval: 'DAY',
      intervalCount: 1,
    },
    lineCount: 1,
    lines: [{title: 'Incredible Concrete Pants'}],
    totalPrice: {
      amount: 9.99,
      currencyCode: 'CAD',
    },
  },
  {
    id: 'gid://shopify/SubscriptionContract/7',
    customer: {
      displayName: 'John Doe',
    },
    status: SubscriptionContractStatus.Failed,
    deliveryPolicy: {
      interval: 'DAY',
      intervalCount: 1,
    },
    lineCount: 1,
    lines: [
      {
        title: 'Incredible Concrete Pants',
      },
    ],
    totalPrice: {
      amount: 9.99,
      currencyCode: 'CAD',
    },
  },
] as SubscriptionContractListItem[];

describe('<ContractsTable />', () => {
  const defaultProps = {
    contracts: mockContracts,
    selectedResources: [],
    allResourcesSelected: false,
    handleSelectionChange: vi.fn(),
    openExportModal: vi.fn(),
  };

  it('renders table with a contract rows and column headers', async () => {
    await mountContractsTable({props: defaultProps});

    // includes headers
    expect(screen.getAllByRole('row')).length(5);
    // includes checkbox column
    expect(screen.getAllByRole('columnheader')).length(7);
  });

  it('renders table filters', async () => {
    await mountContractsTable({props: defaultProps});
    const allBtn = document.querySelector('#all');
    const activeBtn = document.querySelector('#active');
    const pausedBtn = document.querySelector('#paused');
    const cancelledBtn = document.querySelector('#cancelled');

    expect(allBtn).toHaveTextContent('All');
    expect(activeBtn)?.toHaveTextContent('Active');
    expect(pausedBtn).toHaveTextContent('Paused');
    expect(cancelledBtn).toHaveTextContent('Cancelled');
  });

  describe('when row selected', () => {
    it('calls handleSelectionChange', async () => {
      await mountContractsTable({props: defaultProps});
      const tableCheckboxes = screen.getAllByRole('checkbox');
      const firstRowCheckbox = tableCheckboxes.find(
        (c) => c.id === `Select-${mockContracts[0].id}`,
      );

      if (firstRowCheckbox) {
        await userEvent.click(firstRowCheckbox);
        expect(defaultProps.handleSelectionChange).toHaveBeenCalledOnce();
      }
    });
  });

  describe('when selectedResource has value', () => {
    it('renders checkboxes as checked', async () => {
      await mountContractsTable({
        props: {...defaultProps, selectedResources: [mockContracts[0].id]},
      });

      const tableCheckboxes = screen.getAllByRole('checkbox');
      const firstRowCheckbox = tableCheckboxes.find(
        (c) => c.id === `Select-${mockContracts[0].id}`,
      );

      expect(firstRowCheckbox).toBeChecked();
    });
  });

  describe('when navigation state is loading', () => {
    it('renders a spinner in <IndexFilters />', async () => {
      useNavigationMock.mockReturnValue({
        state: 'loading',
                location: {pathname: '/app'},      });
      await mountContractsTable({
        props: {...defaultProps},
      });

      const spinner = document.querySelector('.Polaris-Spinner');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('when searchParams are set', () => {
    it('sets matching view tab', async () => {
      const searchParams = 'savedView=active';
      await mountContractsTable({props: defaultProps, searchParams});

      const activeBtn = document.querySelector('#active');

      expect(activeBtn).toHaveAttribute('aria-selected');
    });

    it('sets view tab as all when no url param', async () => {
      const searchParams = '';
      await mountContractsTable({props: defaultProps, searchParams});

      const allBtn = document.querySelector('#all');

      expect(allBtn).toHaveAttribute('aria-selected');
    });
  });

  describe('when there are no contracts in saved view', () => {
    it('shows an empty state', async () => {
      const searchParams = 'savedView=paused';
      await mountContractsTable({
        props: {
          ...defaultProps,
          contracts: [],
        },
        searchParams,
      });

      expect(
        screen.getByText('No contracts with this status'),
      ).toBeInTheDocument();
    });
  });

  describe('displays badge based on contract status', () => {
    it('shows the appropriate state', async () => {
      await mountContractsTable({props: defaultProps});

      const rows = screen.getAllByRole('row')
      mockContracts.forEach((mockContract, index) => {
        const row = rows[index+1]
        // assert
        switch(mockContract.status) {
            case SubscriptionContractStatus.Active:
            case SubscriptionContractStatus.Failed:
              within(row).getByText('Active');
              break;
            case SubscriptionContractStatus.Paused:
              within(row).getByText('Paused');
              break;
            case SubscriptionContractStatus.Cancelled:
              within(row).getByText('Cancelled');
              break;
            case SubscriptionContractStatus.Expired:
              within(row).getByText('Expired');
              break;
            case SubscriptionContractStatus.Stale:
              within(row).getByText('Stale');
              break;
            default:
              fail();
          }
      })
    });
  });
});
