import '@shopify/ui-extensions/preact';
import {EligibleLineItem as EligibleLineItemType} from '../hooks/useEligibleLineItems';

export interface EligibleLineItemProps {
  lineItem: EligibleLineItemType;
  onSelect: () => void;
}

export const EligibleLineItem = ({
  lineItem,
  onSelect,
}: EligibleLineItemProps) => {
  return (
    <s-clickable onClick={onSelect}>
      <s-stack
        direction="inline"
        alignContent="center"
        alignItems="center"
        paddingBlock="base"
        justifyContent="space-between"
      >
        <s-stack direction="inline" alignItems="center" gap="base">
          <s-box inlineSize="48px" blockSize="48px">
            <s-image src={lineItem.image} inlineSize="fill"></s-image>
          </s-box>
          <s-stack
            direction="block"
            alignContent="stretch"
            alignItems="start"
            maxInlineSize="75%"
          >
            {lineItem.productName && <s-text>{lineItem.productName}</s-text>}
            {lineItem.variantName && (
              <s-text type="small" color="subdued">
                {lineItem.variantName}
              </s-text>
            )}
            {lineItem.subtitle.focused ? (
              <s-text type="small" tone="warning">
                {lineItem.subtitle.text}
              </s-text>
            ) : (
              <s-text type="small" color="subdued">
                {lineItem.subtitle.text}
              </s-text>
            )}
          </s-stack>
        </s-stack>
        <s-icon
          type={
            lineItem.hasSellingPlan ? 'check-circle-filled' : 'chevron-right'
          }
          tone={lineItem.hasSellingPlan ? 'success' : 'auto'}
        />
      </s-stack>
    </s-clickable>
  );
};
