import {useFormContext} from '@rvf/remix';
import type {SelectProps as PolarisSelectProps} from '@shopify/polaris';
import {Select as PolarisSelect} from '@shopify/polaris';

type SelectProps = Omit<PolarisSelectProps, 'autoComplete'> & {
  name: string;
  label: string;
};

export const Select = ({name, label, ...rest}: SelectProps) => {
  const form = useFormContext<any>();

  return (
    <PolarisSelect
      {...form.getInputProps(name, {
        ...rest,
        id: name,
        label,
        error: form.error(name) ?? false,
        value: form.value(name) ?? undefined,
        onChange: (value) => form.setValue(name, value),
      })}
      // getInputProps produces a ref for the element, which isn't allowed for function components
      {...{ref: undefined}}
    />
  );
};
