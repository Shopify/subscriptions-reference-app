import '@shopify/ui-extensions/preact';
import {isSuccess} from '../utils/asyncState';
import {EligibleLineItem} from '../components/EligibleLineItem';
import {useEligibleLineItems} from '../hooks/useEligibleLineItems';
import {
  CartApiContent,
  ProductSearchApiContent,
} from '@shopify/ui-extensions/point-of-sale';
import {getPlural} from '../utils/locale';
import {PreactI18n} from '../i18n/config';

interface Props {
  cart: CartApiContent;
  productSearch: ProductSearchApiContent;
  i18n: PreactI18n;
}

export const EligibleLineItemsScreen = ({cart, productSearch, i18n}: Props) => {
  const {state} = useEligibleLineItems(cart.current.value, productSearch, i18n);

  return (
    <s-page>
      <s-scroll-box>
        {isSuccess(state) && (
          <s-stack
            direction="block"
            alignContent="stretch"
            inlineSize="100%"
            paddingInline="large-100"
          >
            <s-section
              heading={getPlural(
                i18n,
                'ElegibleLineItems.header.available',
                state.data.length,
              )}
            >
              {state.data.map((lineItem, index) => (
                <EligibleLineItem
                  key={`group-${index}`}
                  lineItem={lineItem}
                  onSelect={() => {
                    navigation.navigate('subscription', {
                      state: {lineItem: lineItem.data},
                    });
                  }}
                />
              ))}
            </s-section>
          </s-stack>
        )}
      </s-scroll-box>
    </s-page>
  );
};
