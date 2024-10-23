import {
  OnFailureType,
  type OnFailureTypeType,
} from '~/routes/app.settings._index/validator';

export const EmailDunningStatus = {
  Cancelled: 'CANCELED',
  Skipped: 'SKIPPED',
  Paused: 'PAUSED',
} as const;

export type EmailDunningStatusType =
  (typeof EmailDunningStatus)[keyof typeof EmailDunningStatus];

export const emailDunningStatus = (
  onFailure: OnFailureTypeType,
): EmailDunningStatusType => {
  switch (onFailure) {
    case OnFailureType.cancel:
      return EmailDunningStatus.Cancelled;
    case OnFailureType.skip:
      return EmailDunningStatus.Skipped;
    case OnFailureType.pause:
      return EmailDunningStatus.Paused;
    default:
      throw new Error('Incompatible email dunning status');
  }
};
