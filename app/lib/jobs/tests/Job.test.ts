import {HttpResponseError} from '@shopify/shopify-api';
import {SessionNotFoundError} from '@shopify/shopify-app-remix/server';
import {describe, expect, it} from 'vitest';
import {Job} from '../Job';

class FailureJob extends Job {
  async perform() {
    throw new Error('Failed FailureJob');
  }
}

class ShopUnavailableJob extends Job {
  async perform() {
    throw new HttpResponseError({
      code: 402,
      message: 'Payment Required',
      statusText: '402 Payment Required',
    });
  }
}

class RateLimitedJob extends Job {
  async perform() {
    throw new HttpResponseError({
      code: 429,
      message: 'Rate Limited',
      statusText: '429 Rate Limited',
    });
  }
}

class AppUninstalledJob extends Job {
  async perform() {
    throw new SessionNotFoundError('Session does not exist');
  }
}

describe('Job', () => {
  it('throws for an unexpected error', async () => {
    const job = new FailureJob({});
    expect(job.run()).rejects.toThrow(new Error('Failed FailureJob'));
  });

  it('does not throw for a non-retryable http response error', async () => {
    const job = new ShopUnavailableJob({});
    expect(job.run()).resolves.not.toThrowError();
  });

  it('throws for a retryable http response error', async () => {
    const job = new RateLimitedJob({});
    expect(job.run()).rejects.toThrow(new Error('Rate Limited'));
  });

  it('does not throw for session not found error', async () => {
    const job = new AppUninstalledJob({});
    expect(job.run()).resolves.not.toThrowError();
  });
});
