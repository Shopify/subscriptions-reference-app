import {describe, expect, it} from 'vitest';
import {InlineScheduler, JobRunner} from '~/lib/jobs';
import {logger} from '~/utils/logger.server';

import {ExampleJob, exampleJobCounter} from '../../tests/fixtures/ExampleJob';

describe('InlineScheduler', () => {
  it('runs the job immediately as a new instance', async () => {
    const scheduler = new InlineScheduler(logger);
    const runner = new JobRunner<InlineScheduler>(scheduler, logger);

    runner.register(ExampleJob);

    const job = new ExampleJob({shop: 'example.myshopify.com'});
    await runner.enqueue(job);

    expect(exampleJobCounter).toEqual(1);
  });
});
