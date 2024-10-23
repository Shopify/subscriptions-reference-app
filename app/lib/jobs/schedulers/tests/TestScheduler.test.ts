import {describe, expect, it} from 'vitest';
import {JobRunner, TestScheduler} from '~/lib/jobs';
import {logger} from '~/utils/logger.server';

import {ExampleJob} from '../../tests/fixtures/ExampleJob';

describe('TestScheduler', () => {
  it('stores jobs', async () => {
    const scheduler = new TestScheduler(logger);
    const runner = new JobRunner<TestScheduler, Request>(scheduler, logger);

    runner.register(ExampleJob);

    const job = new ExampleJob({shop: 'example.myshopify.com'});
    await runner.enqueue(job);

    expect(scheduler.jobs.length).toEqual(1);
    expect(Array.from(scheduler.jobs)).toEqual([job]);
  });

  it('clears stored jobs', async () => {
    const scheduler = new TestScheduler(logger);
    const runner = new JobRunner<TestScheduler, Request>(scheduler, logger);

    runner.register(ExampleJob);

    const job = new ExampleJob({shop: 'example.myshopify.com'});
    await runner.enqueue(job);

    expect(scheduler.jobs.length).toEqual(1);

    scheduler.clear();
    expect(scheduler.jobs.length).toEqual(0);
  });
});
