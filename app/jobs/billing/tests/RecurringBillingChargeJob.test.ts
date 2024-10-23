import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {jobs} from '~/jobs';
import {
  RecurringBillingChargeJob,
  ScheduleShopsToChargeBillingCyclesJob,
} from '~/jobs/billing';

vi.mock('~/jobs', () => {
  const originalModule = vi.importActual('~/jobs');
  return {
    ...originalModule,
    jobs: {
      enqueue: vi.fn(),
    },
  };
});

describe('RecurringBillingChargeJob', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2023, 6, 14, 15, 10, 23));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('enqueues schedule jobs for billable shops', async () => {
    const enqueueSpy = vi.spyOn(jobs, 'enqueue');

    const job = new RecurringBillingChargeJob({});
    await job.perform();

    expect(enqueueSpy).toHaveBeenCalledOnce();
    expect(enqueueSpy).toHaveBeenCalledWith(
      new ScheduleShopsToChargeBillingCyclesJob({
        targetDate: '2023-07-14T15:00:00.000Z',
      }),
    );
  });
});
