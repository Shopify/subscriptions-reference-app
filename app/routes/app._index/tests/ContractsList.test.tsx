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
import {createMockSubscriptionContractsQuery} from './fixtures';

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
    it('loads contracts based on saved view tab', async () => {
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

    it.skip('updates saved view tab when clicking on a tab', async () => {
      await mountContractsList();

      await userEvent.click(screen.getByRole('tab', {name: 'Active'}));

      await waitForGraphQL();

      expect(graphQL).toHavePerformedGraphQLOperation(
        SubscriptionContractsQuery,
        {
          variables: {
            query: 'status:ACTIVE OR status:FAILED',
          },
        },
      );
    });

    it.skip('does not clear sort order param when clicking a saved view tab', async () => {
      await mountContractsList({
        initialPath: '/app/contracts?order=updated_at asc',
      });

      userEvent.click(screen.getByText('Paused'));

      await waitForGraphQL();

      expect(graphQL).toHavePerformedGraphQLOperation(
        SubscriptionContractsQuery,
        {
          variables: {
            sortKey: 'UPDATED_AT',
            reverse: false,
            query: 'status:PAUSED',
          },
        },
      );
    });

    it.skip('clears pagination variables when changing saved view tab', async () => {
      await mountContractsList({
        initialPath: '/app/contracts?after=123',
      });

      userEvent.click(screen.getByText('Paused'));

      await waitForGraphQL();

      expect(graphQL).toHavePerformedGraphQLOperation(
        SubscriptionContractsQuery,
        {
          variables: {
            after: null,
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
