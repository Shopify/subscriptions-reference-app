import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import * as factories from '#/factories';
import prisma from '~/db.server';
import {findOrCreateBy, markCompleted} from '../DunningTracker.server';

describe('DunningTracker', () => {
  beforeAll(async () => {
    await prisma.dunningTracker.deleteMany();
  });

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(async () => {
    await prisma.dunningTracker.deleteMany();
    vi.useRealTimers();
  });

  describe('upsert', () => {
    it('creates a new record if missing', async () => {
      expect(await prisma.dunningTracker.count()).toEqual(0);

      const record = await findOrCreateBy({
        shop: 'example.myshopify.com',
        contractId: 'gid://shopify/SubscriptionContract/1',
        billingCycleIndex: 1,
        failureReason: 'CARD_EXPIRED',
      });

      expect(record.shop).toEqual('example.myshopify.com');
      expect(await prisma.dunningTracker.count()).toEqual(1);
    });

    it('safely returns the existing matching record if present', async () => {
      await factories.dunningTracker.create({
        shop: 'example.myshopify.com',
        contractId: 'gid://shopify/SubscriptionContract/1',
        billingCycleIndex: 1,
        failureReason: 'CARD_EXPIRED',
      });

      expect(await prisma.dunningTracker.count()).toEqual(1);

      const record = await findOrCreateBy({
        shop: 'example.myshopify.com',
        contractId: 'gid://shopify/SubscriptionContract/1',
        billingCycleIndex: 1,
        failureReason: 'CARD_EXPIRED',
      });

      expect(record.shop).toEqual('example.myshopify.com');
      expect(await prisma.dunningTracker.count()).toEqual(1);
    });
  });

  describe('markCompleted', async () => {
    it('updates the completed timestamp correctly', async () => {
      vi.setSystemTime('2023-11-14T14:06:12Z');

      const tracker = await factories.dunningTracker.create({
        completedAt: null,
      });

      await markCompleted(tracker);

      const updatedTracker = await prisma.dunningTracker.findFirstOrThrow();
      expect(updatedTracker.completedAt).toEqual(
        new Date('2023-11-14T14:06:12Z'),
      );
    });
  });
});
