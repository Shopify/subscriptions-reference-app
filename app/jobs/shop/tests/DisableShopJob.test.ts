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
import {DisableShopJob} from '~/jobs/shop';

import {TEST_SHOP} from '#/constants';
import prisma from '~/db.server';
import {unauthenticated} from '~/shopify.server';

describe('DisableShopJob', () => {
  beforeAll(async () => {
    await prisma.billingSchedule.deleteMany();
    await prisma.session.deleteMany();
  });

  beforeEach(async () => {
    await factories.billingSchedule.create({
      shop: TEST_SHOP,
      hour: 10,
      timezone: 'America/Toronto',
      active: true,
    });
    await prisma.session.create({
      data: {
        id: '123',
        shop: TEST_SHOP,
        state: '123',
        scope: 'read_products',
        accessToken: '123qwe',
      },
    });
  });

  afterEach(async () => {
    await prisma.billingSchedule.deleteMany();
    await prisma.session.deleteMany();
    vi.restoreAllMocks();
  });

  describe('when app is no longer installed on the shop', () => {
    beforeEach(async () => {
      vi.spyOn(unauthenticated, 'admin').mockResolvedValue({
        admin: {
          graphql: vi.fn().mockImplementation(() => {
            throw {response: {code: 401}};
          }),
        },
      } as any);
    });

    it('deactivates BillingSchedule', async () => {
      expect(
        (await prisma.billingSchedule.findMany({where: {active: true}})).length,
      ).toEqual(1);

      const params = {
        shop: TEST_SHOP,
        payload: {},
      } as any;

      await new DisableShopJob(params).run();

      expect(
        (await prisma.billingSchedule.findMany({where: {active: true}})).length,
      ).toEqual(0);
    });

    it('deletes all shop sessions', async () => {
      expect(await prisma.session.count()).toEqual(1);

      const params = {
        shop: TEST_SHOP,
        payload: {},
      } as any;

      await new DisableShopJob(params).run();

      expect(await prisma.session.count()).toEqual(0);
    });
  });

  describe('when app is installed on the shop', () => {
    beforeEach(async () => {
      vi.spyOn(unauthenticated, 'admin').mockResolvedValue({
        admin: {
          graphql: vi.fn().mockResolvedValue({}),
        },
      } as any);
    });

    it('does not deactivate BillingSchedule', async () => {
      expect(
        (await prisma.billingSchedule.findMany({where: {active: true}})).length,
      ).toEqual(1);

      const params = {
        shop: TEST_SHOP,
        payload: {},
      } as any;

      await new DisableShopJob(params).run();

      expect(
        (await prisma.billingSchedule.findMany({where: {active: true}})).length,
      ).toEqual(1);
    });

    it('does not delete shop sessions', async () => {
      expect(await prisma.session.count()).toEqual(1);

      const params = {
        shop: TEST_SHOP,
        payload: {},
      } as any;

      await new DisableShopJob(params).run();

      expect(await prisma.session.count()).toEqual(1);
    });
  });

  describe('when an unexpected error happens', () => {
    it('raises the error', async () => {
      vi.spyOn(unauthenticated, 'admin').mockResolvedValue({
        admin: {
          graphql: vi.fn().mockImplementation(() => {
            throw new Error('unexpected error');
          }),
        },
      } as any);

      const params = {
        shop: TEST_SHOP,
        payload: {},
      } as any;

      const job = new DisableShopJob(params);

      await expect(job.run()).rejects.toThrowError('unexpected error');
    });
  });
});
