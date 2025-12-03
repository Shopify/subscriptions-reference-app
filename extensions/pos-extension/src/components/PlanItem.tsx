import '@shopify/ui-extensions/preact';
interface PlanItemProps {
  title: string;
  subtitle?: string;
  price?: string;
  isSelected: boolean;
  onSelect: () => void;
}

export const PlanItem = ({
  title,
  subtitle,
  price,
  isSelected,
  onSelect,
}: PlanItemProps) => {
  return (
    <s-clickable onClick={onSelect}>
      <s-stack
        direction="inline"
        alignItems="center"
        alignContent="center"
        paddingBlock="base"
        inlineSize="100%"
      >
        <s-box paddingInlineEnd="base">
          <s-icon type={isSelected ? 'check-circle-filled' : 'circle'}></s-icon>
        </s-box>
        <s-stack direction="block">
          <s-text>{title}</s-text>
          {subtitle && <s-text type="small">{subtitle}</s-text>}
        </s-stack>
        {price && (
          <s-stack
            direction="inline"
            gap="large-400"
            alignItems="center"
            alignContent="center"
          >
            <s-text>{price}</s-text>
          </s-stack>
        )}
      </s-stack>
    </s-clickable>
  );
};
