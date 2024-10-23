import {screen} from '@testing-library/react';
import {mountComponentWithRemixStub} from '#/test-utils';
import {describe, expect, it} from 'vitest';
import {SubscriptionContractStatus} from '~/types';
import {StatusBadge} from './StatusBadge';

describe('Status Badge', () => {
  it.each([
    [SubscriptionContractStatus.Cancelled, 'Canceled'],
    [SubscriptionContractStatus.Paused, 'Paused'],
    [SubscriptionContractStatus.Failed, 'Failed'],
    [SubscriptionContractStatus.Expired, 'Expired'],
    [SubscriptionContractStatus.Active, 'Active'],
  ])(
    'should show the correct text with the status prop of %s',
    async (status, expected) => {
      mountComponentWithRemixStub(<StatusBadge status={status} />);

      expect(screen.getByText(expected)).toBeInTheDocument();
    },
  );
});
