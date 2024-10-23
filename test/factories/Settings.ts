import {Factory} from 'fishery';
import type {Settings} from '~/types';

export const settings = Factory.define<Settings>(({sequence}) => {
  return {
    id: `gid://shopify/MetaObject/${sequence}`,
    daysBetweenRetryAttempts: 1,
    inventoryDaysBetweenRetryAttempts: 1,
    inventoryRetryAttempts: 3,
    retryAttempts: 3,
    onFailure: 'cancel',
    inventoryOnFailure: 'skip',
    inventoryNotificationFrequency: 'monthly',
  };
});
