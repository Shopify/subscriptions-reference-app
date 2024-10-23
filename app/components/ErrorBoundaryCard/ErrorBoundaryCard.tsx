import {Card, Text, EmptyState, Link, Page} from '@shopify/polaris';
import {useTranslation} from 'react-i18next';

export const ErrorBoundaryCard = () => {
  const {t} = useTranslation('common');
  return (
    <Page title={t('errorBoundary.title')}>
      <Card>
        <EmptyState
          heading={t('errorBoundary.header')}
          image="/images/circle-alert.svg"
          action={{
            content: t('errorBoundary.reloadAction'),
            onAction: () => {
              window.location.reload();
            },
          }}
        >
          <Text as="p" variant="bodyMd">
            {t('errorBoundary.description', {
              statusPageLink: (
                <Link url="https://help.shopify.com/" target="_blank">
                  {t('errorBoundary.statusPageLinkText')}
                </Link>
              ),
            })}
          </Text>
        </EmptyState>
      </Card>
    </Page>
  );
};
