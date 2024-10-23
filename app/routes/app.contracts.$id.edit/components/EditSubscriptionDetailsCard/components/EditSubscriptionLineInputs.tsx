import {Fragment} from 'react';
import type {Money} from '~/types';
import type {SubscriptionLine} from '../../../validator';

export interface EditSubscriptionLineInputsProps {
  lines: SubscriptionLine[];
}

export function EditSubscriptionLineInputs({
  lines,
}: EditSubscriptionLineInputsProps) {
  return (
    <>
      {lines.map((line, index) => (
        <Fragment key={`lines.${index}.${line.id}`}>
          <input
            hidden
            readOnly
            key={`lines.${index}.${line.id}.id`}
            name={`lines[${index}].id`}
            value={line.id ?? undefined}
          />
          <input
            hidden
            readOnly
            key={`lines.${index}.${line.id}.variantId`}
            name={`lines[${index}].variantId`}
            value={line.variantId ?? undefined}
          />
          <input
            hidden
            readOnly
            key={`lines.${index}.${line.id}.currentPrice.amount`}
            name={`lines[${index}].currentPrice.amount`}
            value={line.currentPrice.amount.toString()}
          />
          <input
            hidden
            readOnly
            key={`lines.${index}.${line.id}.currentOneTimePurchasePrice`}
            name={`lines[${index}].currentOneTimePurchasePrice`}
            value={line.currentOneTimePurchasePrice}
          />
          <input
            hidden
            readOnly
            key={`lines.${index}.${line.id}.currentPrice.currencyCode`}
            name={`lines[${index}].currentPrice.currencyCode`}
            value={line.currentPrice.currencyCode}
          />
          {line.pricingPolicy ? (
            <>
              <input
                hidden
                readOnly
                name={`lines[${index}].pricingPolicy.basePrice.amount`}
                key={`lines.${index}.${line.id}.pricingPolicy.basePrice.amount`}
                value={line.pricingPolicy.basePrice.amount}
              />
              <input
                hidden
                readOnly
                name={`lines[${index}].pricingPolicy.basePrice.currencyCode`}
                key={`lines.${index}.${line.id}.pricingPolicy.basePrice.currencyCode`}
                value={line.pricingPolicy.basePrice.currencyCode}
              />
              {line.pricingPolicy.cycleDiscounts.map(
                (discount, discountIndex) => (
                  <Fragment
                    key={`lines[${index}].pricingPolicy.cycleDiscounts[${discountIndex}]`}
                  >
                    <input
                      hidden
                      readOnly
                      name={`lines[${index}].pricingPolicy.cycleDiscounts[${discountIndex}].afterCycle`}
                      key={`lines.${index}.${line.id}.cycleDiscounts[${discountIndex}].afterCycle`}
                      value={discount.afterCycle}
                    />
                    <input
                      hidden
                      readOnly
                      name={`lines[${index}].pricingPolicy.cycleDiscounts[${discountIndex}].computedPrice.amount`}
                      key={`lines.${index}.${line.id}.cycleDiscounts[${discountIndex}].computedPrice.amount`}
                      value={discount.computedPrice.amount}
                    />
                    <input
                      hidden
                      readOnly
                      name={`lines[${index}].pricingPolicy.cycleDiscounts[${discountIndex}].computedPrice.currencyCode`}
                      key={`lines.${index}.${line.id}.cycleDiscounts[${discountIndex}].computedPrice.currencyCode`}
                      value={discount.computedPrice.currencyCode}
                    />
                    <input
                      hidden
                      readOnly
                      name={`lines[${index}].pricingPolicy.cycleDiscounts[${discountIndex}].adjustmentType`}
                      key={`lines.${index}.${line.id}.cycleDiscounts[${discountIndex}].adjustmentType`}
                      value={discount.adjustmentType}
                    />
                    {discount.adjustmentType === 'PERCENTAGE' ? (
                      <input
                        hidden
                        readOnly
                        name={`lines[${index}].pricingPolicy.cycleDiscounts[${discountIndex}].adjustmentValue.percentage`}
                        key={`lines.${index}.${line.id}.cycleDiscounts[${discountIndex}].adjustmentValue.percentage`}
                        value={
                          (discount.adjustmentValue as {percentage: number})
                            .percentage
                        }
                      />
                    ) : (
                      <>
                        <input
                          hidden
                          readOnly
                          name={`lines[${index}].pricingPolicy.cycleDiscounts[${discountIndex}].adjustmentValue.amount`}
                          key={`lines.${index}.${line.id}.cycleDiscounts[${discountIndex}].adjustmentValue.amount`}
                          value={(discount.adjustmentValue as Money).amount}
                        />
                        <input
                          hidden
                          readOnly
                          name={`lines[${index}].pricingPolicy.cycleDiscounts[${discountIndex}].adjustmentValue.currencyCode`}
                          key={`lines.${index}.${line.id}.cycleDiscounts[${discountIndex}].adjustmentValue.currencyCode`}
                          value={
                            (discount.adjustmentValue as Money).currencyCode
                          }
                        />
                      </>
                    )}
                  </Fragment>
                ),
              )}
            </>
          ) : null}
        </Fragment>
      ))}
    </>
  );
}
