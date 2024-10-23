# Job Runner

## Basic usage

Define a job class, defining a `perform` function

```typescript
type ExampleParams = {
  shop: string;
};

class ExampleJob extends Job<ExampleParams> {
  perform() {
    this.logger.debug('Running ExampleJob');
  }
}
```

Initialize a job runner with a [scheduler](#schedulers)

```typescript
import {JobRunner} from '~/lib/jobs';
import {CloudTaskScheduler, InlineScheduler, TestScheduler} from '~/lib/jobs';

const scheduler = InlineScheduler(logger);
const runner = new JobRunner<InlineScheduler>(scheduler, logger);
```

Register your job classes

```typescript
runner.register(ExampleJob, AnotherJob);
```

Enqueue a job

```typescript
const job = new ExampleJob({shop: 'example.myshopify.com'});
await runner.enqueue(job);
```

## Schedulers

### Inline scheduler

Runs jobs immediately inline when enqueued – designed for local development

```typescript
const scheduler = InlineScheduler(logger);
const runner = new JobRunner<InlineScheduler>(scheduler, logger);
runner.register(ExampleJob);

const job = new ExampleJob({shop: 'example.myshopify.com'});
await runner.enqueue(job);
```

### Test scheduler

Stores enqueued jobs, allowing introspection – designed for use in tests

```typescript
const scheduler = TestScheduler(logger);
const runner = new JobRunner<TestScheduler, Request>(scheduler, logger);
runner.register(ExampleJob);

const job = new ExampleJob({shop: 'example.myshopify.com'});
```

Calling `enqueue` returns an example `Request` object, allowing the job to be executed

```typescript
const request = await runner.enqueue(job);
await runner.execute(request);
```

### Cloud Task scheduler

Creates jobs in Google Cloud Tasks – designed for use in production

```typescript
const scheduler = CloudTaskScheduler(logger);
const runner = new JobRunner<CloudTaskScheduler>(scheduler, logger);
runner.register(ExampleJob);

const job = new ExampleJob({shop: 'example.myshopify.com'});

const request = await runner.enqueue(job);
```

Create a corresponding route to consume the created tasks

```typescript
// internal.jobs.run.tsx
const config: CloudTaskSchedulerConfig = {
  location: 'us-central1',
  projectId: 'subscriptions-app-remix',
  queuePrefix: 'example',
  callbackUrl: 'http://localhost/internal/jobs/run',
  serviceAccountEmail: 'example@iam.googlecloud.com',
  audience: 'http://localhost/',
};

export async function action({request, context}: ActionFunctionArgs) {
  const scheduler = CloudTaskScheduler(logger, config);
  const runner = new JobRunner<CloudTaskScheduler>(scheduler, logger);

  runner.register(ExampleJob);

  await runner.execute(request);
}
```

#### Enqueue options

Schedule a job to run at a given Unix timestamp

```typescript
const job = new ExampleJob({shop: 'example.myshopify.com'});
const request = await runner.enqueue(job, {
  scheduleTime: {seconds: DateTime.utc(2024, 4, 3, 16, 24).toUnixInteger()},
});
```

Override the default [dispatch deadline](https://cloud.google.com/tasks/docs/dual-overview#http) (10 minutes)

```typescript
const job = new ExampleJob({shop: 'example.myshopify.com'});
const request = await runner.enqueue(job, {
  dispatchDeadline: {seconds: Duration.fromObject({minutes: 30}).as('seconds')},
});
```

## Custom queues

> [!NOTE]
> All jobs uses the `default` queue by default

Add a new queue to your Cloud Tasks config

```diff
 - tasks:
   queues:
     - default
+    - foo
```

Deploy the infrastructure changes

Change the `queue` property in the job

```typescript
class FooJob extends Job<FooParams> {
  public queue: string = 'foo';
  ...
}
```
