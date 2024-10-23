import type {PropsWithChildren} from 'react';

/**
 * This file contains mocks for Admin UI extension components.
 * Since Admin UI extensions run in a remote-ui environement with no DOM, the extension components
 * do not work with React Testing Library. Instead of setting up another testing framework, these mocks
 * allow us to test our extension with the existing testing framework.
 * IMPORTANT: MAKE SURE TO IMPORT THIS BEFORE ANY COMPONENTS IN TEST FILES OR IT WILL NOT GET CALLED
 */

import {vi} from 'vitest';
import type {
  BoxProps,
  ButtonProps,
  CheckboxProps,
  ChoiceListProps,
  NumberFieldProps,
  SelectProps,
  TextFieldProps,
} from '@shopify/ui-extensions/admin';
import type {AdminActionProps} from '@shopify/ui-extensions-react/admin';

function MockAdminAction({
  children,
  primaryAction,
  secondaryAction,
}: PropsWithChildren<AdminActionProps>) {
  return (
    <div>
      {children}
      <div>
        {primaryAction as React.ReactElement}
        {secondaryAction as React.ReactElement}
      </div>
    </div>
  );
}

function MockTextField({
  label,
  value,
  onChange,
}: PropsWithChildren<TextFieldProps>) {
  return (
    <label>
      {label}
      <input
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      />
    </label>
  );
}

function MockNumberField({
  label,
  value,
  onChange,
}: PropsWithChildren<NumberFieldProps>) {
  return (
    <label>
      {label}
      <input
        type="number"
        value={value}
        onChange={
          onChange ? (e) => onChange(Number(e.target.value)) : undefined
        }
      />
    </label>
  );
}

function MockCheckbox({
  children,
  checked,
  onChange,
}: PropsWithChildren<CheckboxProps>) {
  return (
    <label>
      <input
        type="checkbox"
        checked={checked}
        onChange={
          onChange ? (e) => onChange(Boolean(e.target.value)) : undefined
        }
      />
      {children}
    </label>
  );
}

function MockSelect({
  label,
  value,
  onChange,
  options,
}: PropsWithChildren<SelectProps>) {
  return (
    <label>
      {label}
      <select
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      >
        {options.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function MockButton({children, onPress}: PropsWithChildren<ButtonProps>) {
  return <button onClick={onPress}>{children}</button>;
}

function MockPressable({onPress, accessibilityLabel, children}: any) {
  return (
    <button onClick={onPress} aria-label={accessibilityLabel}>
      {children}
    </button>
  );
}

function ChoiceListMock({
  name,
  choices,
  value,
  onChange,
}: PropsWithChildren<ChoiceListProps>) {
  return (
    <fieldset>
      {choices?.map((choice: any) => (
        <label key={choice.id}>
          <input
            type="radio"
            name={name}
            value={choice.id}
            checked={value?.includes(choice.id)}
            onChange={onChange ? () => onChange([choice.id]) : undefined}
          />
          {choice.label}
        </label>
      ))}
    </fieldset>
  );
}

function MockBox({children, ...rest}: PropsWithChildren<BoxProps>) {
  return <div {...rest}>{children}</div>;
}

export function mockAdminUiExtension() {
  vi.mock('@shopify/ui-extensions-react/admin', async () => {
    return {
      ...(await vi.importActual('@shopify/ui-extensions-react/admin')),
      AdminAction: (props: any) => <MockAdminAction {...props} />,
      TextField: (props: any) => <MockTextField {...props} />,
      NumberField: (props: any) => <MockNumberField {...props} />,
      Checkbox: (props: any) => <MockCheckbox {...props} />,
      Select: (props: any) => <MockSelect {...props} />,
      Button: (props: any) => <MockButton {...props} />,
      Pressable: (props: any) => <MockPressable {...props} />,
      ChoiceList: (props: any) => <ChoiceListMock {...props} />,
      Box: (props: any) => <MockBox {...props} />,
    };
  });
}
