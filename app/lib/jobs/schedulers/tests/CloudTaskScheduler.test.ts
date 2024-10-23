import {afterEach, describe, expect, it, vi} from 'vitest';
import {CloudTaskScheduler, JobRunner} from '~/lib/jobs';
import {logger} from '~/utils/logger.server';

import {ExampleJob} from '../../tests/fixtures/ExampleJob';
import {config} from './fixtures/config';

import {CloudTasksClient} from '@google-cloud/tasks';
import {DateTime, Duration} from 'luxon';
import 'node:crypto';

vi.mock('@google-cloud/tasks', (original) => {
  const CloudTasksClient = vi.fn();

  CloudTasksClient.prototype.queuePath = vi
    .fn()
    .mockReturnValue('subscriptions-app/us-central/queue-default');

  CloudTasksClient.prototype.taskPath = vi
    .fn()
    .mockReturnValue(
      'subscriptions-app/us-central/queue-default/tasks/ExampleJob-417f5f5d-61c3-4c07-911f-d8ac051c0a61',
    );

  CloudTasksClient.prototype.createTask = vi.fn();

  return {...original, CloudTasksClient};
});

vi.mock('node:crypto', (original) => {
  const randomUUID = vi
    .fn()
    .mockReturnValue('417f5f5d-61c3-4c07-911f-d8ac051c0a61');

  return {default: {...original, randomUUID}};
});

describe('CloudTaskScheduler', () => {
  afterEach(async () => {
    vi.restoreAllMocks();
  });

  it('creates a cloud task', async () => {
    const scheduler = new CloudTaskScheduler(logger, config);
    const runner = new JobRunner<CloudTaskScheduler>(scheduler, logger);

    runner.register(ExampleJob);

    const client = new CloudTasksClient();

    const job = new ExampleJob({shop: 'example.myshopify.com'});
    await runner.enqueue(job);

    expect(client.createTask).toHaveBeenCalledWith({
      parent: 'subscriptions-app/us-central/queue-default',
      task: {
        httpRequest: {
          body: Buffer.from(JSON.stringify(job)).toString('base64'),
          headers: {
            'content-type': 'application/json',
          },
          httpMethod: 'POST',
          oidcToken: {
            audience: 'http://localhost/',
            serviceAccountEmail: 'serviceaccount@iam.google.com',
          },
          url: 'http://localhost/internal/jobs/run',
        },
        name: 'subscriptions-app/us-central/queue-default/tasks/ExampleJob-417f5f5d-61c3-4c07-911f-d8ac051c0a61',
      },
    });
  });

  it('creates a job scheduled at...', async () => {
    const scheduler = new CloudTaskScheduler(logger, config);
    const runner = new JobRunner<CloudTaskScheduler>(scheduler, logger);

    runner.register(ExampleJob);

    const client = new CloudTasksClient();

    const job = new ExampleJob({shop: 'example.myshopify.com'});
    await runner.enqueue(job, {
      scheduleTime: {
        seconds: DateTime.utc(2024, 4, 3, 11, 12, 0).toUnixInteger(),
      },
    });

    expect(client.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        task: expect.objectContaining({scheduleTime: {seconds: 1712142720}}),
      }),
    );
  });

  it('creates a job with dispatch deadline', async () => {
    const scheduler = new CloudTaskScheduler(logger, config);
    const runner = new JobRunner<CloudTaskScheduler>(scheduler, logger);

    runner.register(ExampleJob);

    const client = new CloudTasksClient();

    const job = new ExampleJob({shop: 'example.myshopify.com'});
    await runner.enqueue(job, {
      dispatchDeadline: {
        seconds: Duration.fromObject({minutes: 30}).as('seconds'),
      },
    });

    expect(client.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        task: expect.objectContaining({
          dispatchDeadline: {seconds: 1800},
        }),
      }),
    );
  });
});
