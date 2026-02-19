import { useEffect, useState, useCallback } from "react";
import {
  extend,
  render,
  useExtensionInput,
  BlockStack,
  Button,
  CalloutBanner,
  Heading,
  Image,
  Text,
  TextContainer,
  Separator,
  Tiles,
  TextBlock,
  Layout,
  Select,
  BuyerConsent,
} from "@shopify/post-purchase-ui-extensions-react";

// Automatically set by Shopify CLI during `shopify app dev`
const APP_URL = process.env.SHOPIFY_APP_URL;

const INTERVAL_LABELS = {
  DAY: { singular: "day", plural: "days" },
  WEEK: { singular: "week", plural: "weeks" },
  MONTH: { singular: "month", plural: "months" },
  YEAR: { singular: "year", plural: "years" },
};

function formatInterval(interval, intervalCount) {
  const labels = INTERVAL_LABELS[interval] || { singular: interval.toLowerCase(), plural: interval.toLowerCase() + "s" };
  if (intervalCount === 1) return labels.singular;
  return `${intervalCount} ${labels.plural}`;
}

// Preload data from your app server to ensure that the extension loads quickly.
extend(
  "Checkout::PostPurchase::ShouldRender",
  async ({ inputData, storage }) => {
    const postPurchaseOffer = await fetch(`${APP_URL}/api/offer`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${inputData.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        referenceId: inputData.initialPurchase.referenceId,
      }),
    }).then((response) => response.json());

    const hasOffers = postPurchaseOffer.offers && postPurchaseOffer.offers.length > 0;

    if (!hasOffers) {
      return { render: false };
    }

    const hasSubscriptionOffer = postPurchaseOffer.offers.some(
      (offer) => offer.hasSubscriptionOption
    );
    const hasEmail = Boolean(inputData.initialPurchase?.customerInfo?.email);

    if (hasSubscriptionOffer && !hasEmail) {
      return { render: false };
    }

    await storage.update(postPurchaseOffer);

    return { render: true };
  }
);

render("Checkout::PostPurchase::Render", () => <App />);

export function App() {
  const { storage, inputData, calculateChangeset, applyChangeset, done } =
    useExtensionInput();
  const [loading, setLoading] = useState(true);
  const [calculatedPurchase, setCalculatedPurchase] = useState();
  // Default to the first subscription plan if available, otherwise one-time
  const defaultPlan = storage.initialData.offers[0]?.sellingPlanOptions?.find(
    (opt) => opt.value !== "one-time"
  )?.value || "one-time";
  const [selectedPlan, setSelectedPlan] = useState(defaultPlan);
  const [buyerConsent, setBuyerConsent] = useState(false);

  const { offers } = storage.initialData;
  const purchaseOption = offers[0];

  const isSubscription = selectedPlan !== "one-time";

  // Get the currently selected plan details
  const currentPlan = purchaseOption.sellingPlanOptions?.find(
    (opt) => opt.value === selectedPlan
  );

  // Format the interval string for the current plan
  const intervalLabel = currentPlan?.interval
    ? formatInterval(currentPlan.interval, currentPlan.intervalCount)
    : "";

  // Build the changes array based on the selected plan
  const getChangesForPlan = useCallback(() => {
    if (!isSubscription) {
      return purchaseOption.changes;
    }

    const plan = purchaseOption.sellingPlanOptions?.find(
      (opt) => opt.value === selectedPlan
    );

    if (!plan) return purchaseOption.changes;

    return [
      {
        type: "add_subscription",
        variantID: purchaseOption.changes[0].variantID,
        quantity: 1,
        discount: {
          value: plan.discount,
          valueType: "percentage",
          title: `Subscribe & save ${plan.discount}%`,
        },
        sellingPlanID: parseInt(plan.value, 10),
        initialShippingPrice: "0.00",
        recurringShippingPrice: "0.00",
      },
      {
        type: "add_shipping_line",
        price: "0.00",
        title: "Free shipping on subscriptions",
      },
    ];
  }, [selectedPlan, purchaseOption, isSubscription]);

  // Recalculate changeset when plan selection changes
  useEffect(() => {
    async function calculatePurchase() {
      setLoading(true);
      const changes = getChangesForPlan();
      const result = await calculateChangeset({ changes });
      setCalculatedPurchase(result.calculatedPurchase);
      setLoading(false);
    }

    calculatePurchase();
  }, [calculateChangeset, selectedPlan, getChangesForPlan]);

  // Compute fallback price from the offer data based on selected plan
  const fallbackPrice = currentPlan
    ? (parseFloat(purchaseOption.originalPrice) * (1 - currentPlan.discount / 100)).toFixed(2)
    : purchaseOption.discountedPrice;

  // Extract values from the calculated purchase, falling back to offer data.
  const shipping =
    calculatedPurchase?.addedShippingLines?.[0]?.priceSet?.presentmentMoney
      ?.amount ?? "0.00";
  const taxes =
    calculatedPurchase?.addedTaxLines?.[0]?.priceSet?.presentmentMoney?.amount ?? "0.00";
  const discountedPrice =
    calculatedPurchase?.updatedLineItems?.[0]?.totalPriceSet?.presentmentMoney
      ?.amount || fallbackPrice;
  const originalPrice =
    calculatedPurchase?.updatedLineItems?.[0]?.priceSet?.presentmentMoney?.amount || purchaseOption.originalPrice;
  const total = calculatedPurchase?.totalOutstandingSet?.presentmentMoney?.amount || fallbackPrice;

  // Discount percentage for display
  const savingsPercent = currentPlan?.discount || 0;

  async function acceptOffer() {
    if (isSubscription && !buyerConsent) {
      return;
    }

    setLoading(true);

    const token = await fetch(`${APP_URL}/api/sign-changeset`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${inputData.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        referenceId: inputData.initialPurchase.referenceId,
        changes: purchaseOption.id,
        sellingPlanId: selectedPlan,
      }),
    })
      .then((response) => response.json())
      .then((response) => response.token)
      .catch((e) => console.log(e));

    let result;
    if (isSubscription) {
      result = await applyChangeset(token, {
        buyerConsentToSubscriptions: buyerConsent,
      });
    } else {
      result = await applyChangeset(token);
    }

    done();
  }

  function declineOffer() {
    setLoading(true);
    done();
  }

  return (
    <BlockStack spacing="loose">
      <CalloutBanner>
        <BlockStack spacing="tight">
          <TextContainer>
            <Text size="medium" emphasized>
              {isSubscription
                ? `Subscribe & save ${savingsPercent}%`
                : "Exclusive post-purchase offer"}
            </Text>
          </TextContainer>
          <TextContainer>
            <Text size="medium">
              {isSubscription
                ? `Get ${purchaseOption.productTitle} delivered every ${intervalLabel} and never run out.`
                : `Add ${purchaseOption.productTitle} to your order at a special discount.`}
            </Text>
          </TextContainer>
        </BlockStack>
      </CalloutBanner>
      <Layout
        media={[
          { viewportSize: "small", sizes: [1, 0, 1], maxInlineSize: 0.9 },
          { viewportSize: "medium", sizes: [532, 0, 1], maxInlineSize: 420 },
          { viewportSize: "large", sizes: [560, 38, 340] },
        ]}
      >
        <Image
          description="product photo"
          source={purchaseOption.productImageURL}
        />
        <BlockStack />
        <BlockStack>
          <Heading>{purchaseOption.productTitle}</Heading>
          <PriceHeader
            discountedPrice={discountedPrice}
            originalPrice={originalPrice}
            loading={false}
          />
          <ProductDescription textLines={purchaseOption.productDescription} />

          {/* Selling plan selector */}
          {purchaseOption.hasSubscriptionOption &&
            purchaseOption.sellingPlanOptions && (
              <Select
                label="Purchase option"
                value={selectedPlan}
                onChange={(value) => {
                  setSelectedPlan(value);
                  setBuyerConsent(false);
                }}
                options={purchaseOption.sellingPlanOptions.map((opt) => ({
                  label: opt.label,
                  value: opt.value,
                }))}
              />
            )}

          {/* Recurring charge info */}
          {isSubscription && (
            <TextContainer>
              <Text size="small" subdued>
                {formatCurrency(discountedPrice)} billed every {intervalLabel}
              </Text>
            </TextContainer>
          )}

          <BlockStack spacing="tight">
            <Separator />
            <MoneyLine
              label="Subtotal"
              amount={discountedPrice}
              loading={false}
            />
            <MoneyLine
              label="Shipping"
              amount={shipping}
              loading={false}
            />
            <MoneyLine
              label="Taxes"
              amount={taxes}
              loading={false}
            />
            <Separator />
            <MoneySummary label="Total due today" amount={total} />
          </BlockStack>

          {/* Buyer consent for subscriptions — required */}
          {isSubscription && (
            <BuyerConsent
              policy="subscriptions"
              checked={buyerConsent}
              onChange={setBuyerConsent}
            />
          )}

          <BlockStack>
            <Button
              onPress={acceptOffer}
              submit
              loading={loading}
              disabled={isSubscription && !buyerConsent}
            >
              {isSubscription
                ? `Subscribe — ${formatCurrency(total)}/${intervalLabel}`
                : `Add to order — ${formatCurrency(total)}`}
            </Button>
            <Button onPress={declineOffer} subdued loading={loading}>
              No thanks
            </Button>
          </BlockStack>
        </BlockStack>
      </Layout>
    </BlockStack>
  );
}

function PriceHeader({ discountedPrice, originalPrice, loading }) {
  return (
    <TextContainer alignment="leading" spacing="loose">
      <Text role="deletion" size="large">
        {!loading && formatCurrency(originalPrice)}
      </Text>
      <Text emphasized size="large" appearance="critical">
        {" "}
        {!loading && formatCurrency(discountedPrice)}
      </Text>
    </TextContainer>
  );
}

function ProductDescription({ textLines }) {
  return (
    <BlockStack spacing="xtight">
      {textLines.map((text, index) => (
        <TextBlock key={index} subdued>
          {text}
        </TextBlock>
      ))}
    </BlockStack>
  );
}

function MoneyLine({ label, amount, loading = false }) {
  return (
    <Tiles>
      <TextBlock size="small">{label}</TextBlock>
      <TextContainer alignment="trailing">
        <TextBlock emphasized size="small">
          {loading ? "-" : formatCurrency(amount)}
        </TextBlock>
      </TextContainer>
    </Tiles>
  );
}

function MoneySummary({ label, amount }) {
  return (
    <Tiles>
      <TextBlock size="medium" emphasized>
        {label}
      </TextBlock>
      <TextContainer alignment="trailing">
        <TextBlock emphasized size="medium">
          {formatCurrency(amount)}
        </TextBlock>
      </TextContainer>
    </Tiles>
  );
}

function formatCurrency(amount) {
  if (!amount || amount === "0.00") {
    return "Free";
  }
  return `$${amount}`;
}
