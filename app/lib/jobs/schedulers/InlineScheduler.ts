import type {Job} from '../Job';
import type {SchedulerOptions} from './Scheduler';
import {Scheduler} from './Scheduler';

export class InlineScheduler extends Scheduler<void> {
  async enqueue(job: Job, options: SchedulerOptions = {}) {
    this.logger.debug({job, options}, 'Enqueuing job');

    // Construct a new instance of the job, similar to how JobRunning#execute
    // does it. We are doing this to more closely match the cloud scheduler logic.
    const body = JSON.stringify(job);
    const {parameters} = JSON.parse(body);
    const jobInstance = Reflect.construct(job.constructor, [parameters]) as Job;
    await jobInstance.run();
  }
}
