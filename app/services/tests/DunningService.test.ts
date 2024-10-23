import * as factories from '#/factories';
import type {DunningTracker} from '@prisma/client';
import {afterEach, beforeAll, describe, expect, it, vi} from 'vitest';
import prisma from '~/db.server';
import {PenultimateAttemptDunningService} from '~/services/PenultimateAttemptDunningService';
import {RetryDunningService} from '~/services/RetryDunningService';
import {DunningService} from '../DunningService';

vi.mock('~/services/RetryDunningService', async () => {
  const RetryDunningService = vi.fn();
  RetryDunningService.prototype.run = vi.fn().mockResolvedValue(undefined);

  return {RetryDunningService};
});

vi.mock('~/services/PenultimateAttemptDunningService', async () => {
  const PenultimateAttemptDunningService = vi.fn();
  PenultimateAttemptDunningService.prototype.run = vi
    .fn()
    .mockResolvedValue(undefined);

  return {PenultimateAttemptDunningService};
});

describe('DunningService', () => {
  beforeAll(async () => {
    await prisma.dunningTracker.deleteMany();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await prisma.dunningTracker.deleteMany();
  });

  describe('run', () => {
    it('returns early if billing attempt not ready', async () => {
      const contract = factories.contract.build();
      const billingAttempt = factories.billingAttempt.build({
        ready: false,
      });

      const billingCycle = factories.billingCycle.build(
        {},
        {transient: {billingAttempts: [billingAttempt]}},
      );

      const settings = factories.settings.build();

      const dunningService = new DunningService({
        shopDomain: 'example.myshopify.com',
        contract,
        billingCycle,
        settings,
        failureReason: 'CARD_EXPIRED',
      });

      const result = await dunningService.run();

      expect(result).toEqual('BILLING_ATTEMPT_NOT_READY');
    });

    it('returns early if billing cycle already billed', async () => {
      const contract = factories.contract.build();
      const billingAttempt = factories.billingAttempt.build();

      const billingCycle = factories.billingCycle.build(
        {status: 'BILLED'},
        {transient: {billingAttempts: [billingAttempt]}},
      );

      const settings = factories.settings.build();

      const dunningService = new DunningService({
        shopDomain: 'example.myshopify.com',
        contract,
        billingCycle,
        settings,
        failureReason: 'CARD_EXPIRED',
      });

      const result = await dunningService.run();

      expect(result).toEqual('BILLING_CYCLE_ALREADY_BILLED');
    });

    it('returns early if billing cycle already billed', async () => {
      const contract = factories.contract.build();
      const billingAttempt = factories.billingAttempt.build();

      const billingCycle = factories.billingCycle.build(
        {status: 'BILLED'},
        {transient: {billingAttempts: [billingAttempt]}},
      );

      const settings = factories.settings.build();

      const dunningService = new DunningService({
        shopDomain: 'example.myshopify.com',
        contract,
        billingCycle,
        settings,
        failureReason: 'CARD_EXPIRED',
      });

      const result = await dunningService.run();

      expect(result).toEqual('BILLING_CYCLE_ALREADY_BILLED');
      expect(await prisma.dunningTracker.count()).toEqual(1);

      const tracker = await prisma.dunningTracker.findFirst();
      expect(tracker?.completedAt).not.toBeNull();
    });

    it('returns early if contract in terminal status', async () => {
      const contract = factories.contract.build({status: 'CANCELLED'});
      const billingAttempt = factories.billingAttempt.build();

      const billingCycle = factories.billingCycle.build(
        {},
        {transient: {billingAttempts: [billingAttempt]}},
      );

      const settings = factories.settings.build();

      const dunningService = new DunningService({
        shopDomain: 'example.myshopify.com',
        contract,
        billingCycle,
        settings,
        failureReason: 'CARD_EXPIRED',
      });

      const result = await dunningService.run();

      expect(result).toEqual('CONTRACT_IN_TERMINAL_STATUS');
      expect(await prisma.dunningTracker.count()).toEqual(1);

      const tracker = await prisma.dunningTracker.findFirst();
      expect(tracker?.completedAt).not.toBeNull();
    });

    it('performs a regular retry attempt on first of many retries', async () => {
      const subscriptionContract = factories.contract.build();
      const billingCycle = factories.billingCycle.build();
      // mock the return value of the RetryDunningService
      const settings = factories.settings.build();

      const dunningService = new DunningService({
        shopDomain: 'example.myshopify.com',
        contract: subscriptionContract,
        billingCycle,
        settings,
        failureReason: 'CARD_EXPIRED',
      });

      const result = await dunningService.run();

      expect(RetryDunningService.prototype.run).toHaveBeenCalledOnce();
      expect(result).toEqual('RETRY_DUNNING');
    });

    it('creates a dunning tracker record on the first retry', async () => {
      const contract = factories.contract.build();
      const billingCycle = factories.billingCycle.build();
      const settings = factories.settings.build();

      const dunningService = new DunningService({
        shopDomain: 'example.myshopify.com',
        contract,
        billingCycle,
        settings,
        failureReason: 'CARD_EXPIRED',
      });

      await dunningService.run();

      expect(await prisma.dunningTracker.count()).toEqual(1);

      const tracker =
        (await prisma.dunningTracker.findFirst()) as DunningTracker;

      expect(tracker.shop).toEqual('example.myshopify.com');
      expect(tracker.contractId).toEqual(contract.id);
      expect(tracker.billingCycleIndex).toEqual(billingCycle.cycleIndex);
      expect(tracker.failureReason).toEqual('CARD_EXPIRED');
      expect(tracker.completedAt).toBeNull();
    });

    it('performs a penultimate retry attempt on second of three attempts', async () => {
      const contract = factories.contract.build();
      const billingCycle = factories.billingCycle.build(
        {},
        {transient: {billingAttemptsCount: 2}},
      );

      const settings = factories.settings.build({retryAttempts: 3});

      const dunningService = new DunningService({
        shopDomain: 'example.myshopify.com',
        contract,
        billingCycle,
        settings,
        failureReason: 'CARD_EXPIRED',
      });

      const result = await dunningService.run();

      expect(
        PenultimateAttemptDunningService.prototype.run,
      ).toHaveBeenCalledOnce();
      expect(result).toEqual('PENULTIMATE_ATTEMPT_DUNNING');
    });

    it('updates the attempts count for the dunning tracker on the penultimate retry attempt', async () => {
      const contract = factories.contract.build();
      const billingCycle = factories.billingCycle.build(
        {},
        {transient: {billingAttemptsCount: 2}},
      );

      const settings = factories.settings.build({retryAttempts: 3});

      await factories.dunningTracker.create({
        shop: 'example.myshopify.com',
        contractId: contract.id,
        billingCycleIndex: billingCycle.cycleIndex,
        failureReason: 'CARD_EXPIRED',
      });

      expect(await prisma.dunningTracker.count()).toEqual(1);

      const dunningService = new DunningService({
        shopDomain: 'example.myshopify.com',
        contract,
        billingCycle,
        settings,
        failureReason: 'CARD_EXPIRED',
      });

      await dunningService.run();

      expect(await prisma.dunningTracker.count()).toEqual(1);
      const tracker =
        (await prisma.dunningTracker.findFirst()) as DunningTracker;

      expect(tracker.completedAt).toBeNull();
    });

    it('performs a final retry attempt on third of three attempts', async () => {
      const contract = factories.contract.build();
      const billingCycle = factories.billingCycle.build(
        {},
        {transient: {billingAttemptsCount: 3}},
      );

      const settings = factories.settings.build({retryAttempts: 3});

      const dunningService = new DunningService({
        shopDomain: 'example.myshopify.com',
        contract,
        billingCycle,
        settings,
        failureReason: 'CARD_EXPIRED',
      });

      const result = await dunningService.run();

      expect(result).toEqual('FINAL_ATTEMPT_DUNNING');
    });

    it('updates the attempts count and marks tracker as completed', async () => {
      const contract = factories.contract.build();
      const billingCycle = factories.billingCycle.build(
        {},
        {transient: {billingAttemptsCount: 3}},
      );

      vi.mock('~/services/FinalAttemptDunningService', async () => {
        const actual = (await vi.importActual(
          '~/services/FinalAttemptDunningService',
        )) as any;

        const finalAttemptDunningService = vi.fn();
        finalAttemptDunningService.prototype.run = vi.fn();
        return {
          ...actual,
          FinalAttemptDunningService: finalAttemptDunningService,
        };
      });

      const settings = factories.settings.build({retryAttempts: 3});

      await factories.dunningTracker.create({
        shop: 'example.myshopify.com',
        contractId: contract.id,
        billingCycleIndex: billingCycle.cycleIndex,
        failureReason: 'CARD_EXPIRED',
      });

      expect(await prisma.dunningTracker.count()).toEqual(1);

      const dunningService = new DunningService({
        shopDomain: 'example.myshopify.com',
        contract,
        billingCycle,
        settings,
        failureReason: 'CARD_EXPIRED',
      });

      await dunningService.run();

      expect(await prisma.dunningTracker.count()).toEqual(1);
      const tracker =
        (await prisma.dunningTracker.findFirst()) as DunningTracker;

      expect(tracker.completedAt).not.toBeNull();
    });
  });
});
