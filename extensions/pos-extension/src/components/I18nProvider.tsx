import {useEffect} from 'preact/hooks';
import {useLocaleSubscription} from '@shopify/ui-extensions-react/point-of-sale';
import i18n from '../i18n/config';
import {LocaleApiContent} from '@shopify/ui-extensions/point-of-sale';

const I18nProvider = ({
  children,
  locale,
}: {
  children: preact.JSX.Element;
  locale: LocaleApiContent;
}) => {
  useEffect(() => {
    i18n.changeLanguage(locale.current.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale.current.value]);
  return children;
};

export default I18nProvider;
