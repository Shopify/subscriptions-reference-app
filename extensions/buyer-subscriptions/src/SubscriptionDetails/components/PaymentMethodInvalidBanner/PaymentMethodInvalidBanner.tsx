import {Banner} from '@shopify/ui-extensions-react/customer-account';
import {useExtensionApi} from 'foundation/Api';
import type {CustomerCreditCard} from 'types';
import {brandLabels} from 'utilities/constants';

interface Props {
  creditCard: CustomerCreditCard;
}

export function PaymentMethodInvalidBanner({creditCard}: Props) {
  const {i18n} = useExtensionApi();

  const {brand, lastDigits} = creditCard;

  const formattedBrandKey = brand.toLowerCase().replace(/[^a-z0-9]+/gi, '');
  const brandLabel = brandLabels.get(formattedBrandKey);

  const title = brandLabel
    ? i18n.translate(`paymentMethodInvalidBanner`, {
        brand: brandLabel,
        lastDigits,
      })
    : i18n.translate('paymentMethodInvalidBannerGeneric', {
        lastDigits,
      });

  return <Banner status="critical" title={title} />;
}
