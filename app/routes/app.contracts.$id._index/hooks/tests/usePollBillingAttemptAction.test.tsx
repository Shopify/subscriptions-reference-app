import {
  mockShopifyServer,
  mountRemixStubWithAppContext,
  wait,
} from '#/test-utils';
import {describe, expect, it, vi, beforeEach} from 'vitest';
import {
  action as pollBillAttemptAction,
  shouldRevalidate,
} from '../../../app.contracts.$id.poll-bill-attempt/route';
import {usePollBillingAttemptAction} from '~/routes/app.contracts.$id._index/hooks/usePollBillingAttemptAction';
import {screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {useCallback} from 'react';

const {graphQL, mockGraphQL, sequentiallyMockGraphQL} = mockShopifyServer();

function mountTestComponent() {
  mountRemixStubWithAppContext({
    routes: [
      {
        path: '/app/contracts/:id/poll-bill-attempt',
        action: pollBillAttemptAction,
        shouldRevalidate,
      },
      {path: '/app/contracts/:id', Component: PollingTestComponent},
    ],
    remixStubProps: {
      initialEntries: ['/app/contracts/1'],
    },
  });
}

const mockDoneCallback = vi.fn();

function PollingTestComponent() {
  const startPolling = usePollBillingAttemptAction({
    onDoneCallback: useCallback(() => mockDoneCallback(), []),
  });

  return (
    <button
      onClick={() => startPolling('gid://shopify/SubscriptionBillingAttempt/1')}
    >
      Poll
    </button>
  );
}

function generateSubscriptionBillingAttemptResponse(ready: boolean) {
  return {
    SubscriptionBillingAttempt: {
      data: {
        subscriptionBillingAttempt: {
          id: 'gid://shopify/SubscriptionBillingAttempt/1',
          originTime: new Date().toISOString(),
          ready: ready,
          subscriptionContract: {
            id: 'gid//shopify/SubscriptionContract/1',
          },
        },
      },
    },
  };
}

describe('#usePollBillingAttemptAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should stop polling when billing attempt is complete', async () => {
    sequentiallyMockGraphQL([
      generateSubscriptionBillingAttemptResponse(false),
      generateSubscriptionBillingAttemptResponse(true),
    ]);
    mountTestComponent();

    await userEvent.click(screen.getByText('Poll'));

    await wait(3000);

    expect(graphQL).toHaveBeenCalledTimes(2);
    expect(mockDoneCallback).toHaveBeenCalledTimes(1);
  });

  it('should not stop polling if billing attempt is not complete', async () => {
    mockGraphQL(generateSubscriptionBillingAttemptResponse(false));
    mountTestComponent();

    await userEvent.click(screen.getByText('Poll'));

    await wait(2100);

    expect(graphQL).toHaveBeenCalledTimes(2);
    expect(mockDoneCallback).not.toHaveBeenCalled();
  });
});
