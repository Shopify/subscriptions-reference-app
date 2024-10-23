import {Factory} from 'fishery';
import {billingAttempt} from './SubscriptionBillingAttempt';
import {contract} from './SubscriptionContract';

interface BillingCycleTransientParams {
  billingAttempts?: Array<any>;
  billingAttemptsCount?: number;
}

export const billingCycle = Factory.define<any, BillingCycleTransientParams>(
  ({sequence, transientParams}) => {
    const {
      billingAttempts = billingAttempt.buildList(
        transientParams.billingAttemptsCount ?? 1,
      ),
    } = transientParams;

    return {
      cycleIndex: sequence,
      status: 'UNBILLED',
      billingAttemptExpectedDate: '2023-11-30T12:00:00Z',
      billingAttempts: {
        edges: billingAttempts.map((node) => ({node, cursor: ''})),
        nodes: [],
        pageInfo: {hasNextPage: false, hasPreviousPage: false},
      },
      skipped: false,
      cycleStartAt: '2023-11-23T12:00:00Z',
      cycleEndAt: '2023-11-30T12:00:00Z',
      edited: false,
      sourceContract: contract.build(),
    };
  },
);
