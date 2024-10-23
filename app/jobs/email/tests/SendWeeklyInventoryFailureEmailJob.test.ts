import {afterEach, beforeAll, describe, expect, it, vi} from 'vitest';

import * as factories from '#/factories';
import prisma from '~/db.server';

import {jobs} from '~/jobs';
import {SendInventoryFailureEmailJob} from '../SendInventoryFailureEmailJob';
import {loadSettingsMetaobject} from '~/models/Settings/Settings.server';

import {SendWeeklyInventoryFailureEmailJob} from '../SendWeeklyInventoryFailureEmailJob';

vi.mock('~/shopify.server', async (original) => {
  const {sessionStorage}: any = await original();
  return {
    sessionStorage,
    unauthenticated: {
      admin: vi.fn().mockResolvedValue({admin: vi.fn()}),
    },
  };
});

vi.mock('~/models/Settings/Settings.server.ts', () => {
  return {loadSettingsMetaobject: vi.fn()};
});

vi.mock('~/jobs', () => {
  const originalModule = vi.importActual('~/jobs');
  return {
    ...originalModule,
    jobs: {
      enqueue: vi.fn(),
    },
  };
});

describe('SendWeeklyInventoryFailureEmailJob', () => {
  beforeAll(async () => {
    await prisma.billingSchedule.deleteMany();
  });

  afterEach(async () => {
    await prisma.billingSchedule.deleteMany();
    vi.restoreAllMocks();
  });

  it('schedules jobs for shops that have notification frequency set to weekly', async () => {
    const settings = factories.settings.build();
    const settingsMonthly = factories.settings.build();
    vi.mocked(loadSettingsMetaobject)
      .mockResolvedValueOnce(settings)
      .mockResolvedValueOnce(settingsMonthly);

    settings['inventoryNotificationFrequency'] = 'weekly';
    settingsMonthly['inventoryNotificationFrequency'] = 'monthly';

    await factories.billingSchedule.create({
      shop: 'shop-weekly-inventory-notification.myshopify.com',
      hour: 10,
      timezone: 'America/Toronto',
      active: true,
    });

    await factories.billingSchedule.create({
      shop: 'shop-monthly-inventory-notification.myshopify.com',
      hour: 10,
      timezone: 'America/Toronto',
      active: true,
    });

    const enqueueSpy = vi.spyOn(jobs, 'enqueue');

    const job = new SendWeeklyInventoryFailureEmailJob({});

    await job.perform();

    expect(enqueueSpy).toHaveBeenCalledTimes(1);

    expect(enqueueSpy).toHaveBeenCalledWith(
      new SendInventoryFailureEmailJob({
        shop: 'shop-weekly-inventory-notification.myshopify.com',
        payload: {},
      }),
    );
  });
});
