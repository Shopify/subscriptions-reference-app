import {
  mockShopifyServer,
  mountRemixStubWithAppContext,
  waitForGraphQL,
} from '#/test-utils';
import {screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it} from 'vitest';

import userEvent from '@testing-library/user-event';
import SubscriptionContractsQuery from '~/graphql/SubscriptionContractsQuery';
import ContractsList, {loader} from '../route';
import {
  createMockSubscriptionContractsQuery,
  createMockSubscriptionContractsQueryContract,
} from './fixtures';
import {composeGid} from '@shopify/admin-graphql-api-utilities';

const {graphQL, mockGraphQL} = mockShopifyServer();

const defaultContractsListResponses = {
  SubscriptionContracts: {
    data: createMockSubscriptionContractsQuery(),
  },
};

async function mountContractsList({
  initialPath = '/app/contracts',
  contractsListResponses,
}: {
  initialPath?: string;
  contractsListResponses?: any;
} = {}) {
  mockGraphQL(contractsListResponses || defaultContractsListResponses);

  mountRemixStubWithAppContext({
    routes: [
      {
        path: '/app/contracts',
        Component: () => <ContractsList />,
        loader,
      },
    ],
    remixStubProps: {
      initialEntries: [initialPath],
    },
  });

  return await screen.findByText('Subscription contracts');
}

describe('ContractsList', () => {
  beforeEach(() => {
    graphQL.mockRestore();
  });
  it('renders the contracts list', async () => {
    await mountContractsList();

    expect(screen.getByText('Subscription contracts')).toBeInTheDocument();
  });

  it('renders a the table view if contracts exist', async () => {
    await mountContractsList();

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).length(2); // 1 contracts rows + header
  });

  it('renders a the empty state when there are no contracts', async () => {
    await mountContractsList({
      contractsListResponses: {
        SubscriptionContracts: {
          data: createMockSubscriptionContractsQuery({
            contractEdges: [],
          }),
        },
      },
    });

    expect(
      screen.getByText('Manage your subscription contracts'),
    ).toBeInTheDocument();
  });

  it('renders no contracts with this status view when search returns no contracts', async () => {
    await mountContractsList({
      contractsListResponses: {
        SubscriptionContracts: {
          data: createMockSubscriptionContractsQuery({
            contractEdges: [],
          }),
        },
      },
      initialPath: '/app/contracts?savedView=paused',
    });

    expect(
      screen.getByText('No contracts with this status'),
    ).toBeInTheDocument();
  });

  describe('<ContractsTable />', () => {
    it('renders all column headers', async () => {
      await mountContractsList();

      const expectedColumns = [
        'Contract',
        'Customer',
        'Product',
        'Price',
        'Delivery Frequency',
        'Status',
      ];

      expectedColumns.forEach((columnName) => {
        expect(
          screen.getByRole('columnheader', {
            name: columnName,
          }),
        ).toBeInTheDocument();
      });
    });

    it('renders one row for each contract returned', async () => {
      await mountContractsList({
        contractsListResponses: {
          SubscriptionContracts: {
            data: createMockSubscriptionContractsQuery({
              contractEdges: [
                {
                  node: createMockSubscriptionContractsQueryContract({
                    id: composeGid('SubscriptionContract', 1),
                  }),
                },
                {
                  node: createMockSubscriptionContractsQueryContract({
                    id: composeGid('SubscriptionContract', 2),
                  }),
                },
                {
                  node: createMockSubscriptionContractsQueryContract({
                    id: composeGid('SubscriptionContract', 3),
                  }),
                },
              ],
            }),
          },
        },
      });

      expect(screen.getAllByRole('row')).length(4); // 3 contracts rows + header
    });

    it('renders context of each cell based on the contract', async () => {
      const mockContract = createMockSubscriptionContractsQueryContract();
      await mountContractsList({
        contractsListResponses: {
          SubscriptionContracts: {
            data: createMockSubscriptionContractsQuery({
              contractEdges: [
                {
                  node: mockContract,
                },
              ],
            }),
          },
        },
      });

      const cells = screen.getAllByRole('cell');

      expect(cells[1]).toHaveTextContent('1');
      expect(cells[2]).toHaveTextContent('');
      expect(cells[3]).toHaveTextContent('John Doe');
      expect(cells[4]).toHaveTextContent('Mexican Coffee');
      expect(cells[5]).toHaveTextContent('$20.00');
      expect(cells[6]).toHaveTextContent('Every month');
      expect(cells[7]).toHaveTextContent('Active');
    });

    it('renders failed contracts as active', async () => {
      const mockContract = createMockSubscriptionContractsQueryContract({
        status: 'FAILED' as any,
      });

      await mountContractsList({
        contractsListResponses: {
          SubscriptionContracts: {
            data: createMockSubscriptionContractsQuery({
              contractEdges: [
                {
                  node: mockContract,
                },
              ],
            }),
          },
        },
      });

      const cells = screen.getAllByRole('cell');

      expect(cells[7]).toHaveTextContent('Active');
    });
  });

  describe('bulk actions', () => {
    it('renders the pause bulk action when at least one contract is selected', async () => {
      await mountContractsList();

      await userEvent.click(
        screen.getAllByRole('checkbox', {name: /select contract/i})[0],
      );

      expect(
        screen.getAllByRole('button', {name: 'Pause contract'})[0],
      ).toBeInTheDocument();
    });

    it('opens pause bulk action modal when button is clicked', async () => {
      await mountContractsList();

      await userEvent.click(
        screen.getAllByRole('checkbox', {name: /select contract/i})[0],
      );

      await userEvent.click(
        screen.getAllByRole('button', {name: 'Pause contract'})[0],
      );

      expect(screen.getByText('Set 1 contract as paused?')).toBeInTheDocument();
    });

    it('does not render pause bulk action modal by default', async () => {
      await mountContractsList();

      await userEvent.click(
        screen.getAllByLabelText('Select all Contracts')[0],
      );

      expect(
        screen.queryByText('Set 1 contract as paused?'),
      ).not.toBeInTheDocument();
    });
  });

  describe('sorting', () => {
    it('sorts contracts by most recently created by default', async () => {
      await mountContractsList();

      expect(graphQL).toHavePerformedGraphQLOperation(
        SubscriptionContractsQuery,
        {
          variables: {
            sortKey: 'CREATED_AT',
            reverse: true,
          },
        },
      );
    });

    it('sorts contracts based on URL param', async () => {
      await mountContractsList({
        initialPath: '/app/contracts?order=updated_at asc',
      });

      expect(graphQL).toHavePerformedGraphQLOperation(
        SubscriptionContractsQuery,
        {
          variables: {
            sortKey: 'UPDATED_AT',
            reverse: false,
          },
        },
      );
    });

    it('loads new sort order when changing order in the UI', async () => {
      await mountContractsList();

      userEvent.click(screen.getByLabelText('Sort the results'));

      await waitFor(() => {
        expect(screen.getByLabelText('Updated')).toBeInTheDocument();
      });

      userEvent.click(screen.getByLabelText('Updated'));

      await waitForGraphQL();

      expect(graphQL).toHavePerformedGraphQLOperation(
        SubscriptionContractsQuery,
        {
          variables: {
            sortKey: 'UPDATED_AT',
            reverse: true,
          },
        },
      );
    });

    it('keeps existing saved view param when updating sort order', async () => {
      await mountContractsList({
        initialPath: '/app/contracts?savedView=active',
      });

      userEvent.click(screen.getByLabelText('Sort the results'));

      await waitFor(() => {
        expect(screen.getByLabelText('Updated')).toBeInTheDocument();
      });

      userEvent.click(screen.getByLabelText('Updated'));

      await waitForGraphQL();

      expect(graphQL).toHavePerformedGraphQLOperation(
        SubscriptionContractsQuery,
        {
          variables: {
            sortKey: 'UPDATED_AT',
            reverse: true,
            query: 'status:ACTIVE OR status:FAILED',
          },
        },
      );
    });

    it('clears pagination variables when changing sort order', async () => {
      await mountContractsList({
        initialPath: '/app/contracts?after=123',
      });

      userEvent.click(screen.getByLabelText('Sort the results'));

      await waitFor(() => {
        expect(screen.getByLabelText('Updated')).toBeInTheDocument();
      });

      userEvent.click(screen.getByLabelText('Updated'));

      await waitForGraphQL();

      expect(graphQL).toHavePerformedGraphQLOperation(
        SubscriptionContractsQuery,
        {
          variables: {
            sortKey: 'UPDATED_AT',
            reverse: true,
            after: null,
          },
        },
      );
    });
  });

  describe('saved view tabs', () => {
    it('renders saved view tabs', async () => {
      await mountContractsList();

      expect(screen.getAllByRole('tab', {name: 'All'})[0]).toBeInTheDocument();
      expect(screen.getByRole('tab', {name: 'Active'})).toBeInTheDocument();
      expect(screen.getByRole('tab', {name: 'Paused'})).toBeInTheDocument();
      expect(screen.getByRole('tab', {name: 'Canceled'})).toBeInTheDocument();
    });

    it('loads with no filtering by default', async () => {
      await mountContractsList({
        initialPath: '/app/contracts',
      });

      expect(graphQL).toHavePerformedGraphQLOperation(
        SubscriptionContractsQuery,
        {
          variables: {
            query: '',
          },
        },
      );
    });

    it('loads active and failed contracts for active tab', async () => {
      await mountContractsList({
        initialPath: '/app/contracts?savedView=active',
      });

      expect(graphQL).toHavePerformedGraphQLOperation(
        SubscriptionContractsQuery,
        {
          variables: {
            query: 'status:ACTIVE OR status:FAILED',
          },
        },
      );
    });

    it('loads active and failed contracts for active tab', async () => {
      await mountContractsList({
        initialPath: '/app/contracts?savedView=active',
      });

      expect(graphQL).toHavePerformedGraphQLOperation(
        SubscriptionContractsQuery,
        {
          variables: {
            query: 'status:ACTIVE OR status:FAILED',
          },
        },
      );
    });

    it('loads canceled contracts for active tab', async () => {
      await mountContractsList({
        initialPath: '/app/contracts?savedView=cancelled',
      });

      expect(graphQL).toHavePerformedGraphQLOperation(
        SubscriptionContractsQuery,
        {
          variables: {
            query: 'status:CANCELLED',
          },
        },
      );
    });
  });

  describe('footer', () => {
    beforeEach(async () => {
      await mountContractsList();
    });
    it('renders correct text', async () => {
      expect(screen.getByText('Learn more about')).toBeInTheDocument();
      expect(
        screen.getByRole('link', {name: 'subscription contracts'}),
      ).toBeInTheDocument();
    });

    it('renders correct link', async () => {
      const link = screen.getByRole('link', {name: 'subscription contracts'});
      expect(link).toHaveAttribute(
        'href',
        'https://help.shopify.com/en/manual/products/purchase-options/shopify-subscriptions/manage-subscriptions',
      );
    });
  });
});
