import prisma from '~/db.server';

export async function loadPostPurchaseOffer(shop: string) {
  return prisma.postPurchaseOffer.upsert({
    where: {shop},
    create: {shop},
    update: {},
  });
}

export async function updatePostPurchaseOffer(
  shop: string,
  data: {
    enabled: boolean;
    variantId: string;
    discountPercent: number;
    sellingPlanId: string;
  },
) {
  return prisma.postPurchaseOffer.upsert({
    where: {shop},
    create: {shop, ...data},
    update: data,
  });
}
