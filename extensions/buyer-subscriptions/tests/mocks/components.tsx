// These mock components are needed because of the issue with Button missing remote-ui context
import type {PropsWithChildren, ReactElement} from 'react';
import type {
  SelectProps,
  TextFieldProps,
  LinkProps,
  ChoiceProps,
  ButtonProps,
} from '@shopify/ui-extensions-react/customer-account';
import {useState} from 'react';

// https://github.com/Shopify/core-issues/issues/49655

export function MockButton({
  children,
  onPress,
  overlay,
  accessibilityLabel,
  disabled,
}: ButtonProps) {
  const [showOverlay, setShowOverlay] = useState(false);

  function handleClick() {
    if (onPress) {
      onPress();
    }

    if (overlay) {
      setShowOverlay(!showOverlay);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label={accessibilityLabel}
      >
        {children}
      </button>
      {showOverlay ? overlay : null}
    </>
  );
}

export function MockPopover({children}: {children: React.ReactNode}) {
  return <>{children}</>;
}

export function MockPressable({
  children,
  overlay,
}: {
  children: React.ReactNode;
  overlay?: React.ReactNode;
}) {
  return (
    <>
      <div>{children}</div>
      {overlay}
    </>
  );
}

export function MockTextField({
  value,
  label,
  error,
  disabled,
  onChange,
}: TextFieldProps) {
  return (
    <>
      <div>{error}</div>
      <label>
        <span>{label}</span>
      </label>
      <div>
        <input
          aria-label={label}
          type="text"
          value={value}
          disabled={disabled}
          onChange={(event) => {
            onChange && onChange(event.target.value);
          }}
        />
      </div>
    </>
  );
}

export function MockLink(props: LinkProps) {
  return (
    <>
      <div>{props.children}</div>
    </>
  );
}

export function MockPage({
  children,
  secondaryAction,
  title,
}: {
  children: ReactElement;
  secondaryAction: ReactElement;
  title: string;
}) {
  return (
    <>
      {secondaryAction}
      {title}
      {children}
    </>
  );
}

export interface MockResourceItemProps
  extends PropsWithChildren,
    Pick<LinkProps, 'to' | 'onPress' | 'overlay' | 'accessibilityLabel'> {
  action?: ReactElement;
  actionLabel?: string;
}
export function MockResourceItem({
  onPress,
  overlay,
  actionLabel,
  action,
  accessibilityLabel,
  children,
}: MockResourceItemProps) {
  return (
    <>
      <span>{accessibilityLabel}</span>
      {children}
      {action}
    </>
  );
}

export interface MockPhoneFieldProps {
  label: string;
  onChange?: (event: any) => void;
  value?: string;
  error?: string;
  disabled?: boolean;
}
export function MockPhoneField({
  label,
  onChange,
  value,
  error,
  disabled,
}: MockPhoneFieldProps) {
  return (
    <>
      <select onChange={onChange}>
        <option value={value}>{label}</option>
      </select>
    </>
  );
}

export function MockChoice({id, disabled, children}: ChoiceProps) {
  return (
    <>
      <div>
        <input
          type="radio"
          id={id}
          disabled={disabled}
          name="choice"
          value={id}
        />
        <label htmlFor={id}></label>
      </div>
      <div>{children}</div>
    </>
  );
}

export function MockSelect({
  id,
  name,
  label,
  value,
  options,
  onChange,
  error,
  disabled,
}: SelectProps) {
  return (
    <div>
      {error && <div>{error}</div>}
      <label>{label}</label>
      <select
        aria-label={label}
        id={id}
        name={name}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          onChange && onChange(event.target.value);
        }}
      >
        {options.map(({value, label, disabled}, index) => (
          <option key={index} label={label} value={value} disabled={disabled}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function mockUiExtensionComponents() {
  vi.mock('@shopify/ui-extensions-react/customer-account', async () => ({
    ...(await vi.importActual('@shopify/ui-extensions-react/customer-account')),
    Button: (props: any) => <MockButton {...props} />,
    Pressable: (props: any) => <MockPressable {...props} />,
    Page: (props: any) => <MockPage {...props} />,
    ResourceItem: (props: any) => <MockResourceItem {...props} />,
    TextField: (props: any) => <MockTextField {...props} />,
    PhoneField: (props: any) => <MockPhoneField {...props} />,
    Link: (props: any) => <MockLink {...props} />,
    Choice: (props: any) => <MockChoice {...props} />,
    Select: (props: SelectProps) => <MockSelect {...props} />,
  }));
}
