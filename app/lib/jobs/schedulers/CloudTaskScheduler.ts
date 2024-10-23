import type {Logger} from 'pino';
import type {Job} from '../Job';

import {randomUUID} from 'node:crypto';

import {Scheduler, type SchedulerOptions} from './Scheduler';

import {CloudTasksClient, protos} from '@google-cloud/tasks';
import ITask = protos.google.cloud.tasks.v2.ITask;

export type CloudTaskSchedulerConfig = {
  location: string;
  projectId: string;
  queuePrefix: string;
  callbackUrl: string;
  serviceAccountEmail: string;
  audience: string;
};

export class CloudTaskScheduler extends Scheduler<void> {
  client: CloudTasksClient;
  config: CloudTaskSchedulerConfig;

  constructor(logger: Logger, config: CloudTaskSchedulerConfig) {
    super(logger);

    this.client = new CloudTasksClient();
    this.config = config;

    this.logger.info({config}, 'Initialized CloudTaskScheduler with config');
  }

  async enqueue(job: Job, options: SchedulerOptions = {}) {
    this.logger.info({job, options}, 'Enqueuing job');

    const {
      callbackUrl,
      serviceAccountEmail,
      audience,
      projectId,
      location,
      queuePrefix,
    } = this.config;

    const queueName = `${queuePrefix}-${job.queue}`;
    const taskName = `${job.jobName}-${randomUUID()}`;

    const task: ITask = {
      httpRequest: {
        url: callbackUrl,
        body: Buffer.from(JSON.stringify(job)).toString('base64'),
        httpMethod: 'POST',
        oidcToken: {
          serviceAccountEmail,
          audience,
        },
        headers: {
          'content-type': 'application/json',
        },
      },
      name: this.client.taskPath(projectId, location, queueName, taskName),
    };

    const {scheduleTime, dispatchDeadline} = options;

    if (scheduleTime) {
      task.scheduleTime = scheduleTime;
    }

    if (dispatchDeadline) {
      task.dispatchDeadline = dispatchDeadline;
    }

    await this.client.createTask({
      parent: this.client.queuePath(
        projectId,
        location,
        `${queuePrefix}-${job.queue}`,
      ),
      task,
    });
  }
}
