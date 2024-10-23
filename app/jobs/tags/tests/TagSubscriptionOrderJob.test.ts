import type {Jobs} from '~/types';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {AddOrderTagsService} from '~/services/AddOrderTagsService';
import {TEST_SHOP} from '#/constants';
import {TagSubscriptionOrderJob} from '~/jobs/tags';
import type {TagSubscriptionsOrderPayload} from '~/types/jobs';
import {FIRST_ORDER_TAGS, RECURRING_ORDER_TAGS} from '~/jobs/tags/constants';

vi.mock('~/services/AddOrderTagsService', async (importOriginal) => {
  const original: any = await importOriginal();
  const AddOrderTagsService = vi.fn();
  AddOrderTagsService.prototype.run = vi.fn().mockResolvedValue(undefined);
  return {...original, AddOrderTagsService};
});

const tagSubscriptionsOrderPayload: TagSubscriptionsOrderPayload = {
  orderId: 'gid://shopify/SubscriptionContract/1',
  tags: FIRST_ORDER_TAGS,
};

const recurringTagSubscriptionsOrderPayload: TagSubscriptionsOrderPayload = {
  orderId: 'gid://shopify/SubscriptionContract/1',
  tags: RECURRING_ORDER_TAGS,
};

const tagSubscriptionsOrderWithoutOrderPayload: TagSubscriptionsOrderPayload = {
  orderId: null,
  tags: FIRST_ORDER_TAGS,
};

describe('TagSubscriptionOrderJob#perform', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('with recurring order tags', () => {
    it('calls add order tags with recurring tags', async () => {
      const task: Jobs.Parameters<Jobs.TagSubscriptionsOrderPayload> = {
        shop: TEST_SHOP,
        payload: recurringTagSubscriptionsOrderPayload,
      };
      const job = new TagSubscriptionOrderJob(task);
      await job.perform();

      expect(AddOrderTagsService).toHaveBeenCalledWith(
        TEST_SHOP,
        recurringTagSubscriptionsOrderPayload.orderId,
      );

      expect(AddOrderTagsService.prototype.run).toHaveBeenCalledWith(
        recurringTagSubscriptionsOrderPayload.tags,
      );
    });
  });

  describe('with order id in payload', () => {
    it('calls add order tags service', async () => {
      const task: Jobs.Parameters<Jobs.TagSubscriptionsOrderPayload> = {
        shop: TEST_SHOP,
        payload: tagSubscriptionsOrderPayload,
      };
      const job = new TagSubscriptionOrderJob(task);
      await job.perform();

      expect(AddOrderTagsService).toHaveBeenCalledWith(
        TEST_SHOP,
        tagSubscriptionsOrderPayload.orderId,
      );

      expect(AddOrderTagsService.prototype.run).toHaveBeenCalledWith(
        tagSubscriptionsOrderPayload.tags,
      );
    });
  });

  describe('without order id in payload', () => {
    it('does not call AddOrderTagService', async () => {
      const task: Jobs.Parameters<Jobs.TagSubscriptionsOrderPayload> = {
        shop: TEST_SHOP,
        payload: tagSubscriptionsOrderWithoutOrderPayload,
      };
      const job = new TagSubscriptionOrderJob(task);
      await job.perform();

      expect(AddOrderTagsService.prototype.run).not.toHaveBeenCalled();
    });
  });
});
