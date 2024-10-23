import React from 'react';
import BugsnagPluginReact from '@bugsnag/plugin-react';
import Bugsnag from '@bugsnag/web-worker';
import {parseGid} from '@shopify/admin-graphql-api-utilities';


const BUGSNAG_API_KEY = ''
Bugsnag.start({
  apiKey: BUGSNAG_API_KEY,
  releaseStage:
    process.env.NODE_ENV === 'development' ? 'development' : 'production',
  enabledReleaseStages: ['production'],
  plugins: [new BugsnagPluginReact(React)],
  autoDetectErrors: true,
});

const BugsnagErrorBoundary =
  Bugsnag.getPlugin('react')!.createErrorBoundary(React);

interface BugsnagClientErrorBoundaryProps {
  children: React.ReactNode;
  shop?: {
    id: string;
    name: string;
    myshopifyDomain: string;
  };
  version?: string;
}

export function BugsnagProvider({
  children,
  shop,
  version,
}: BugsnagClientErrorBoundaryProps) {
  if (version) {
    Bugsnag.addMetadata('buyer-subscriptions', {
      version,
    });
  }

  if (shop) {
    const {id, myshopifyDomain, name} = shop;

    Bugsnag.addMetadata('shop', {
      id: Number(parseGid(id)),
      name,
      domain: myshopifyDomain,
    });
  }

  return <BugsnagErrorBoundary>{children}</BugsnagErrorBoundary>;
}
