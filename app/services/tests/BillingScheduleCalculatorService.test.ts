import {afterEach, beforeAll, describe, expect, it, vi} from 'vitest';

import * as factories from '#/factories';
import {DateTime} from 'luxon';
import prisma from '~/db.server';
import {BillingScheduleCalculatorService} from '../BillingScheduleCalculatorService';

describe('BillingScheduleCalculatorService', () => {
  beforeAll(async () => {
    await prisma.billingSchedule.deleteMany();
  });

  afterEach(async () => {
    await prisma.billingSchedule.deleteMany();
  });

  describe('#timeLocal,#timeUtc', () => {
    it('returns start of billing hour in correct time zone (europe)', async () => {
      const date = DateTime.utc(2023, 7, 14, 1);

      const shop = await factories.billingSchedule.create({
        hour: 10,
        timezone: 'Europe/London',
      });
      const calc = new BillingScheduleCalculatorService(shop, date);

      expect(calc.timeLocal.toISO()).toEqual('2023-07-14T10:00:00.000+01:00');

      expect(calc.timeUtc.toISO()).toEqual('2023-07-14T09:00:00.000Z');
    });

    it('returns start of billing hour in correct time zone (new zealand)', async () => {
      const date = DateTime.utc(2023, 7, 14, 1);

      const shop = await factories.billingSchedule.create({
        hour: 10,
        timezone: 'Pacific/Auckland',
      });

      const calc = new BillingScheduleCalculatorService(shop, date);

      expect(calc.timeLocal.toISO()).toEqual('2023-07-14T10:00:00.000+12:00');

      expect(calc.timeUtc.toISO()).toEqual('2023-07-13T22:00:00.000Z');
    });

    it('returns start of billing hour in correct time zone (hawaii)', async () => {
      const date = DateTime.utc(2023, 7, 14, 15);

      const shop = await factories.billingSchedule.create({
        hour: 10,
        timezone: 'Pacific/Honolulu',
      });

      const calc = new BillingScheduleCalculatorService(shop, date);

      expect(calc.timeLocal.toISO()).toEqual('2023-07-14T10:00:00.000-10:00');

      expect(calc.timeUtc.toISO()).toEqual('2023-07-14T20:00:00.000Z');
    });

    it('returns start of billing hour in correct time zone (kathmandu)', async () => {
      const date = DateTime.utc(2023, 7, 14, 1);

      const shop = await factories.billingSchedule.create({
        hour: 10,
        timezone: 'Asia/Kathmandu',
      });

      const calc = new BillingScheduleCalculatorService(shop, date);

      expect(calc.timeLocal.toISO()).toEqual('2023-07-14T10:00:00.000+05:45');

      expect(calc.timeUtc.toISO()).toEqual('2023-07-14T04:00:00.000Z');
    });
  });

  describe('#billingStartTimeUtc,#billingEndTimeUtc', () => {
    it('returns the correct billing time, according to billing cadence', async () => {
      const date = DateTime.utc(2023, 7, 14, 1);

      // London timezone on 2023-07-14 is 1 hour ahead of UTC (DST time change)
      const shop = await factories.billingSchedule.create({
        hour: 10,
        timezone: 'Europe/London',
      });

      const calc = new BillingScheduleCalculatorService(shop, date);

      const londonDSTendOfDayInUTC = '2023-07-14T22:59:59.999Z';
      const twoDaysBeforeLondonDSTendOfDayInUTC = '2023-07-12T22:59:59.999Z';

      expect(calc.timeUtc.toISO()).toEqual('2023-07-14T09:00:00.000Z');
      expect(calc.billingStartTimeUtc.toISO()).toEqual(
        twoDaysBeforeLondonDSTendOfDayInUTC,
      );
      expect(calc.billingEndTimeUtc.toISO()).toEqual(londonDSTendOfDayInUTC);
    });

    it('returns the correct billing time, for an invalid DST time', async () => {
      const date = DateTime.utc(2023, 3, 13, 5);

      // Toronto timezone on 2023-03-12 is 5 hours behind UTC
      // Toronto timezone on 2023-03-13 is 4 hours behind UTC (DST time change)
      const shop = await factories.billingSchedule.create({
        hour: 2,
        timezone: 'America/Toronto',
      });

      const calc = new BillingScheduleCalculatorService(shop, date);

      const torontoDSTendOfDayInUTC = '2023-03-14T03:59:59.999Z';
      const twoDaysBeforeTorontoDSTendOfDayInUTC = '2023-03-12T03:59:59.999Z';

      expect(calc.billingStartTimeUtc.toISO()).toEqual(
        twoDaysBeforeTorontoDSTendOfDayInUTC,
      );
      expect(calc.billingEndTimeUtc.toISO()).toEqual(torontoDSTendOfDayInUTC);
    });

    it('returns the correct billing time, for a dubious DST time', async () => {
      const date = DateTime.utc(2023, 11, 6, 5);

      // Toronto timezone on 2023-11-04 is 4 hours behind UTC (DST time change)
      // Toronto timezone on 2023-11-05 is 5 hours behind UTC
      const shop = await factories.billingSchedule.create({
        hour: 1,
        timezone: 'America/Toronto',
      });

      const calc = new BillingScheduleCalculatorService(shop, date);

      const torontoendOfDayInUTC = '2023-11-07T04:59:59.999Z';
      const twoDaysBeforeTorontoendOfDayInUTC = '2023-11-05T04:59:59.999Z';

      expect(calc.billingStartTimeUtc.toISO()).toEqual(
        twoDaysBeforeTorontoendOfDayInUTC,
      );
      expect(calc.billingEndTimeUtc.toISO()).toEqual(torontoendOfDayInUTC);
    });
  });

  describe('isBillable', () => {
    it('returns true for a matching utc billing hour', async () => {
      const date = DateTime.utc(2023, 7, 14, 9);

      const shop = await factories.billingSchedule.create({
        hour: 10,
        timezone: 'Europe/London',
      });

      const calc = new BillingScheduleCalculatorService(shop, date);
      expect(calc.isBillable()).toEqual(true);
    });
    it('returns false for when utc billing hour does not match', async () => {
      vi.setSystemTime(new Date(2023, 6, 14, 8, 5, 23));
      const date = DateTime.utc(2023, 7, 14, 8);

      const shop = await factories.billingSchedule.create({
        hour: 10,
        timezone: 'Europe/London',
      });

      const calc = new BillingScheduleCalculatorService(shop, date);
      expect(calc.isBillable()).toEqual(false);
    });

    it.each([
      ['Europe/London', 9],
      ['Pacific/Auckland', 22],
      ['Pacific/Honolulu', 20],
      ['Asia/Kathmandu', 4],
    ])(
      'returns true only once for billing at 10:00:00 in %s (%i:00:00 UTC)',
      async (timezone, utcHour) => {
        const shop = await factories.billingSchedule.create({
          hour: 10,
          timezone,
        });

        const hours = [...Array(24).keys()];

        const promises = hours.map(async (hour) => {
          const date = DateTime.utc(2023, 7, 14, hour);

          const calc = new BillingScheduleCalculatorService(shop, date);
          return [hour, calc.isBillable()];
        });

        const results = await Promise.all(promises);

        expect(
          results.filter(
            ([hour, billable]) => hour === utcHour && billable === true,
          ).length,
        ).toEqual(1);

        expect(
          results.filter(([hour, billable]) => billable === true).length,
        ).toEqual(1);

        expect(
          results.filter(([hour, billable]) => billable === false).length,
        ).toEqual(23);
      },
    );
  });
});
