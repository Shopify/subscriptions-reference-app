import '@shopify/ui-extensions/preact';

interface VariantInfoProps {
  productName: string;
  variantName: string | undefined;
  image: string | undefined;
}

export const VariantInfo = ({
  productName,
  variantName,
  image,
}: VariantInfoProps) => {
  return (
    <s-stack
      direction="inline"
      gap="base"
      alignContent="center"
      alignItems="center"
      paddingBlock="base"
    >
      <s-box inlineSize="48px" blockSize="48px">
        <s-image src={image} inlineSize="fill"></s-image>
      </s-box>
      <s-stack direction="block" alignContent="start" alignItems="start">
        {productName && <s-text>{productName}</s-text>}
        {variantName && <s-text type="small">{variantName}</s-text>}
      </s-stack>
    </s-stack>
  );
};
