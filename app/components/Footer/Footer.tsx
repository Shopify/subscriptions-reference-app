import {FooterHelp, Link} from '@shopify/polaris';
import {useTranslation} from 'react-i18next';

type FooterProps = {
  page: string;
  link: string;
};

export const Footer = ({page, link}: FooterProps) => {
  const {t} = useTranslation('common');
  const pageText = 'footer.' + page;
  return (
    <FooterHelp>
      {t('footer.learnMore', {
        topicName: (
          <Link url={link} target="_blank">
            {t(pageText)}
          </Link>
        ),
      })}
    </FooterHelp>
  );
};
