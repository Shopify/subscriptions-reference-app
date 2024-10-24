import {isTerminal} from '~/lib/jobs/Job';
import type {Logger} from 'pino';
import type {Job, Scheduler, SchedulerOptions} from '~/lib/jobs';

type JobRegistryList = Map<string, Constructable<Job>>;

interface Constructable<T> extends Function {
  new (...args: any[]): T;
}

export class JobRunner<T extends Scheduler<R>, R = void> {
  logger: Logger;
  registry: JobRegistryList;
  scheduler: T;

  constructor(scheduler: T, logger: Logger) {
    this.scheduler = scheduler;
    this.logger = logger.child({
      class: 'JobRunner',
    });

    this.registry = new Map();
  }

  register(...classes: Constructable<Job>[]): JobRunner<T, R> {
    for (const klass of classes) {
      this.registry.set(klass.name, klass);
    }

    return this;
  }

  async enqueue(job, options: SchedulerOptions = {}): Promise<R> {
    return await this.scheduler.enqueue(job, options);
  }

  async execute(request: Request) {
    const payload = await request.json();
    const {jobName, parameters} = payload;
    this.logger.debug({jobName, parameters}, `Executing job from request`);

    try {
      const JobClass = this.registry.get(jobName);

      if (JobClass == null) {
        throw new Error(`Failed to find registered job ${jobName}`);
      }

      const instance = Reflect.construct(JobClass, [parameters]);

      await instance.run();
    } catch (err: any) {
      if (isTerminal(err)) return;

      this.logger.error(
        {error: err, jobName, payload},
        `Error running job ${jobName}`,
      );

      throw err;
    }
  }
}
