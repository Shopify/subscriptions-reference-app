import type {Logger} from 'pino';
import type {Job} from '~/lib/jobs';

type Timestamp = {
  seconds: number;
};

type Duration = {
  seconds: number;
};

export type SchedulerOptions = Partial<{
  scheduleTime: Timestamp;
  dispatchDeadline: Duration;
}>;

export abstract class Scheduler<R> {
  logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger.child({
      scheduler: this.constructor.name,
    });
  }

  /**
   * @param {Job} job
   * @param {SchedulerOptions} options
   * @param {Timestamp} options.scheduleTime unix timestamp to run the job at (ignored when using InlineScheduler)
   * @param {Duration} options.dispatchDeadline duration to allow to job to run for before retrying (default: {seconds: 600}, max {seconds: 1800})
   */
  abstract enqueue(job: Job, options: SchedulerOptions): Promise<R>;
}
