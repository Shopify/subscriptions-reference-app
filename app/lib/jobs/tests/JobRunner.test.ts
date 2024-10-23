import {describe, expect, it} from 'vitest';
import {JobRunner, TestScheduler} from '~/lib/jobs';
import {logger} from '~/utils/logger.server';

import {ExampleJob} from './fixtures/ExampleJob';

describe('JobRunner', () => {
  it('creates an instance with a scheduler', async () => {
    const scheduler = new TestScheduler(logger);
    const runner = new JobRunner<TestScheduler, Request>(scheduler, logger);

    expect(runner).toBeInstanceOf(JobRunner);
    expect(runner.scheduler).toBeInstanceOf(TestScheduler);
  });

  it('registers jobs', async () => {
    const scheduler = new TestScheduler(logger);
    const runner = new JobRunner<TestScheduler, Request>(scheduler, logger);

    runner.register(ExampleJob);

    expect(runner.registry.size).toEqual(1);
    expect(runner.registry.get('ExampleJob')).toEqual(ExampleJob);
  });

  it('enqueues a registered job', async () => {
    const scheduler = new TestScheduler(logger);
    const runner = new JobRunner<TestScheduler, Request>(scheduler, logger);

    runner.register(ExampleJob);

    const job = new ExampleJob({shop: 'example.myshopify.com'});

    await runner.enqueue(job);

    expect(scheduler.jobs.length).toEqual(1);
  });

  it('executes a registered job', async () => {
    const scheduler = new TestScheduler(logger);
    const runner = new JobRunner<TestScheduler, Request>(scheduler, logger);

    runner.register(ExampleJob);

    const job = new ExampleJob({shop: 'example.myshopify.com'});
    const request = await runner.enqueue(job);

    await runner.execute(request);
  });

  it('fails to execute a non-registered job', async () => {
    const scheduler = new TestScheduler(logger);
    const runner = new JobRunner<TestScheduler, Request>(scheduler, logger);

    const job = new ExampleJob({shop: 'example.myshopify.com'});
    const request = await runner.enqueue(job);

    expect(runner.execute(request)).rejects.toThrowError(
      'Failed to find registered job ExampleJob',
    );
  });
});
