import {Factory} from 'fishery';
import type {Settings} from '~/types';

export const settings = Factory.define<Settings>(({sequence}) => {
  return {
    id: `gid://shopify/MetaObject/${sequence}`,
    daysBetweenRetryAttempts: 1,
    retryAttempts: 3,
    onFailure: 'cancel',
    inventoryRetryAttempts: 1,
    inventoryDaysBetweenRetryAttempts: 14,
    inventoryOnFailure: 'skip',
    inventoryNotificationFrequency: 'monthly',
  };
});
