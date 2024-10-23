import type {TextFieldProps as PolarisTextFieldProps} from '@shopify/polaris';
import {TextField as PolarisTextField} from '@shopify/polaris';
import {useFormContext} from '@rvf/remix';

type TextFieldProps = Omit<PolarisTextFieldProps, 'autoComplete'> & {
  name: string;
  label: string;
};

export const TextField = ({name, label, ...rest}: TextFieldProps) => {
  const form = useFormContext<any>();

  return (
    <PolarisTextField
      {...form.getInputProps(name, {
        ...rest,
        id: name,
        label,
        error: form.error(name) ?? false,
        autoComplete: 'off',
        value: form.value(name) ?? undefined,
        onChange: (value) => form.setValue(name, value),
      })}
      // getInputProps produces a ref for the element, which isn't allowed for function components
      {...{ref: undefined}}
    />
  );
};
