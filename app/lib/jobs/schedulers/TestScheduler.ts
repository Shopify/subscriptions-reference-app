import type {Logger} from 'pino';
import type {Job} from '../Job';
import type {SchedulerOptions} from './Scheduler';
import {Scheduler} from './Scheduler';

export class TestScheduler extends Scheduler<Request> {
  public jobs: Array<Job>;

  constructor(logger: Logger) {
    super(logger);

    this.jobs = [];
  }
  async enqueue(job: Job, options: SchedulerOptions = {}) {
    this.logger.debug({job, options}, 'Enqueuing job');
    this.jobs.push(job);

    const request = new Request('http://localhost/internal/tasks/run', {
      method: 'POST',
      body: Buffer.from(JSON.stringify(job)),
      headers: {'content-type': 'application/json'},
    });

    return request;
  }

  clear(): void {
    this.jobs = [];
  }
}
