import {useState} from 'react';
import {
  reactExtension,
  AdminAction,
  BlockStack,
  Button,
  TextField,
  Checkbox,
  ChoiceList,
  Box,
  Icon,
  InlineStack,
  Banner,
} from '@shopify/ui-extensions-react/admin';
import type {DiscountTypeType} from './consts';
import {
  DeliveryInterval,
  DiscountType,
  EXTENSION_TARGET_PRODUCT,
  EXTENSION_TARGET_PRODUCT_VARIANT,
} from './consts';
import {DeliveryOption} from './models/DeliveryOption';
import {useExtensionApi} from 'foundation/api';
import {DeliveryOptionItem} from './DeliveryOptionItem';
import {useCreateSellingPlanGroup} from './hooks/useCreateSellingPlanGroup';
import AdminExtensionContext, {
  useExtensionTarget,
} from 'foundation/AdminExtensionContext';
import {useShop} from './hooks/useShop';

reactExtension(EXTENSION_TARGET_PRODUCT, () => (
  <AdminExtensionContext.Provider value={EXTENSION_TARGET_PRODUCT}>
    <AdminSubsAction />
  </AdminExtensionContext.Provider>
));

reactExtension(EXTENSION_TARGET_PRODUCT_VARIANT, () => (
  <AdminExtensionContext.Provider value={EXTENSION_TARGET_PRODUCT_VARIANT}>
    <AdminSubsAction />
  </AdminExtensionContext.Provider>
));

export function AdminSubsAction() {
  // Need to change the extension target once the types are updated with our new target
  // Using an existing one for now so that i18n and close are typed
  const extensionTarget = useExtensionTarget();
  const {i18n, close, data} = useExtensionApi({extensionTarget});
  const {createSellingPlanGroup, graphqlLoading} = useCreateSellingPlanGroup();
  const {getShopInfo} = useShop();

  const {selected} = data;

  // selected product or variant id
  const resourceId = selected.length > 0 ? selected[0].id : undefined;

  const [errors, setErrors] = useState<{field: string; message: string}[]>([]);
  const [merchantCode, setMerchantCode] = useState('');
  const [planName, setPlanName] = useState('');
  const [offerDiscount, setOfferDiscount] = useState(true);
  const [discountType, setDiscountType] = useState<DiscountTypeType>(
    DiscountType.PERCENTAGE,
  );

  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([
    new DeliveryOption(1, DeliveryInterval.WEEK, 0, discountType),
  ]);

  const addDeliveryOption = () => {
    setDeliveryOptions([
      ...deliveryOptions,
      new DeliveryOption(1, DeliveryInterval.WEEK, 0, discountType),
    ]);
  };

  const updateDeliveryOption = (index: number, field: string, value: any) => {
    const newOptions = [...deliveryOptions];
    newOptions[index][field] = value;
    setDeliveryOptions(newOptions);
  };

  const removeDeliveryOption = (index: number) => {
    const newOptions = deliveryOptions.filter((_, i) => i !== index);
    setDeliveryOptions(newOptions);
  };

  async function handleSave() {
    if (!resourceId) {
      throw new Error('Error fetching the product or variant ID');
    }

    const resources =
      extensionTarget === EXTENSION_TARGET_PRODUCT
        ? {productIds: [resourceId]}
        : {productVariantIds: [resourceId]};

    const shopInfo = await getShopInfo();
    const currencyCode = shopInfo?.currencyCode ?? 'USD';

    setErrors([]);

    const sellingPlansToCreate = deliveryOptions.map((option) =>
      option.toSellingPlanInput(
        i18n.translate,
        i18n.formatCurrency,
        currencyCode,
      ),
    );

    const {data, errors} = await createSellingPlanGroup({
      input: {
        name: planName,
        merchantCode,
        sellingPlansToCreate,
        options: ['Delivery every'],
      },
      resources,
    });

    if (errors.length > 0) {
      setErrors(errors);
      return;
    }

    if (data?.sellingPlanGroupCreate?.sellingPlanGroup?.id) {
      setErrors([]);
      new Notification(i18n.translate('success.create'));
      close();
    }
  }

  return (
    <AdminAction
      primaryAction={
        <Button onPress={handleSave} disabled={graphqlLoading}>
          {i18n.translate('save')}
        </Button>
      }
      secondaryAction={
        <Button
          onPress={() => {
            setErrors([]);
            close();
          }}
        >
          {i18n.translate('cancel')}
        </Button>
      }
    >
      <BlockStack gap="base">
        {errors.length > 0 ? (
          <Banner tone="critical">
            <BlockStack gap="small">
              {errors.map((error, index) => (
                <Box key={index}>{[error.field, error.message].join(': ')}</Box>
              ))}
            </BlockStack>
          </Banner>
        ) : null}

        <TextField
          label={i18n.translate('planName.label')}
          // @ts-ignore
          helpText={i18n.translate('planName.helpText')}
          placeholder={i18n.translate('planName.placeholder')}
          value={planName}
          onChange={setPlanName}
        />
        <TextField
          label={i18n.translate('merchantCode.label')}
          // @ts-ignore
          helpText={i18n.translate('merchantCode.helpText')}
          value={merchantCode}
          onChange={setMerchantCode}
        />
        <BlockStack gap="base">
          <Checkbox
            id="checkbox"
            name="checkbox"
            onChange={() => setOfferDiscount(!offerDiscount)}
            checked={offerDiscount}
          >
            {i18n.translate('offerDiscount')}
          </Checkbox>
        </BlockStack>
        {offerDiscount && (
          <Box data-testid="discount-type">
            <ChoiceList
              name="discountType"
              choices={[
                {
                  label: i18n.translate('discountType.percentageOff'),
                  id: DiscountType.PERCENTAGE,
                },
                {
                  label: i18n.translate('discountType.amountOff'),
                  id: DiscountType.AMOUNT,
                },
                {
                  label: i18n.translate('discountType.flatRate'),
                  id: DiscountType.PRICE,
                },
              ]}
              defaultValue={[DiscountType.PERCENTAGE]}
              value={[discountType]}
              onChange={(e) => {
                const newDiscountType = (
                  typeof e === 'string' ? e : e[0]
                ) as DiscountTypeType;

                setDiscountType(newDiscountType);
                deliveryOptions.forEach((option) => {
                  option.discountType = newDiscountType;
                });
              }}
            />
          </Box>
        )}
        <Box data-testid="delivery-options">
          <BlockStack gap>
            {deliveryOptions.map((option, index) => (
              <DeliveryOptionItem
                key={index}
                option={option}
                offerDiscount={offerDiscount}
                discountType={discountType}
                updateDeliveryOption={(field: string, value: string) =>
                  updateDeliveryOption(index, field, value)
                }
                removeDeliveryOption={
                  deliveryOptions.length === 1
                    ? undefined
                    : () => removeDeliveryOption(index)
                }
                extensionTarget={extensionTarget}
              />
            ))}
          </BlockStack>
        </Box>
        <Button
          onPress={addDeliveryOption}
          // TODO: Reach out to about supporting accessibilityLabel
          // accessibilityLabel={i18n.translate(
          //   'addOptionButton.accessibilityLabel',
          // )}
        >
          <InlineStack blockAlignment="center" gap="small">
            <Icon name="CirclePlusMinor" />
            {i18n.translate('addOptionButton.label')}
          </InlineStack>
        </Button>
      </BlockStack>
    </AdminAction>
  );
}
