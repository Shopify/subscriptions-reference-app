import {composeGid} from '@shopify/admin-graphql-api-utilities';

// POS UI Extensions Polaris Web Components are supported starting in POS version 10.13+
export const MINIMUM_VERSION_SUPPORTED = '10.13.0';

// VERY IMPORTANT: NOT SETTING THE APP ID WILL PREVENT SELLING PLANS FROM BEING SHOWN
export const YOUR_APP_ID = composeGid('App', 'YOUR_APP_ID_HERE');
