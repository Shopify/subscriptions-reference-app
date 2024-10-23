import {mockApis} from 'tests/mocks/api';
import {mockUiExtensionComponents} from 'tests/mocks/components';
import {beforeEach} from 'vitest';
import {screen} from '@testing-library/react';
import {mountWithAppContext} from 'tests/utilities';

import {OrderActionMenuItemExtension} from '../OrderActionMenuItem';

const {mockExtensionApi, mockCustomerApiGraphQL} = mockApis();

describe('OrderActionMenuItemExtension', () => {
  beforeEach(() => {
    mockExtensionApi();
    mockUiExtensionComponents();
  });

  it('renders a button to manage a subscription when there is a single non-cancelled contract', async () => {
    mockGraphqlResponse(1);
    await mountWithAppContext(<OrderActionMenuItemExtension />);

    const button = screen.getByRole('button', {name: 'Manage subscription'});
    expect(button).toBeInTheDocument();
  });

  it('renders a button to manage subscriptions when there are multiple non-cancelled contracts', async () => {
    mockGraphqlResponse(2);
    await mountWithAppContext(<OrderActionMenuItemExtension />);

    const button = screen.getByRole('button', {name: 'Manage subscriptions'});
    expect(button).toBeInTheDocument();
  });

  it('does not render anything when no subscription contracts are present', async () => {
    mockGraphqlResponse(0);
    await mountWithAppContext(<OrderActionMenuItemExtension />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

function mockGraphqlResponse(contractCount: number = 0) {
  mockCustomerApiGraphQL({
    data: {
      order: {
        subscriptionContracts: {
          edges: Array.from({length: contractCount}, (_, index) => ({
            node: {
              id: `gid://shopify/SubscriptionContract/${index + 1}`,
              status: 'ACTIVE',
            },
          })),
        },
      },
    },
  });
}
