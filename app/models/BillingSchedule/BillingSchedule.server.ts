import type {BillingSchedule} from '@prisma/client';
import prisma from '~/db.server';
import {getShopInfos} from '~/models/ShopInfo/ShopInfo.server';
import {unauthenticated} from '~/shopify.server';

import type {PaginatorCallbackFn} from './paginate';
import {paginate} from './paginate';

export async function findActiveBillingSchedulesInBatches(
  callback: PaginatorCallbackFn,
): Promise<void> {
  await paginate({where: {active: true}}, callback);
}

export async function createActiveBillingSchedule(
  shop: string,
): Promise<BillingSchedule> {
  const timezone = await queryTimezone(shop);

  return await upsert({shop, active: true, timezone});
}

async function queryTimezone(shop: string): Promise<string> {
  const {admin} = await unauthenticated.admin(shop);
  const {
    shop: {ianaTimezone},
  } = await getShopInfos(admin.graphql);
  return ianaTimezone;
}

async function upsert(
  billingSchedule: Pick<BillingSchedule, 'shop' | 'active' | 'timezone'>,
): Promise<BillingSchedule> {
  const {shop, active, timezone} = billingSchedule;

  return await prisma.billingSchedule.upsert({
    where: {shop},
    create: {shop, active, timezone},
    update: {active, timezone},
  });
}
