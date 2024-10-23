import type {CurrencyCode} from 'types/admin.types';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {TEST_SHOP} from '#/constants';
import * as factories from '#/factories';
import {setUpValidSession} from '#/utils/setup-valid-session';
import prisma from '~/db.server';
import * as ShopInfos from '~/models/ShopInfo/ShopInfo.server';
import {sessionStorage} from '~/shopify.server';
import {
  createActiveBillingSchedule,
  findActiveBillingSchedulesInBatches,
} from '../BillingSchedule.server';

describe('BillingSchedule', () => {
  beforeAll(async () => {
    await prisma.billingSchedule.deleteMany();
  });

  beforeEach(async () => {
    await setUpValidSession(sessionStorage);
  });

  afterEach(async () => {
    await prisma.billingSchedule.deleteMany();
    vi.restoreAllMocks();
  });

  describe('findActiveBillingSchedulesInBatches', () => {
    it('calls the callback function', async () => {
      await factories.billingSchedule.create({active: true});

      const callback = vi.fn();
      await findActiveBillingSchedulesInBatches(callback);

      expect(callback).toHaveBeenCalledOnce();
    });

    it('yields the correct number of records', async () => {
      await factories.billingSchedule.createList(3, {active: true});

      const count = await prisma.billingSchedule.count();
      expect(count).toEqual(3);

      await findActiveBillingSchedulesInBatches(async (records) => {
        expect(records.length).toEqual(3);
      });
    });
  });

  describe('createActiveBillingSchedule', () => {
    it('creates a new record if missing', async () => {
      const spy = vi.spyOn(ShopInfos, 'getShopInfos').mockResolvedValue({
        shop: {
          id: 'gid://shopify/Shop/9',
          ianaTimezone: 'America/Sao_Paulo',
          currencyCode: 'BRL' as CurrencyCode,
          name: 'My Shop',
          contactEmail: 'noreply@shopify.com',
          email: 'test@shopfiy.com',
          primaryDomain: {
            url: TEST_SHOP,
          },
          myshopifyDomain: TEST_SHOP,
        },
      });

      await factories.billingSchedule.create({
        active: true,
        shop: 'shop-existing.myshopify.com',
      });

      expect(await prisma.billingSchedule.count()).toEqual(1);
      expect(
        await prisma.billingSchedule.count({
          where: {shop: TEST_SHOP},
        }),
      ).toEqual(0);

      const record = await createActiveBillingSchedule(TEST_SHOP);

      expect(record.shop).toEqual(TEST_SHOP);
      expect(record.active).toEqual(true);
      expect(record.timezone).toEqual('America/Sao_Paulo');
      expect(spy).toHaveBeenCalledOnce();
      expect(await prisma.billingSchedule.count()).toEqual(2);
    });

    it('updates existing record status and timezone if present', async () => {
      await factories.billingSchedule.create({
        active: false,
        shop: TEST_SHOP,
        timezone: 'America/Manaus',
      });

      vi.spyOn(ShopInfos, 'getShopInfos').mockResolvedValue({
        shop: {
          id: 'gid://shopify/Shop/9',
          ianaTimezone: 'America/Sao_Paulo',
          currencyCode: 'BRL' as CurrencyCode,
          name: 'My Shop',
          contactEmail: 'noreply@shopify.com',
          email: 'test@shopfiy.com',
          primaryDomain: {
            url: TEST_SHOP,
          },
          myshopifyDomain: TEST_SHOP,
        },
      });

      expect(await prisma.billingSchedule.count()).toEqual(1);

      const record = await createActiveBillingSchedule(TEST_SHOP);

      expect(record.shop).toEqual(TEST_SHOP);
      expect(record.active).toEqual(true);
      expect(record.timezone).toEqual('America/Sao_Paulo');
      expect(await prisma.billingSchedule.count()).toEqual(1);
    });
  });
});
