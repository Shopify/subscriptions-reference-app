import {afterEach, beforeAll, describe, expect, it, vi} from 'vitest';

import * as factories from '#/factories';
import prisma from '~/db.server';
import {paginate} from '../paginate';

describe('paginate', () => {
  beforeAll(async () => {
    await prisma.billingSchedule.deleteMany();
  });

  afterEach(async () => {
    await prisma.billingSchedule.deleteMany();
  });

  describe('with multiple pages', () => {
    it('pages through all results', async () => {
      await factories.billingSchedule.createList(3, {active: true});

      const count = await prisma.billingSchedule.count();
      expect(count).toEqual(3);

      const callback = vi.fn();

      await paginate({take: 2, orderBy: {shop: 'asc'}}, callback);

      expect(callback).toHaveBeenCalledTimes(2);

      expect(callback).toHaveBeenCalledWith([
        expect.objectContaining({
          active: true,
          hour: 10,
          timezone: 'America/Toronto',
          shop: 'shop-1.myshopify.com',
        }),
        expect.objectContaining({
          active: true,
          hour: 10,
          timezone: 'America/Toronto',
          shop: 'shop-2.myshopify.com',
        }),
      ]);

      expect(callback).toHaveBeenCalledWith([
        expect.objectContaining({
          active: true,
          hour: 10,
          timezone: 'America/Toronto',
          shop: 'shop-3.myshopify.com',
        }),
      ]);
    });

    it('pages through filtered results', async () => {
      await factories.billingSchedule.create({
        shop: 'shop-active-1.myshopify.com',
        active: true,
      });
      await factories.billingSchedule.create({
        shop: 'shop-inactive.myshopify.com',
        active: false,
      });
      await factories.billingSchedule.create({
        shop: 'shop-active-2.myshopify.com',
        active: true,
      });

      const count = await prisma.billingSchedule.count();
      expect(count).toEqual(3);

      const callback = vi.fn();

      await paginate({where: {active: true}, take: 1}, callback);

      expect(callback).toHaveBeenCalledTimes(2);

      expect(callback).toHaveBeenCalledWith([
        expect.objectContaining({
          active: true,
          hour: 10,
          timezone: 'America/Toronto',
          shop: 'shop-active-1.myshopify.com',
        }),
      ]);

      expect(callback).toHaveBeenCalledWith([
        expect.objectContaining({
          active: true,
          hour: 10,
          timezone: 'America/Toronto',
          shop: 'shop-active-2.myshopify.com',
        }),
      ]);
    });
  });
});
