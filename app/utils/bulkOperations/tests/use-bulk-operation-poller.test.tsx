import {
  mockShopifyServer,
  mountRemixStubWithAppContext,
  wait,
} from '#/test-utils';
import {
  MAX_ATTEMPTS,
  useBulkOperationPoller,
} from '../use-bulk-operation-polller';
import {
  loader as bulkOperationLoader,
  shouldRevalidate,
} from '~/routes/app.bulk-operation';
import {screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {mockShopify} from '#/setup-app-bridge';

const {graphQL, mockGraphQL, sequentiallyMockGraphQL} = mockShopifyServer();

function generateBulkOperationResponse(status: string) {
  return {
    CurrentBulkOperation: {
      data: {
        currentBulkOperation: {
          id: '123',
          status,
        },
      },
    },
  };
}

function mountTestComponent() {
  mountRemixStubWithAppContext({
    routes: [
      {
        path: '/app/bulk-operation',
        loader: bulkOperationLoader,
        shouldRevalidate,
      },
      {path: '/app/contracts', Component: TestComponent},
    ],
    remixStubProps: {
      initialEntries: ['/app/contracts'],
    },
  });
}

function TestComponent() {
  const {pollBulkOperation} = useBulkOperationPoller();

  return <button onClick={() => pollBulkOperation()}>Poll</button>;
}

describe('useBulkOperationPoller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls the fetcher on an interval until the bulk operation is completed', async () => {
    sequentiallyMockGraphQL([
      generateBulkOperationResponse('RUNNING'),
      generateBulkOperationResponse('RUNNING'),
      generateBulkOperationResponse('RUNNING'),
      generateBulkOperationResponse('COMPLETED'),
    ]);

    mountTestComponent();

    await userEvent.click(screen.getByText('Poll'));

    await wait(6000);

    expect(graphQL).toHaveBeenCalledTimes(4);
  }, 10000);

  it('shows a toast when the bulk operation is completed', async () => {
    sequentiallyMockGraphQL([
      generateBulkOperationResponse('RUNNING'),
      generateBulkOperationResponse('COMPLETED'),
    ]);

    mountTestComponent();

    await userEvent.click(screen.getByText('Poll'));

    await wait(6000);

    expect(mockShopify.toast.show).toHaveBeenCalledWith(
      'Bulk operation completed',
    );
  }, 10000);

  it('stops polling after the the max attempts is reached', async () => {
    mockGraphQL(generateBulkOperationResponse('RUNNING'));

    mountTestComponent();

    await userEvent.click(screen.getByText('Poll'));

    await wait(15000);

    expect(graphQL).toHaveBeenCalledTimes(MAX_ATTEMPTS);
  }, 20000);
});
