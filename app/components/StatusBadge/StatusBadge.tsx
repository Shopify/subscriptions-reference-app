import {Badge} from '@shopify/polaris';
import {useTranslation} from 'react-i18next';
import type {SubscriptionContractStatusType} from '~/types';
import {SubscriptionContractStatus} from '~/types';

interface StatusBadgeProps {
  status: SubscriptionContractStatusType;
}

export const StatusBadge = ({status}: StatusBadgeProps) => {
  const {t} = useTranslation();

  switch (status) {
    case SubscriptionContractStatus.Cancelled:
      return <Badge tone="warning">{t('statusBadge.cancelled')}</Badge>;
    case SubscriptionContractStatus.Paused:
      return <Badge tone="attention">{t('statusBadge.paused')}</Badge>;
    case SubscriptionContractStatus.Failed:
      return <Badge tone="warning">{t('statusBadge.failed')}</Badge>;
    case SubscriptionContractStatus.Expired:
      return <Badge tone="warning">{t('statusBadge.expired')}</Badge>;
    case SubscriptionContractStatus.Stale:
      return <Badge tone="warning">{t('statusBadge.stale')}</Badge>;
    case SubscriptionContractStatus.Active:
    default:
      return <Badge tone="success">{t('statusBadge.active')}</Badge>;
  }
};
