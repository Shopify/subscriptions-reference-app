import {Job} from '~/lib/jobs';

type ExampleParams = {
  shop: string;
};

export let exampleJobCounter: number = 0;

export class ExampleJob extends Job<ExampleParams> {
  async perform() {
    this.logger.debug('Running ExampleJob#perform');
    exampleJobCounter += 1;
  }
}
