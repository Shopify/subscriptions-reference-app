import {mockShopifyServer, mountRemixStubWithAppContext} from '#/test-utils';
import {screen} from '@testing-library/react';
import {beforeEach, describe, expect, it} from 'vitest';
import {mockedSellingPlanGroupsResponse} from './Fixtures';
import {mockShopify} from '#/setup-app-bridge';

import PlansIndex, {action, loader} from '../route';
import userEvent from '@testing-library/user-event';

const {graphQL, mockGraphQL} = mockShopifyServer();

describe('Subscriptions index page', () => {
  beforeEach(() => {
    graphQL.mockRestore();
  });

  it('renders the subscriptions page title', async () => {
    await mountSellingPlansList();

    expect(screen.getByText('Subscription plans')).toBeInTheDocument();
  });

  it('renders the table view if subscriptions exist', async () => {
    await mountSellingPlansList();

    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('renders the correct merchant title in the selling plan table', async () => {
    await mountSellingPlansList();

    expect(screen.getByText('subscribe-and-save')).toBeInTheDocument();
  });

  it('triggers a navigation to the create plan page when the primary action button is clicked', async () => {
    await mountSellingPlansList();

    await userEvent.click(screen.getByText('Create new plan'));

    expect(
      await screen.findByText('Create subscription plan'),
    ).toBeInTheDocument();
  });

  it('displays the empty state message when there are no subscription plans', async () => {
    mockGraphQL({
      ...mockedSellingPlanGroupsResponse,
      SellingPlanGroups: {
        data: {
          sellingPlanGroups: {
            edges: [],
            pageInfo: {},
          },
        },
      },
    });
    await mountSellingPlansList({skipGraphQLMock: true});

    expect(screen.getByText('Create a subscription plan')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Create a subscription plan to allow your customers to purchase products or services on a recurring basis with a single checkout experience.',
      ),
    ).toBeInTheDocument();
  });

  it('displays plan deleted toast when the planDeleted search param is present', async () => {
    await mountSellingPlansList({searchParams: 'planDeleted=true'});

    expect(mockShopify.toast.show).toHaveBeenCalledWith(
      'Subscription plan deleted',
      {isError: false},
    );
  });

  it('renders correct footer text', async () => {
    await mountSellingPlansList();

    expect(screen.getByText('Learn more about')).toBeInTheDocument();
    expect(
      screen.getByRole('link', {name: 'subscription plans'}),
    ).toBeInTheDocument();
  });

  it('renders correct footer link', async () => {
    await mountSellingPlansList();

    const link = screen.getByRole('link', {name: 'subscription plans'});
    expect(link).toHaveAttribute(
      'href',
      'https://help.shopify.com/en/manual/products/purchase-options/shopify-subscriptions/setup',
    );
  });
});

async function mountSellingPlansList({
  skipGraphQLMock = false,
  searchParams = '',
} = {}) {
  if (!skipGraphQLMock) {
    mockGraphQL(mockedSellingPlanGroupsResponse);
  }

  mountRemixStubWithAppContext({
    routes: [
      {
        path: '/app/plans',
        Component: () => <PlansIndex />,
        loader,
        action,
      },
      {
        path: '/app/plans/create',
        Component: () => <div>Create subscription plan</div>,
      },
    ],
    remixStubProps: {
      initialEntries: [`/app/plans?${searchParams || ''}`],
    },
  });

  return await screen.findByText('Subscription plans');
}
