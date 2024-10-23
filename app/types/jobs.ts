export interface Parameters<T> {
  shop: string;
  payload: T;
}

export interface RebillSubscriptionJobPayload {
  subscriptionContractId: string;
  originTime: string;
}

export interface ChargeBillingCyclesPayload {
  startDate: string;
  endDate: string;
}

export interface ScheduleShopsForBillingChargeParameters {
  targetDate: string;
}

export interface TagSubscriptionsOrderPayload {
  orderId: string | null;
  tags: string[];
}
