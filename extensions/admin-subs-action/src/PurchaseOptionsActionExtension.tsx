import {useEffect, useState} from 'react';
import {
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
  ProgressIndicator,
} from '@shopify/ui-extensions-react/admin';
import {nodesFromEdges} from '@shopify/admin-graphql-api-utilities';
import type {DiscountTypeType} from './consts';
import {
  DeliveryInterval,
  DiscountType,
  EXTENSION_TARGET_PRODUCT,
} from './consts';
import {DeliveryOption} from './models/DeliveryOption';
import {useExtensionApi} from 'foundation/api';
import {DeliveryOptionItem} from './DeliveryOptionItem';
import {useSellingPlanGroupDetails} from './hooks/useSellingPlanGroupDetails';
import {useCreateSellingPlanGroup} from './hooks/useCreateSellingPlanGroup';
import {useUpdateSellingPlanGroup} from './hooks/useUpdateSellingPlanGroup';
import {useExtensionTarget} from 'foundation/AdminExtensionContext';
import {useShop} from './hooks/useShop';
import {getExtensionSellingPlanGroupValidator} from './validator';
import type {ZodIssue} from 'zod';

export default function PurchaseOptionsActionExtension() {
  // Need to change the extension target once the types are updated with our new target
  // Using an existing one for now so that i18n and close are typed
  const extensionTarget = useExtensionTarget();
  const {i18n, close, data} = useExtensionApi({extensionTarget});
  const {getShopInfo} = useShop();

  const {
    createSellingPlanGroup,
    graphqlLoading: createSellingPlanGroupLoading,
  } = useCreateSellingPlanGroup();
  const {
    updateSellingPlanGroup,
    graphqlLoading: updateSellingPlanGroupLoading,
  } = useUpdateSellingPlanGroup();

  const {selected} = data;

  const sellingPlanGroupId = selected[0]['sellingPlanId'];
  const {sellingPlanGroup, loading: sellingPlanGroupLoading} =
    useSellingPlanGroupDetails({
      id: sellingPlanGroupId,
    });

  const graphqlLoading =
    createSellingPlanGroupLoading ||
    updateSellingPlanGroupLoading ||
    sellingPlanGroupLoading;

  const initialSellingPlanIds = nodesFromEdges(
    sellingPlanGroup?.sellingPlans.edges ?? [],
  ).map(({id}) => id);

  // selected product or variant id
  const resourceId = selected.length > 0 ? selected[0].id : undefined;

  const [errors, setErrors] = useState<{field: string; message: string}[]>([]);
  const [issues, setIssues] = useState<ZodIssue[]>([]);

  // The choice list component's value is not updated in the UI after the initial render
  // and will show the first value that discountType is set to, which is PERCENTAGE
  // Workaround: do not render the choice list component until the selling plan group is fetched
  // so the initial value is set to the discount type from the selling plan group
  const [sellingPlanGroupFetchFinished, setSellingPlanGroupFetchFinished] =
    useState(Boolean(!sellingPlanGroupId));

  const [offerDiscount, setOfferDiscount] = useState(true);
  const [discountType, setDiscountType] = useState<DiscountTypeType>(
    DiscountType.PERCENTAGE,
  );

  const [merchantCode, setMerchantCode] = useState('');
  const [planName, setPlanName] = useState('');
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([
    new DeliveryOption(1, DeliveryInterval.WEEK, 0, discountType, i18n),
  ]);

  const validator = getExtensionSellingPlanGroupValidator(i18n.translate);

  useEffect(() => {
    if (sellingPlanGroup) {
      const firstSellingPlan = nodesFromEdges(
        sellingPlanGroup.sellingPlans.edges,
      )[0];

      const discountType =
        firstSellingPlan.pricingPolicies?.length > 0
          ? firstSellingPlan.pricingPolicies[0].adjustmentType
          : DiscountType.NONE;

      setMerchantCode(sellingPlanGroup.merchantCode);
      setPlanName(sellingPlanGroup.name);

      setOfferDiscount(discountType !== DiscountType.NONE);

      setDeliveryOptions(
        nodesFromEdges(sellingPlanGroup.sellingPlans.edges).map((plan) =>
          DeliveryOption.fromSellingPlan(plan, i18n),
        ),
      );

      setDiscountType(discountType);
      setSellingPlanGroupFetchFinished(true);
    }
  }, [sellingPlanGroup]);

  const addDeliveryOption = () => {
    setDeliveryOptions([
      ...deliveryOptions,
      new DeliveryOption(1, DeliveryInterval.WEEK, 0, discountType, i18n),
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

    const validationResult = validator.safeParse({
      merchantCode,
      planName,
      deliveryOptions,
    });

    if (!validationResult.success) {
      const {error} = validationResult;
      setIssues(error.issues);
      return;
    }

    if (sellingPlanGroupId) {
      const deliveryOptionsToUpdate: DeliveryOption[] = [];
      const deliveryOptionsToCreate: DeliveryOption[] = [];

      const sellingPlansToDelete: string[] = initialSellingPlanIds.filter(
        (id) => !deliveryOptions.some((option) => option.sellingPlanId === id),
      );

      deliveryOptions.forEach((option) => {
        if (option.sellingPlanId) {
          deliveryOptionsToUpdate.push(option);
        } else {
          deliveryOptionsToCreate.push(option);
        }
      });

      const [sellingPlansToUpdate, sellingPlansToCreate] = [
        deliveryOptionsToUpdate,
        deliveryOptionsToCreate,
      ].map((options) =>
        options.map((option) => option.toSellingPlanInput(currencyCode)),
      );

      const {data, errors} = await updateSellingPlanGroup({
        id: sellingPlanGroupId,
        input: {
          merchantCode,
          name: planName,
          sellingPlansToUpdate,
          sellingPlansToCreate,
          sellingPlansToDelete,
        },
      });

      if (errors.length > 0) {
        setErrors(errors);
        return;
      }

      if (data?.sellingPlanGroupUpdate?.sellingPlanGroup?.id) {
        setErrors([]);
        new Notification(i18n.translate('success.update'));
        close();
        return;
      }
    }

    const sellingPlansToCreate = deliveryOptions.map((option) =>
      option.toSellingPlanInput(currencyCode),
    );

    const {data, errors} = await createSellingPlanGroup({
      input: {
        name: planName,
        merchantCode,
        sellingPlansToCreate,
        options: [i18n.translate('deliveryFrequency')],
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

  if (graphqlLoading) {
    return (
      <BlockStack inlineAlignment="center">
        <ProgressIndicator size="large-300" />
      </BlockStack>
    );
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
                <Box key={index}>{error.message}</Box>
              ))}
            </BlockStack>
          </Banner>
        ) : null}

        <TextField
          name="planName"
          label={i18n.translate('planName.label')}
          // @ts-ignore
          helpText={i18n.translate('planName.helpText')}
          placeholder={i18n.translate('planName.placeholder')}
          value={planName}
          onChange={setPlanName}
          error={issues.find((issue) => issue.path[0] === 'planName')?.message}
        />
        <TextField
          name="merchantCode"
          label={i18n.translate('merchantCode.label')}
          // @ts-ignore
          helpText={i18n.translate('merchantCode.helpText')}
          value={merchantCode}
          onChange={setMerchantCode}
          error={
            issues.find((issue) => issue.path[0] === 'merchantCode')?.message
          }
        />
        <BlockStack gap="base">
          <Checkbox
            id="checkbox"
            name="checkbox"
            onChange={(value) => {
              setOfferDiscount(value);
              if (value && discountType === DiscountType.NONE) {
                setDiscountType(DiscountType.PERCENTAGE);
                deliveryOptions.forEach((option) => {
                  option.discountType = DiscountType.PERCENTAGE;
                  option.discount = 0;
                });
              }

              if (!value) {
                setDiscountType(DiscountType.NONE);
                deliveryOptions.forEach((option) => {
                  option.discountType = DiscountType.NONE;
                  option.discount = undefined;
                });
              }
            }}
            checked={offerDiscount}
          >
            {i18n.translate('offerDiscount')}
          </Checkbox>
        </BlockStack>
        {offerDiscount && sellingPlanGroupFetchFinished ? (
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
                  label: i18n.translate('discountType.fixedPrice'),
                  id: DiscountType.PRICE,
                },
              ]}
              value={discountType}
              onChange={(e) => {
                const newDiscountType = (
                  typeof e === 'string' ? e : e[0]
                ) as DiscountTypeType;

                deliveryOptions.forEach((option) => {
                  option.discountType = newDiscountType;
                });

                setDiscountType(newDiscountType);
              }}
            />
          </Box>
        ) : null}
        <Box data-testid="delivery-options">
          <BlockStack gap>
            {deliveryOptions.map((option, index) => (
              <DeliveryOptionItem
                key={index}
                index={index}
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
                issues={issues}
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
